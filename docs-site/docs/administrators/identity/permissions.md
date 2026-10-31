---
id: permissions
title: Permissions
sidebar_label: Permissions
sidebar_position: 2
doc_type: reference
audience: administrators
source_prd: none
ai_drafted: true
last_verified: 2026-10-31
tags: [identity]
---

Every permission and where it applies. CMDX calls a permission a **capability**. A role grants capabilities, and the app checks them before it lets someone act. This page lists the 225 capabilities built into CMDX. To see what a role grants, see [users and roles](./users-and-roles.md).

## How to read this page

| Column | Meaning |
| --- | --- |
| Capability | The key. Roles and the API refer to a capability by this key. |
| Name | The name shown in the permission matrix. |
| Risk | `low`, `medium` or `high`. Review `high` capabilities before you grant them. |
| Applies at | Where a [scope override](./users-and-roles.md#manage-roles) can change it: **Platform** (the whole install), **Tenant** or **Course**. |

The live list is on **Users** > **Roles & Permissions**, in each role's permission matrix. To read it from the API, call `GET /api/v1/capabilities`. It lists plugin capabilities too.

Some things to keep in mind:

- **Site administration.** The **Settings** screens check for a role. `site_admin:read` and `site_admin:manage` exist, but those screens don't use them. See [who can use the Settings screens](./users-and-roles.md#who-can-use-the-settings-screens).
- **Plugins.** A plugin can add its own capabilities, named `<plugin>.<action>`, such as `gamification.view`. They appear while the plugin is installed. Their risk is `medium`, and they apply at the platform and tenant levels.
- **Removed capabilities.** A capability that is no longer in the code is marked stale. It stays in the database but grants nothing.

## Capabilities

### Assignments

| Capability | Name | Risk | Applies at |
| --- | --- | --- | --- |
| `assignment:archive` | Archive Assignments | medium | Tenant |
| `assignment:create` | Create Assignments | medium | Tenant |
| `assignment:delete` | Delete Assignments | high | Tenant |
| `assignment:publish` | Publish Assignments | medium | Tenant |
| `assignment:update` | Update Assignments | medium | Tenant |
| `submission:create` | Create Submissions | low | Tenant |

### Calendar

| Capability | Name | Risk | Applies at |
| --- | --- | --- | --- |
| `calendar:analytics` | Calendar Analytics | high | Platform |
| `calendar:configure_holidays` | Configure Holiday Calendar | medium | Tenant |
| `calendar:create` | Create Calendar Events | medium | Platform |
| `calendar:delete` | Delete Calendar Events | high | Platform |
| `calendar:export` | Export Calendar iCal | low | Platform |
| `calendar:read` | View Calendar | low | Platform |
| `calendar:rsvp` | RSVP to Live Sessions | low | Platform |
| `calendar:rsvp_manage` | Manage Live Session RSVPs | medium | Platform |
| `calendar:update` | Edit Calendar Events | medium | Platform |

### Courses, categories and sections

| Capability | Name | Risk | Applies at |
| --- | --- | --- | --- |
| `category:create` | Create Course Categories | medium | Tenant |
| `category:delete` | Delete Course Categories | high | Tenant |
| `category:read` | Read Course Categories | low | Tenant |
| `category:update` | Update Course Categories | medium | Tenant |
| `course:archive` | Archive Courses | medium | Tenant |
| `course:clone` | Clone Courses | medium | Tenant |
| `course:complete` | Complete Courses | low | Tenant |
| `course:create` | Create Courses | medium | Tenant |
| `course:delete` | Delete Courses | high | Tenant |
| `course:publish` | Publish Courses | medium | Tenant |
| `course:read` | Read Courses | low | Tenant |
| `course:transfer` | Transfer Course Ownership | high | Tenant |
| `course:update` | Update Courses | medium | Tenant |
| `role_assignment:manage` | Manage Course Role Assignments | high | Tenant |
| `section:create` | Create Course Sections | medium | Tenant |
| `section:delete` | Delete Course Sections | high | Tenant |
| `section:lock` | Lock Course Sections | medium | Tenant |
| `section:read` | Read Course Sections | low | Tenant |
| `section:reorder` | Reorder Course Sections | medium | Tenant |
| `section:update` | Update Course Sections | medium | Tenant |

### Developer settings

| Capability | Name | Risk | Applies at |
| --- | --- | --- | --- |
| `developer.settings.view` | View Developer Settings (Dotted) | low | Platform |
| `developer_settings:diagnostics_edit` | Manage Diagnostics Overrides | high | Platform |
| `developer_settings:manage` | Manage Developer Settings | high | Platform |
| `developer_settings:read` | View Developer Settings | low | Platform |
| `developer_settings:testdata_execute` | Execute Test Data Operations | high | Platform |

### Enrollments

| Capability | Name | Risk | Applies at |
| --- | --- | --- | --- |
| `audit:read` | Enrollment Audit Read | high | Tenant |
| `enrollment:bulk` | Bulk Enroll | medium | Tenant |
| `enrollment:manage` | Manage Enrollments | medium | Tenant |
| `enrollment:read` | Read Enrollments | low | Tenant |
| `enrollment:read_self` | Read Own Enrollments | low | Tenant |
| `enrollment:self_enroll` | Self Enroll | low | Tenant |
| `key:create` | Create Enrollment Keys | medium | Tenant |
| `key:read` | Read Enrollment Keys | low | Tenant |
| `key:redeem` | Redeem Enrollment Keys | low | Tenant |
| `key:revoke` | Revoke Enrollment Keys | high | Tenant |
| `learning_module:read` | Read Learning Modules | low | Tenant |
| `rule:create` | Create Enrollment Rules | medium | Tenant |
| `rule:delete` | Delete Enrollment Rules | high | Tenant |
| `rule:read` | Read Enrollment Rules | low | Tenant |
| `rule:update` | Update Enrollment Rules | medium | Tenant |

### Feedback

| Capability | Name | Risk | Applies at |
| --- | --- | --- | --- |
| `feedback:close` | Close Feedback Forms | medium | Tenant |
| `feedback:create` | Create Feedback Forms | medium | Tenant |
| `feedback:delete` | Delete Feedback Forms | high | Tenant |
| `feedback:publish` | Publish Feedback Forms | medium | Tenant |
| `feedback:submit` | Submit Feedback | low | Tenant |
| `feedback:update` | Update Feedback Forms | medium | Tenant |
| `feedback:view` | View Feedback Forms | low | Tenant |
| `feedback:view_analytics` | View Feedback Analytics | medium | Tenant |
| `feedback:view_responses` | View Feedback Responses | medium | Tenant |

### Groups

| Capability | Name | Risk | Applies at |
| --- | --- | --- | --- |
| `dynamic_group:sync` | Sync Dynamic Groups | medium | Platform |
| `group:create` | Create Groups | medium | Platform |
| `group:delete` | Delete Groups | high | Platform |
| `group:read` | View Groups | low | Platform |
| `group:update` | Edit Groups | medium | Platform |
| `groups:admin` | Groups Admin | high | Platform |
| `join_request:create` | Request Group Join | low | Platform |
| `join_request:read` | View Join Requests | low | Platform |
| `join_request:review` | Review Join Requests | medium | Platform |
| `membership:add` | Add Group Members | medium | Platform |
| `membership:bulk_add` | Bulk Add Group Members | medium | Platform |
| `membership:bulk_remove` | Bulk Remove Group Members | high | Platform |
| `membership:import` | Import Group Members | medium | Platform |
| `membership:leave` | Leave Group | low | Platform |
| `membership:read` | View Group Members | low | Platform |
| `membership:remove` | Remove Group Members | high | Platform |

### HTML pages

| Capability | Name | Risk | Applies at |
| --- | --- | --- | --- |
| `html_pages:archive` | Archive HTML Pages | medium | Platform, Tenant |
| `html_pages:create` | Create HTML Pages | medium | Platform, Tenant |
| `html_pages:draft` | Open HTML Page Drafts | medium | Platform, Tenant |
| `html_pages:publish` | Publish HTML Pages | medium | Platform, Tenant |
| `html_pages:update` | Update HTML Pages | medium | Platform, Tenant |
| `html_pages:view_analytics` | View HTML Page Analytics | low | Platform, Tenant |
| `html_pages:view_history` | View HTML Page History | low | Platform, Tenant |
| `html_pages:view_published` | View Published HTML Pages | low | Platform, Tenant |

### Learning items

| Capability | Name | Risk | Applies at |
| --- | --- | --- | --- |
| `grade:override` | Override Grades | high | Platform |
| `grade:read` | Read Own Grades | low | Platform |
| `grade:read_any` | Read Any User Grades | medium | Platform |
| `gradebook:view` | View Gradebook | medium | Platform |
| `learning_item:archive` | Archive Learning Items | medium | Platform |
| `learning_item:create` | Create Learning Items | medium | Platform |
| `learning_item:delete` | Delete Learning Items | high | Platform |
| `learning_item:publish` | Publish Learning Items | medium | Platform |
| `learning_item:read` | Read Learning Items | low | Platform |
| `learning_item:update` | Update Learning Items | medium | Platform |
| `placement:manage` | Manage Placements | medium | Platform |
| `progress:override` | Override Progress | medium | Platform |
| `progress:read_any` | Read Any User Progress | medium | Platform |
| `progress:read_self` | Read Self Progress | low | Platform |

### Media

| Capability | Name | Risk | Applies at |
| --- | --- | --- | --- |
| `media:analytics_read` | View Media Analytics | low | Tenant |
| `media:captions_manage` | Manage Media Captions | medium | Tenant |
| `media:create` | Create Media | medium | Tenant |
| `media:manage` | Manage Media | medium | Tenant |
| `media:promote` | Promote Media | medium | Tenant |
| `media:read` | Read Media | low | Tenant |
| `media:read_any` | Read Any Media | low | Tenant |
| `media:review` | Review Media | medium | Tenant |
| `media:transcode_override` | Override Media Transcoding | high | Tenant |

### Notifications

| Capability | Name | Risk | Applies at |
| --- | --- | --- | --- |
| `notification:admin` | Notifications Admin | high | Platform |
| `notification:audit_read` | View Notification Audit Log | low | Platform |
| `notification:backup_manage` | Manage Notification Backups | medium | Platform |
| `notification:broadcast_manage` | Manage Notification Broadcasts | high | Platform |
| `notification:delivery_manage` | Manage Notification Deliveries | medium | Platform |
| `notification:delivery_read` | View Notification Deliveries | low | Platform |
| `notification:device_manage` | Manage Notification Devices | medium | Platform |
| `notification:gdpr_purge` | Purge Notification Data (GDPR) | high | Platform |
| `notification:inbox_read` | Read Notification Inbox | low | Platform |
| `notification:preferences_manage` | Manage Notification Preferences | low | Platform |
| `notification:preferences_read` | View Notification Preferences | low | Platform |
| `notification:send` | Send Ad-hoc Notifications | high | Platform |
| `notification:template_manage` | Manage Notification Templates | medium | Platform |
| `notification:template_read` | View Notification Templates | low | Platform |
| `notification:tenant_defaults_manage` | Manage Tenant Notification Defaults | medium | Platform |
| `notification:trigger_manage` | Manage Notification Triggers | medium | Platform |
| `notification:trigger_read` | View Notification Triggers | low | Platform |

### Plugins

| Capability | Name | Risk | Applies at |
| --- | --- | --- | --- |
| `plugin:manage` | Manage Plugins | high | Platform |
| `plugin:read` | View Plugins | low | Platform, Tenant |
| `plugin:tenant_toggle` | Enable/Disable Plugins | medium | Platform, Tenant |

### Quizzes

| Capability | Name | Risk | Applies at |
| --- | --- | --- | --- |
| `quiz:attempt` | Attempt Quizzes | low | Platform |
| `quiz:author` | Author Quizzes | medium | Platform |
| `quiz:grade` | Grade Quizzes | medium | Platform |
| `quiz:review_others` | Review Others' Attempts | medium | Platform |

### Roles

| Capability | Name | Risk | Applies at |
| --- | --- | --- | --- |
| `bundle:export` | Export RBAC Bundles | medium | Platform |
| `bundle:import` | Import RBAC Bundles | high | Platform |
| `context:create` | Create RBAC Contexts | medium | Platform, Tenant |
| `context:read` | Read RBAC Contexts | low | Platform, Tenant |
| `context_override:manage` | Manage Context Overrides | high | Platform, Tenant |
| `permission:evaluate` | Evaluate Permissions | low | Platform, Tenant |
| `role:create` | Create Roles | medium | Platform |
| `role:delete` | Delete Roles | high | Platform |
| `role:read` | Read Roles | low | Platform |
| `role:update` | Update Roles | medium | Platform |
| `role_assignment:bulk` | Bulk Role Assignments | medium | Platform |
| `role_assignment:create` | Create Role Assignments | medium | Platform |
| `role_assignment:revoke` | Revoke Role Assignments | high | Platform |
| `role_capability:manage` | Manage Role Capabilities | high | Platform |
| `role_capability:read` | Read Role Capabilities | low | Platform |
| `role_switch:manage` | Manage Role Switch | medium | Platform |

### Site administration

| Capability | Name | Risk | Applies at |
| --- | --- | --- | --- |
| `site_admin:manage` | Manage Site Administration | high | Platform, Tenant |
| `site_admin:read` | Read Site Administration | low | Platform, Tenant |

### Taxonomy

| Capability | Name | Risk | Applies at |
| --- | --- | --- | --- |
| `taxonomy:manage` | Manage Taxonomies | medium | Platform |
| `taxonomy:read` | Read Taxonomies | low | Platform |

### Trainings

| Capability | Name | Risk | Applies at |
| --- | --- | --- | --- |
| `location:activate` | Activate Location | low | Platform |
| `location:create` | Create Location | medium | Platform |
| `location:deactivate` | Deactivate Location | medium | Platform |
| `location:read` | Read Locations | low | Platform |
| `location:update` | Update Location | medium | Platform |
| `session:cancel` | Cancel Session | medium | Platform |
| `session:create` | Create Session | medium | Platform |
| `session:end` | End Session | medium | Platform |
| `session:read` | Read Sessions | low | Platform |
| `session:recording_update` | Update Session Recording | low | Platform |
| `session:start` | Start Session | medium | Platform |
| `session:update` | Update Session | medium | Platform |
| `training:archive` | Archive Training | medium | Platform |
| `training:create` | Create Training | medium | Platform |
| `training:delete` | Delete Training | high | Platform |
| `training:publish` | Publish Training | medium | Platform |
| `training:read` | Read Trainings | low | Platform |
| `training:update` | Update Training | medium | Platform |
| `vc_connector:read` | Read VC Connectors | low | Platform |
| `vc_integration:create` | Create VC Integration | high | Platform |
| `vc_integration:delete` | Delete VC Integration | medium | Platform |
| `vc_integration:read` | Read VC Integrations | low | Platform |
| `vc_integration:test` | Test VC Integration | low | Platform |
| `vc_integration:update` | Update VC Integration | high | Platform |

### URL resources

| Capability | Name | Risk | Applies at |
| --- | --- | --- | --- |
| `url_resource:archive` | Archive URL Resources | medium | Tenant, Course |
| `url_resource:create` | Create URL Resources | medium | Tenant, Course |
| `url_resource:delete` | Delete URL Resources | high | Tenant, Course |
| `url_resource:placement_manage` | Manage URL Resource Placements | medium | Tenant, Course |
| `url_resource:publish` | Publish URL Resources | medium | Tenant, Course |
| `url_resource:read` | Read URL Resources | low | Tenant, Course |
| `url_resource:update` | Update URL Resources | medium | Tenant, Course |
| `url_resource:visit_read` | Read URL Resource Visits | low | Tenant, Course |

### Users

| Capability | Name | Risk | Applies at |
| --- | --- | --- | --- |
| `dashboard:create` | Create Dashboard | medium | Platform |
| `dashboard:delete` | Delete Dashboard | high | Platform |
| `dashboard:read` | Read Dashboard | low | Platform |
| `dashboard:update` | Update Dashboard | medium | Platform |
| `impersonation:block_account_delete` | Block Impersonated Account Delete | high | Platform |
| `impersonation:block_email_change` | Block Impersonated Email Change | medium | Platform |
| `impersonation:block_password_change` | Block Impersonated Password Change | medium | Platform |
| `import:admin` | Import Admin | high | Platform |
| `import:delete` | Delete Import | high | Platform |
| `import:execute` | Execute Import | medium | Platform |
| `import:read` | Read Import | low | Platform |
| `preferences:read` | Read Preferences | low | Platform |
| `preferences:update` | Update Preferences | low | Platform |
| `profile:delete` | Delete Profile | high | Platform |
| `profile:read` | Read Profile | low | Platform |
| `profile:update` | Update Profile | medium | Platform |
| `profile_field:create` | Create Profile Fields | medium | Platform |
| `profile_field:delete` | Delete Profile Fields | high | Platform |
| `profile_field:read` | Read Profile Fields | low | Platform |
| `profile_field:update` | Update Profile Fields | medium | Platform |
| `profile_field_category:create` | Create Profile Field Categories | medium | Platform |
| `profile_field_category:delete` | Delete Profile Field Categories | high | Platform |
| `profile_field_category:read` | Read Profile Field Categories | low | Platform |
| `profile_field_category:update` | Update Profile Field Categories | medium | Platform |
| `users.profile_fields.manage` | Manage Profile Fields Schema | high | Platform |
| `users:admin` | Users Admin | high | Platform |
| `users:create` | Create Users | medium | Platform |
| `users:delete` | Delete Users | high | Platform |
| `users:impersonate` | Impersonate User | high | Platform |
| `users:read` | Read Users | low | Platform |
| `users:update` | Update Users | medium | Platform |
| `widget:create` | Create Widget | medium | Platform |
| `widget:delete` | Delete Widget | high | Platform |
| `widget:read` | Read Widget | low | Platform |
| `widget:update` | Update Widget | medium | Platform |

### Video

| Capability | Name | Risk | Applies at |
| --- | --- | --- | --- |
| `video:manage` | Manage Videos | medium | Tenant, Course |
| `video:upload` | Upload Videos | medium | Tenant, Course |
| `video:view` | View Videos | low | Tenant, Course |

## Related

- [Users and roles](./users-and-roles.md)
- [Capability catalog for developers](../../developers/architecture/capability-catalog.md)
