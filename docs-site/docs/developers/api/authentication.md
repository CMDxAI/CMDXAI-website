---
id: authentication
title: Authenticate API requests
sidebar_label: Authentication
sidebar_position: 1
doc_type: how-to
audience: developers
source_prd: none
ai_drafted: true
last_verified: 2026-10-27
tags: [api, authentication]
---

Sign in to the CMDX API with an email and password, send the token with each request, and refresh or revoke it.

## Prerequisites

- A running CMDX. The examples use the API at `http://localhost:8000`, as set up in [Install CMDX and create a course](/getting-started/quick-start). Replace it with your own address.
- An account that signs in with an email and password.
- `curl` and `jq`.

## Steps

### 1. Get a token

Send your email and password as a form to `POST /api/v1/tokens`:

```bash
curl -s -X POST http://localhost:8000/api/v1/tokens \
  --data-urlencode 'username=<email>' \
  --data-urlencode 'password=<password>' | jq
```

The response holds an access token and a refresh token:

```json
{
  "success": true,
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIs...",
    "refresh_token": "eyJhbGciOiJIUzI1NiIs...",
    "token_type": "bearer"
  },
  "message": null,
  "meta": null,
  "pagination": null,
  "errors": null
}
```

Keep both. The examples below read them from shell variables:

```bash
ACCESS_TOKEN=<access_token>
REFRESH_TOKEN=<refresh_token>
```

The tenant you sign in to decides which security policy applies: token lifetimes, whether you need multi-factor authentication, which addresses may sign in, and when your password expires. To choose it, add `-H 'X-Tenant-ID: <tenant-id>'` to the request. Without the header, CMDX uses your only active tenant, or the global policy if you belong to several tenants or none. A header that isn't a UUID fails with `400`, and a tenant you aren't an active member of fails with `403`.

This endpoint accepts 5 requests a minute, a fixed limit. After 5 failed attempts for the same email from the same address, sign-in is blocked for 15 minutes, even with the right password. An administrator can change the number of attempts and the length of the block in the security policy.

If the response to your next request is `401` with `ERR_MFA_REQUIRED`, complete step 2 first. Otherwise, go to step 3.

### 2. Complete multi-factor authentication, if required

When the security policy requires multi-factor authentication, the token from step 1 works only for the `/api/v1/tokens` and `/api/v1/auth/` endpoints. Other requests return `401`:

```json
{
  "detail": {
    "error": "unauthorized",
    "message": "Multi-factor authentication is required",
    "code": "ERR_MFA_REQUIRED"
  }
}
```

Send a code from the account's authenticator app to `POST /api/v1/auth/mfa/verify`:

```bash
curl -s -X POST http://localhost:8000/api/v1/auth/mfa/verify \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"code": "<six-digit-code>"}' | jq
```

If you sent `X-Tenant-ID` in step 1, send it here too, so the same security policy applies. If the account has no authenticator app, send `{"password": "<password>"}` instead of the code. To set up an app, send the password to `POST /api/v1/auth/mfa/enroll`, add the returned `provisioning_uri` to the app, then send its first code to `POST /api/v1/auth/mfa/enroll/confirm`.

The response has a new access token and refresh token, in the same shape as step 1. Replace both shell variables with them and use them from then on. The new refresh token has the standard lifetime, even if you signed in with `remember_me=true`.

### 3. Check the token

Send the access token in the `Authorization` header. `GET /api/v1/users/me` returns the account it belongs to:

```bash
curl -s http://localhost:8000/api/v1/users/me \
  -H "Authorization: Bearer $ACCESS_TOKEN" | jq '.data | {email, role: .role.name}'
```

```json
{
  "email": "<email>",
  "role": "admin"
}
```

The full response also lists the account's profile and its `capabilities`.

### 4. Choose a tenant

A token isn't tied to a tenant. Each request that works on a tenant's data names the tenant in the `X-Tenant-ID` header. List the tenants you belong to:

```bash
curl -s http://localhost:8000/api/v1/organizations/mine \
  -H "Authorization: Bearer $ACCESS_TOKEN" | jq '.data[] | {id, slug, name}'
```

```json
{
  "id": "<tenant-id>",
  "slug": "<tenant-slug>",
  "name": "<tenant-name>"
}
```

Keep the `id` of the tenant you want to work in:

```bash
TENANT_ID=<tenant-id>
```

### 5. Call the API

Send both headers. For example, list the tenant's courses:

```bash
curl -s http://localhost:8000/api/v1/courses \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "X-Tenant-ID: $TENANT_ID" | jq '.pagination'
```

```json
{
  "page": 1,
  "limit": 20,
  "total": 0,
  "total_pages": 1
}
```

The tenant must be one you're a member of. Without the header, routes behave differently: some return `400`, some such as `/api/v1/courses` use your only active tenant, and others return only data that belongs to no tenant. Always send the header for tenant data. For how CMDX finds and checks the tenant, see [Multi-tenancy](../architecture/multi-tenancy.md).

### 6. Refresh the access token

Before the access token expires, get a new one with the refresh token. This endpoint takes JSON:

```bash
curl -s -X POST http://localhost:8000/api/v1/tokens/refresh \
  -H 'Content-Type: application/json' \
  -d "{\"refresh_token\": \"$REFRESH_TOKEN\"}" | jq
```

```json
{
  "success": true,
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIs...",
    "token_type": "bearer"
  },
  "message": null,
  "meta": null,
  "pagination": null,
  "errors": null
}
```

The response has a new access token only. Keep using the same refresh token until it expires. This endpoint accepts 10 requests a minute.

### 7. Sign out

Revoke the refresh token when you're done:

```bash
curl -s -X DELETE http://localhost:8000/api/v1/tokens \
  -H 'Content-Type: application/json' \
  -d "{\"refresh_token\": \"$REFRESH_TOKEN\"}" | jq
```

The response is `{"success": true, "data": {"message": "Logged out"}, ...}`.

The refresh token stops working. An access token you already have stays valid until it expires. To end every session for the account at once, including all access tokens, send `DELETE /api/v1/tokens/all` with the access token:

```bash
curl -s -X DELETE http://localhost:8000/api/v1/tokens/all \
  -H "Authorization: Bearer $ACCESS_TOKEN" | jq
```

Changing the account's password, or an administrator suspending it, also ends every session.

## How long tokens last

An administrator sets token lifetimes in the security policy. By default, both tokens last 8 hours, the length of the session timeout. If you sign in with `remember_me=true` in the form, the refresh token lasts 30 days instead, unless the administrator has turned that option off or changed the number of days. The tokens from multi-factor verification (step 2) always have the standard lifetime. The policy that applies is the one for the tenant you signed in to (step 1).

## Other ways to sign in

- **LDAP:** if your installation uses LDAP, send `{"username": "<username>", "password": "<password>"}` as JSON to `POST /api/v1/auth/sso/ldap/login`. If LDAP is set up for your tenant rather than the whole installation, also send `X-Tenant-ID: <tenant-id>`. Without it, CMDX uses the installation's LDAP settings, or returns `403` if LDAP isn't turned on there. The response has the same tokens as step 1.
- **Single sign-on, Google and GitHub:** these flows run in a browser. They end with a one-time code, which the app exchanges for tokens at `POST /api/v1/auth/oauth/exchange`.

CMDX has no API keys or service accounts. An integration signs in as a user account.

## Verify

`GET /api/v1/users/me` with your access token returns `200` and your email address. With a revoked or expired token it returns `401`.

## Troubleshooting

Error responses have a `detail` field. Its text is translated into the caller's language, so check the status code, and the `code` where there is one, rather than the text.

| Status and detail | Cause | Fix |
| --- | --- | --- |
| `401` `Invalid email or password` | The email or password is wrong, the account is inactive, or the security policy doesn't allow sign-in from your IP address. | Check the credentials. An administrator can check the account's status and the allowed addresses. |
| `403` with `detail.code` `ERR_PASSWORD_EXPIRED` | The password is older than the security policy allows. | Reset the password with the forgot-password link on the sign-in page, or ask an administrator to send a reset email. Then sign in again. |
| `403` with `detail.code` `ERR_IP_NOT_ALLOWED` | The security policy doesn't allow requests from your IP address. | Send requests from an allowed address, or ask an administrator to add yours. |
| `429` `Too many failed login attempts` | Too many failed sign-ins for this email from your address. | Wait 15 minutes, or the time the security policy sets. |
| `429` `Rate limit exceeded` | Too many requests in a minute. | Wait the number of seconds in the `Retry-After` header. |
| `401` `Not authenticated` | The `Authorization` header is missing or doesn't start with `Bearer`. | Send `Authorization: Bearer <access-token>`. |
| `401` `Invalid or expired token` | The access token has expired or isn't valid. | Refresh it (step 6), or sign in again. |
| `401` `Invalid token type` | You sent the refresh token as the access token. | Send the access token. |
| `401` `Token has been revoked` | Every session was ended: sign-out everywhere, a password change or a suspension. | Sign in again. |
| `401` `Invalid refresh token` | The refresh token has expired or was revoked. | Sign in again. |
| `401` with `detail.code` `ERR_MFA_REQUIRED` | The security policy requires multi-factor authentication. | Complete step 2. |
| `400` `X-Tenant-ID must be a valid UUID.` | The tenant header isn't a UUID. | Use an `id` from `/api/v1/organizations/mine`. |
| `403` `Active organization membership is required.` | You aren't an active member of that tenant. | Use a tenant you belong to. |
| `400` `Unknown tenant.` | No tenant has that id. Administrators get this instead of `403`. | Use an `id` from `/api/v1/organizations/mine`. |
