---
id: users-and-roles
title: Users and roles
sidebar_label: Users and roles
sidebar_position: 1
doc_type: reference
audience: administrators
source_prd: none
ai_drafted: true
last_verified: 2026-10-31
tags: [identity]
---

The built-in roles and what each one can do. A person can hold several roles, at different levels. This page lists the standard roles, the tenant roles, and which roles open the administration screens.

## How access works

Three things decide what someone can do:

| Layer | Set on | Decides |
| --- | --- | --- |
| Roles | **Users** > **Roles & Permissions** | Which [capabilities](./permissions.md) a person has. Most of the app checks these. |
| Scope | The role assignment | Where a role applies: the whole install, one tenant, a category or a course. A role also applies to everything below its scope. |
| Tenant role | **Settings** > **Tenancy** > **Members** | A person's role inside one tenant. |

A deeper scope wins. A scope override can add a capability to a role, or remove one, at a specific scope. The screen shows the order as system, tenant, category, course and user.

## Standard roles

CMDX creates these roles at install. Their capabilities are defined in code and copied into the database.

| Role | Slug | Archetype | What it can do |
| --- | --- | --- | --- |
| Super Administrator | `super-admin` | admin | All capabilities, including plugins and developer settings |
| Administrator | `admin` | admin | The same capabilities as Super Administrator |
| Tenant Administrator | `tenant-admin` | admin | Everything inside a tenant, except developer settings and installing plugins |
| Program Manager | `program-manager` | manager | Manages groups and content, reads roles and runs notifications. No role changes. |
| Course Manager | `course-manager` | manager | The same grants as Program Manager |
| Enrollment Admin | `enrollment_admin` | manager | All enrollment capabilities |
| Enrollment Manager | `enrollment_manager` | manager | Manages enrollments |
| Instructor | `instructor` | instructor | Creates and teaches courses, quizzes, assignments and training |
| Teaching Assistant | `teaching-assistant` | instructor | Helps with teaching, and reads courses, enrollments and progress |
| Content Author | `content-author` | author | Creates courses, learning items and quizzes |
| Reviewer | `reviewer` | reviewer | Reviews learning items and quizzes, with read access to courses |
| User | `user` | user | Learner self-service. New accounts get this role by default. |
| Learner | `learner` | learner | The same grants as User |
| Guest | `guest` | guest | Reads profiles, learning items, taxonomy and URL resources |
| Auditor | `auditor` | auditor | Read-only access to Site Admin, with audit logs and read access to courses and enrollments |

## Platform roles

These roles act across the whole install, and the role must be granted platform-wide. The same role granted inside one tenant doesn't reach any other tenant.

| Role | Can do |
| --- | --- |
| `platform_superadmin` | Creates and lists every tenant, and bypasses tenant role checks. Only someone who already holds this role can grant it. |
| `admin` | Changes global settings, and acts across tenants. |
| `auditor` | Reads global settings and logs across tenants. |

The Super Administrator created by the install wizard holds `platform_superadmin` and `admin`, and is an `org_admin` of the first tenant.

## Tenant roles

Each tenant membership has one of these roles. They are separate from the standard roles above, and are set on **Settings** > **Tenancy** > **Members**.

| Role | Role key |
| --- | --- |
| Organization administrator | `org_admin` |
| Learning and development manager | `ld_manager` |
| Department manager | `dept_manager` |
| Instructor | `instructor` |
| Course author | `course_author` |
| Learner | `learner` |
| Guest learner | `guest_learner` |
| Compliance officer | `compliance_officer` |
| Reporting analyst | `reporting_analyst` |
| Group administrator | `group_admin` |

An organization's default permissions for these roles can be overridden for that organization.

## Who can use the Settings screens

The **Settings** screens check for a role, not a capability. Granting `site_admin:read` or `site_admin:manage` to a custom role has no effect on them.

| Access | Roles |
| --- | --- |
| Change global settings | `super-admin`, `platform_superadmin`, `admin` |
| Read global settings and logs | The roles above, and `auditor` |
| Change tenant settings | The roles above, except `auditor`, and `tenant-admin`, `org_admin` |
| Read tenant settings | All of the above, and `auditor` |

## Manage users

Go to **Users**:

- **Add one person.** Select the option to add a user, and fill in their name, email, role and password. To let them set their own password, turn on **Send invitation email**. This needs [working email](../configuration/email.md).
- **Add many people.** Use **Users** > **Import** with a CSV file.
- **Export.** Use **Users** > **Export**.
- **Group people.** Use **Groups & Batches**. See [manage groups](./groups.md).
- **Collect more details.** Use **Profile fields**.

### Recover an account that lost its authenticator

A platform administrator can remove a user's multi-factor authentication:

```bash
curl -X DELETE https://lms.example.com/api/v1/users/<user-id>/mfa \
  -H "Authorization: Bearer $TOKEN"
```

This also signs the person out. They can enroll again at their next sign-in.

## Manage roles

Go to **Users** > **Roles & Permissions**. The tabs are:

| Tab | Use it to |
| --- | --- |
| **All roles** | See roles, create a new role and edit its permission matrix. |
| **Check access** | Find out why someone can or can't do something. |
| **Assignments** | See who holds which role and where, set expiry dates, and revoke roles. |
| **Scope overrides** | Add or remove a capability for a role at one scope. |
| **Export / import** | Move role definitions between installs as a bundle. Importing runs a dry run first. |

To grant a role, use **Assign role**, or **Bulk assign via CSV** for many people. A role assignment can have an expiry date.

**Role switching** lets an administrator preview the app as another role. Each switch is time-limited and written to the audit trail.

## Related

- [Permissions](./permissions.md): every capability
- [Manage groups](./groups.md)
- [Tenant settings](../tenants/tenant-settings.md)
- [Capability catalog for developers](../../developers/architecture/capability-catalog.md)
