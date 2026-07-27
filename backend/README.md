# Chatflow Backend

WhatsApp SaaS platform backend built on Express + Prisma + PostgreSQL. Provides three portals sharing one database: a **Super-Admin** control plane, a **Reseller** portal (white-label customer management), and a **Customer-Owner** portal (the actual WhatsApp Business API product).

- **Runtime:** Node.js (tsx) + Express 5
- **ORM:** Prisma 6 (PostgreSQL via `@prisma/client`)
- **Auth:** JWT (`USER_JWT_SECRET`, `JWT_SECRET`) with `tokenVersion`-based rotation, plus service tokens (`SERVICE_TOKEN_SECRET`) for bot/template/messaging APIs
- **External integrations:** Meta WhatsApp Cloud API, SMTP for transactional email

The single Prisma instance lives in [`src/config/prisma.ts`](src/config/prisma.ts) and is imported via `import prisma from "<relative>/config/prisma"` from every handler.

---

## Table of contents

- [Quick start](#quick-start)
- [Architecture](#architecture)
- [Environment variables](#environment-variables)
- [Response envelope](#response-envelope)
- [Authentication model](#authentication-model)
- [API surface](#api-surface)
  - [Health](#health)
  - [Super-Admin API (`/super-admin`)](#super-admin-api--super-admin)
  - [Reseller API (`/reseller`)](#reseller-api--reseller)
  - [Customer-Owner API (`/user`)](#customer-owner-api--user)
- [Domain model](#domain-model)
- [Project layout](#project-layout)
- [Scripts](#scripts)

---

## Quick start

```bash
# 1. Install deps (auto-runs `prisma generate` via postinstall)
npm install

# 2. Provision the database
#    Make sure DATABASE_URL points at a reachable PostgreSQL instance.
npx prisma migrate deploy
node src/prisma/seed.js          # seeds Starter/Growth/Scale plans + sample data

# 3. Start the dev server (tsx watch)
npm run dev

# 4. Or build + start in production mode
npm run build                    # tsc → dist/
npm start                        # tsx src/server.ts
```

The server listens on `PORT` (default **3000**) and accepts requests from `FRONTEND_URL` (CORS).

---

## Architecture

```
src/
├── server.ts                  Express bootstrap (CORS, JSON, static /uploads)
├── config/
│   ├── prisma.ts              Shared PrismaClient (default-exported)
│   ├── index.js               App-wide config
│   └── responseCode.js        Standard HTTP-style status codes
├── prisma/
│   ├── schema.prisma          DB schema
│   ├── seed.js                Demo data (plans, templates, sample customers)
│   └── migrations/
├── middleware/
│   ├── requireAuth.ts         JWT → req.auth (USER | RESELLER | ADMIN)
│   ├── adminAuth.ts           Admin-only guard
│   ├── serviceAuth.ts         Service-token guard (TEMPLATE / BOT / MESSAGE)
│   ├── requireOwner.js        CUSTOMER_OWNER role guard
│   ├── checkPermission.js     Per-permission gate for internal admins
│   ├── superAdminOnly.js      SYSTEM_ADMIN-only guard
│   ├── validator.js           Zod schema runner (body/params/query)
│   ├── multerUpload.js        Single-file memory upload
│   ├── uploadCsv.js           CSV streaming upload
│   └── parseJSONFields.js     JSON-stringified form fields → objects
├── routes/
│   ├── super-admin/           Platform control plane  → mounted at /super-admin
│   ├── reseller/              White-label portal       → mounted at /reseller
│   └── customer-owner/        Customer self-service    → mounted at /user
└── utils/
    ├── sendEmail.js           SMTP mailer
    ├── hashToken.js           Token hashing helpers
    └── mediaUrl.js            Meta media URL helpers
```

Three independent routers are mounted on the Express app. **All routes use a single shared PrismaClient** (see `src/config/prisma.ts`), which means a single connection pool and consistent transaction semantics across the whole API.

---

## Environment variables

| Variable | Used by | Purpose |
|---|---|---|
| `DATABASE_URL` | Prisma | PostgreSQL connection string |
| `PORT` | server.ts | HTTP listen port (default 3000) |
| `FRONTEND_URL` | server.ts (CORS) | Allowed origin for browser clients |
| `USER_JWT_SECRET` | `requireAuth.ts`, login | JWT secret for user/reseller/admin tokens |
| `JWT_SECRET` | legacy/admin login | Admin JWT secret (fallback) |
| `USER_JWT_EXPIRATION` | login | Token lifetime (e.g. `7d`) |
| `JWT_EXPIRATION` | admin login | Admin token lifetime |
| `SERVICE_TOKEN_SECRET` | `serviceAuth.ts` | HMAC for service-API tokens (`TEMPLATE`/`BOT`/`MESSAGE`) |
| `WHATSAPP_VERIFY_TOKEN` | Meta webhook GET | Echoed back during Meta webhook verification |
| `WHATSAPP_ACCESS_TOKEN` | Outbound Meta API | System-user access token |
| `META_API_VERSION` | Outbound Meta API | e.g. `v20.0` |
| `META_APP_ID` / `META_WABA_ID` / `PHONE_NUMBER_ID` | Outbound Meta API | WhatsApp identifiers |
| `APP_BASE_URL` / `PUBLIC_BASE_URL` | Meta media, links | Public base URL for media + callbacks |
| `SMTP_USER` / `SMTP_PASS` | `sendEmail.js` | Team-invite and OTP emails |

---

## Response envelope

Every handler returns the same envelope (`src/config/responseCode.js`):

```json
{
  "status":    1,            // 1 = success, 0 = error
  "message":   "human-readable status",
  "statusCode": 200,          // matches RESPONSE_CODES (200/201/400/401/403/404/409/500)
  "data":      { /* payload or {} */ }
}
```

Conventional `RESPONSE_CODES`:

| Key | Code |
|---|---|
| `GET` | 200 |
| `POST` | 201 |
| `DELETE` | 200 |
| `BAD_REQUEST` | 400 |
| `UNAUTHORIZED` | 401 |
| `FORBIDDEN` | 403 |
| `NOT_FOUND` | 404 |
| `ALREADY_EXIST` | 409 |
| `ERROR` | 500 |

---

## Authentication model

The middleware stack resolves three principal types — `USER` (customer-owner / team), `RESELLER`, and `ADMIN` — and attaches a unified `req.auth` object:

```js
// USER
req.auth = { userType: "USER", userId, accountId, roleId, role, roleType, wabaVerification, ... }

// RESELLER
req.auth = { userType: "RESELLER", resellerId, commissionRate, balance, ... }

// ADMIN
req.auth = { userType: "ADMIN", adminId, roleId, role, roleType, ... }
```

Middleware, in order of strictness:

| Middleware | What it checks |
|---|---|
| `requireAuth` | Valid JWT + matching `tokenVersion` on the principal row → populates `req.auth` |
| `adminAuth` | `req.auth.userType === "ADMIN"` |
| `requireOwner` | `req.auth.roleType === "CUSTOMER_OWNER"` |
| `checkPermission(PERM)` | `req.admin.role.permissions` includes `PERM`; `SYSTEM_ADMIN` bypasses |
| `superAdminOnly` | `req.admin.role.roleType === "SYSTEM_ADMIN"` |
| `serviceAuth("TEMPLATE"\|"BOT"\|"MESSAGE")` | Valid service-API token of the given type |
| `validator(schema, "body"\|"params"\|"query")` | Zod validation against the named request slice |

`tokenVersion` is a per-principal counter; bumping it (e.g. on password change or "force logout") instantly invalidates every active session.

---

## API surface

Three top-level routers, all prefixed by `/api/v1` would happen at the reverse proxy level — here they are mounted at:

| Router | Mount | Total endpoints |
|---|---|---|
| Health | `/api/v1/health` | 1 |
| Super-Admin | `/super-admin` | 25 |
| Reseller | `/reseller` | 20 |
| Customer-Owner | `/user` | 111 |
| **Total** | | **157** |

### Health

| Method | Path | Description | Auth |
|---|---|---|---|
| GET | `/api/v1/health` | Liveness probe — returns `{ msg: "server is running healthy!" }` | none |

---

### Super-Admin API (`/super-admin`)

Platform control plane. The first `SYSTEM_ADMIN` is bootstrapped via `/auth/register`; subsequent admins are created through `/internal-admin/create-admin` and assigned a `Role` (with permissions) via `/roles/assign`.

> **Auth notes**
> - Endpoints flagged `adminAuth` require a valid admin JWT.
> - Endpoints flagged additionally as `SYSTEM_ADMIN` enforce `roleType === "SYSTEM_ADMIN"` inline (these are the "internal admin" surfaces, distinct from the public profile routes).
> - `/auth/logout-all` relies on `req.admin` being present (token is decoded but not version-checked at this layer).

#### `/super-admin/auth`

| Method | Path | Description | Auth | Body |
|---|---|---|---|---|
| POST | `/super-admin/auth/register` | One-time bootstrap of the first `SYSTEM_ADMIN`. Rejects if one already exists. | none | `{ name, email, phone, password, userName? }` |
| POST | `/super-admin/auth/login` | Login as super/internal admin; issues JWT (supports `rememberMe`). | none | `{ email, password, rememberMe? }` |
| POST | `/super-admin/auth/change-password` | Change the authenticated admin's password; rotates `tokenVersion`. | adminAuth | `{ oldPassword, newPassword }` |
| POST | `/super-admin/auth/logout-all` | Rotate `tokenVersion` to invalidate every active session for the authed admin. | none (relies on `req.admin`) | — |

#### `/super-admin/internal-admin`

| Method | Path | Description | Auth | Body / Params |
|---|---|---|---|---|
| POST | `/super-admin/internal-admin/create-admin` | Create an internal admin; auto-creates role if `roleName` given; assigns permissions. | adminAuth + SYSTEM_ADMIN | `{ name, email, phone, password, userName?, roleName?, permissionIds[]? }` |
| GET | `/super-admin/internal-admin/read` | Paginated admin list (search, status, roleType filters). | adminAuth + SYSTEM_ADMIN | query: `page, limit, search, status, roleType` |
| PUT | `/super-admin/internal-admin/update` | Update admin fields (name, phone, isActive, isVerified, roleId). Blocks self-deactivation. | adminAuth + SYSTEM_ADMIN | `{ adminId, name?, phone?, isActive?, isVerified?, roleId? }` |
| DELETE | `/super-admin/internal-admin/delete` | Soft-delete admin (`isDeleted=true`, `isActive=false`). Blocks self-delete. | adminAuth + SYSTEM_ADMIN | `{ adminId }` |
| GET | `/super-admin/internal-admin/:adminId` | Fetch one admin's detail by id. | adminAuth + SYSTEM_ADMIN | params: `adminId` |
| PATCH | `/super-admin/internal-admin/status` | Activate/deactivate an admin; blocks self-status change. | adminAuth + SYSTEM_ADMIN | `{ adminId, isActive }` |
| POST | `/super-admin/internal-admin/force-logout` | Rotate another admin's `tokenVersion` to force their logout. | adminAuth + SYSTEM_ADMIN | `{ adminId }` |

#### `/super-admin/permission`

| Method | Path | Description | Auth | Body |
|---|---|---|---|---|
| POST | `/super-admin/permission/create` | Create a new permission (name uppercased). | adminAuth + SYSTEM_ADMIN | `{ name }` |
| POST | `/super-admin/permission/assign` | Upsert one or more permissions onto a role. | adminAuth + SYSTEM_ADMIN | `{ roleId, permissionIds[] }` |
| GET | `/super-admin/permission/list` | List all active, non-deleted permissions sorted by name. | adminAuth | — |
| DELETE | `/super-admin/permission/remove` | Unlink a permission from a role. | adminAuth + SYSTEM_ADMIN | `{ roleId, permissionId }` |
| GET | `/super-admin/permission/role/:roleId` | List permissions currently linked to a role. | adminAuth | params: `roleId` |
| PUT | `/super-admin/permission/update` | Update a permission's `name` and/or `isActive`. | adminAuth + SYSTEM_ADMIN | `{ permissionId, name?, isActive? }` |

#### `/super-admin/profile`

| Method | Path | Description | Auth | Body |
|---|---|---|---|---|
| GET | `/super-admin/profile/get` | Fetch the authenticated admin's profile (with role). | adminAuth | — |
| PUT | `/super-admin/profile/update` | Update the authed admin's name, userName, email, phone (uniqueness-checked on userName). | adminAuth (SYSTEM_ADMIN or INTERNAL_ADMIN) | `{ name, userName?, email, phone }` |

#### `/super-admin/roles`

The folder is named `role/` but mounted at `/roles` (`rollRoutes` in `index.js`).

| Method | Path | Description | Auth | Body |
|---|---|---|---|---|
| POST | `/super-admin/roles/create` | Create a new role (name uppercased). | adminAuth + SYSTEM_ADMIN | `{ name, roleType }` |
| GET | `/super-admin/roles/read` | Paginated roles with optional `roleType`, `isActive`, `includeDeleted` filters. | adminAuth + SYSTEM_ADMIN | query: `page, limit, roleType, isActive, includeDeleted` |
| GET | `/super-admin/roles/getById` | Fetch one role with its permissions. (Validator runs against `body`.) | adminAuth + SYSTEM_ADMIN | `{ id }` |
| PUT | `/super-admin/roles/update` | Update role's name and/or `isActive`; blocks SYSTEM_ADMIN name collision. | adminAuth + SYSTEM_ADMIN | `{ id, name?, isActive? }` |
| PUT | `/super-admin/roles/assign` | Assign a role to an admin; blocks self-assignment and SYSTEM_ADMIN role type. | adminAuth + SYSTEM_ADMIN | `{ adminId, roleId }` |
| DELETE | `/super-admin/roles/delete` | Soft-delete a role; blocks SYSTEM_ADMIN deletion and roles still assigned to admins. | adminAuth + SYSTEM_ADMIN | `{ roleId }` |

---

### Reseller API (`/reseller`)

White-label customer-management portal. Resellers onboard customers, assign plans, recharge credits, and earn commission on subscriptions.

> **Auth notes**
> - Every handler (except `/auth/login`) checks `req.auth.userType === "RESELLER"` in addition to `requireAuth`.
> - All endpoints return the standard envelope.
> - `commissionRate` and `balance` are loaded into `req.auth` by `requireAuth`.

#### `/reseller/auth`

| Method | Path | Description | Auth | Body |
|---|---|---|---|---|
| POST | `/reseller/auth/login` | Reseller login (email / userName / phone + password). | validator only | `{ identifier, password, rememberMe }` |

#### `/reseller/profile`

| Method | Path | Description | Auth | Body |
|---|---|---|---|---|
| GET | `/reseller/profile/me` | Get current reseller profile. | requireAuth | — |
| PUT | `/reseller/profile/update` | Update reseller profile (any reseller field, validated). | requireAuth | `{ ...resellerFields }` |

#### `/reseller/dashboard`

| Method | Path | Description | Auth |
|---|---|---|---|
| GET | `/reseller/dashboard/stats` | Counts of customers, MRR, messages, commission. | requireAuth |
| GET | `/reseller/dashboard/overview` | Recent customers, plans, subscriptions, revenue trend, message stats. | requireAuth |

#### `/reseller/customers`  *(note: plural mount)*

| Method | Path | Description | Auth | Body / Query |
|---|---|---|---|---|
| GET | `/reseller/customers/` | List customers under the reseller with pagination & filters. | requireAuth | query: `page, limit, search, isActive, status, planId, revenueMin, revenueMax, usageMin, usageMax` |
| POST | `/reseller/customers/create` | Create customer account + owner (auto-derives username, hashes password). | requireAuth | `{ companyName, ownerFirstName, ownerLastName, ownerEmail, ownerPhone, ownerPassword, planId? }` |
| PUT | `/reseller/customers/update` | Update customer company name and owner profile. | requireAuth | `{ accountId, companyName, ownerFirstName, ownerLastName, ownerEmail, ownerPhone }` |
| PATCH | `/reseller/customers/status` | Activate/pause a single customer (cascades to users). | requireAuth | `{ accountId, isActive }` |
| PATCH | `/reseller/customers/bulk-status` | Bulk activate/pause many customers. | requireAuth | `{ accountIds[], isActive }` |
| GET | `/reseller/customers/detail` | Full detail for one customer (users, subscription, counts). | requireAuth | query: `accountId` |
| POST | `/reseller/customers/change-plan` | Change plan for one customer (ends active sub, creates new). | requireAuth | `{ accountId, planId }` |
| POST | `/reseller/customers/bulk-change-plan` | Change plan for many customers at once. | requireAuth | `{ accountIds[], planId }` |
| POST | `/reseller/customers/recharge` | Recharge credit balance (creates `BillingTransaction`). | requireAuth | `{ accountId, amount }` |
| POST | `/reseller/customers/add-team-member` | Add (or resurrect soft-deleted) team member/agent. | requireAuth | `{ accountId, firstName, lastName, email, phone, password, roleType? }` |
| POST | `/reseller/customers/send-test-message` | Record a reseller-sent test message (logs only). | requireAuth | `{ accountId, to, message }` |
| POST | `/reseller/customers/bulk-send-campaign` | Queue a bulk text "campaign" to multiple customers' owners. | requireAuth | `{ accountIds[], message }` |

#### `/reseller/plans`

| Method | Path | Description | Auth |
|---|---|---|---|
| GET | `/reseller/plans/` | List all plans with subscriber stats scoped to this reseller. | requireAuth |

#### `/reseller/earnings`

| Method | Path | Description | Auth |
|---|---|---|---|
| GET | `/reseller/earnings/` | Earnings: MRR, commission, 6-month trend, payouts. | requireAuth |

#### `/reseller/billing`

| Method | Path | Description | Auth |
|---|---|---|---|
| GET | `/reseller/billing/` | Wallet/profit/revenue/recharge summary + invoices + recharge history. | requireAuth |

---

### Customer-Owner API (`/user`)

The actual product. A logged-in customer (USER with role `CUSTOMER_OWNER` or a teammate role) manages their WhatsApp Business integration: WABA verification, message templates, bot builders, contact lists, broadcast campaigns, and team members.

> **Auth taxonomy**
> - `requireAuth` — any authenticated principal (USER / RESELLER / ADMIN)
> - `requireOwner` — additionally requires `roleType === "CUSTOMER_OWNER"` of the same `accountId`
> - `adminAuth + checkPermission(PERM)` — admin-only routes (the `/customer/*` subtree is **the admin's view of customers**, not customer self-service)
> - `serviceAuth("TEMPLATE" | "BOT" | "MESSAGE")` — service-token API used by the bot/automation runtime
> - `None` — public routes (registration, OTP verify, Meta webhook)

#### `/user/auth`

| Method | Path | Description | Auth | Body |
|---|---|---|---|---|
| POST | `/user/auth/register` | Register a customer-owner account (creates `customerAccount` + USER with role `CUSTOMER_OWNER`). | None | `{ companyName, firstName, lastName, email, phone, password, userName, termsAccepted }` |
| POST | `/user/auth/login` | Login as customer (USER) or admin — returns JWT. | None | `{ identifier, password, rememberMe? }` |
| POST | `/user/auth/changePassword` | Change the logged-in user's password; invalidates sessions. | requireAuth | `{ currentPassword, newPassword }` |
| POST | `/user/auth/verify-otp` | Verify email OTP issued at login and issue a USER JWT. | None | `{ email, otp, rememberMe? }` |

#### `/user/account`

All routes `requireAuth + requireOwner`.

| Method | Path | Description | Body |
|---|---|---|---|
| GET | `/user/account/detail` | Owner user + account profile. | — |
| PUT | `/user/account/update` | Update `companyName`, `firstName`, `lastName`, `phone` (phone uniqueness-checked). | `{ companyName?, firstName?, lastName?, phone? }` |
| GET | `/user/account/subscription` | Active subscription with plan for the owner's account. | — |
| GET | `/user/account/usage` | Aggregate usage counters vs plan limits (templates, bots, messages, team, contacts). | — |
| GET | `/user/account/whatsapp-integration` | `wabaVerification` status + linked `whatsAppAccounts`. | — |

#### `/user/customer`  *(admin's view of customers)*

> The `/user/customer/*` subtree is **mounted with `adminAuth + checkPermission(...)`** — only `/customer/me` is customer-facing. The mount-name `/user` is misleading.

| Method | Path | Description | Auth (permission) | Body |
|---|---|---|---|---|
| GET | `/user/customer/list` | Admin lists customers with filters. | adminAuth + `VIEW_CUSTOMERS` | query: `page, limit, search, isActive, isVerified` |
| POST | `/user/customer/detail` | Admin fetches one customer by id (in body). | adminAuth + `VIEW_CUSTOMER` | `{ customerId }` |
| PATCH | `/user/customer/update` | Admin updates name / isActive. | adminAuth + `UPDATE_CUSTOMER` | `{ id, name?, isActive? }` |
| PATCH | `/user/customer/status` | Admin activate/deactivate customer. | adminAuth + `UPDATE_CUSTOMER_STATUS` | `{ id, isActive }` |
| PATCH | `/user/customer/verify` | Admin approve/revoke verification. | adminAuth + `VERIFY_CUSTOMER` | `{ id, isVerified }` |
| DELETE | `/user/customer/delete` | Admin soft-deletes a customer. | adminAuth + `DELETE_CUSTOMER` | `{ id }` |
| GET | `/user/customer/stats` | Customer counters (total/active/inactive/verified/unverified/deleted + new today/7d/30d). | adminAuth + `VIEW_CUSTOMER_STATS` | — |
| POST | `/user/customer/force-logout` | Force-logout a customer (rotate `tokenVersion`). | adminAuth + `FORCE_LOGOUT_CUSTOMER` | `{ id }` |
| GET | `/user/customer/me` | **Self-service** — logged-in user fetches own profile (user + role + active sub + plan). | requireAuth | — |

#### `/user/profile`

| Method | Path | Description | Auth | Body |
|---|---|---|---|---|
| GET | `/user/profile/me` | Logged-in user's profile (USER or ADMIN sessions). | requireAuth | — |
| PUT | `/user/profile/update` | Update logged-in USER's firstName/lastName/email/phone. | requireAuth (enforces `userType === USER`) | `{ firstName?, lastName?, email?, phone? }` |

#### `/user/dashboard`

| Method | Path | Description | Auth |
|---|---|---|---|
| GET | `/user/dashboard/stats` | Account-wide totals: contacts, groups, templates, bots, botReplies, active team, message queue/processed. | requireAuth |

#### `/user/team`

| Method | Path | Description | Auth | Body / Params |
|---|---|---|---|---|
| POST | `/user/team/invite` | Invite teammate (creates `TeamInvite`, sends email). | requireAuth + requireOwner | `{ email, roleType }` |
| POST | `/user/team/accept-invite` | Accept a team invite (creates or attaches User to account). | None | `{ token, firstName, lastName, password, phone }` |
| GET | `/user/team/list-members` | Paginated team list with filters + counters. | requireAuth + requireOwner | query: `page, limit, search, roleType, status` |
| POST | `/user/team/resend-invite` | Generate new token, re-extend expiry. | requireAuth + requireOwner | `{ inviteId }` |
| PATCH | `/user/team/update-member` | Update roleType / isActive (owner locked). | requireAuth + requireOwner | `{ userId, roleType?, isActive? }` |
| GET | `/user/team/member/:userId` | Detail for one member (role, status, counters). | requireAuth + requireOwner | params: `userId` |
| PATCH | `/user/team/member/:userId/toggle-status` | Toggle isActive (refuses on `CUSTOMER_OWNER`). | requireAuth + requireOwner | params: `userId` |
| GET | `/user/team/stats` | Counters (total/active members, agents, pending invites). | requireAuth + requireOwner | — |
| DELETE | `/user/team/member/:userId` | Soft-delete a team member (refuses on `CUSTOMER_OWNER`). | requireAuth + requireOwner | params: `userId` |
| DELETE | `/user/team/members/bulk-delete` | Bulk soft-delete team members (skips `CUSTOMER_OWNER`). | requireAuth + requireOwner | `{ userIds }` |

#### `/user/campaign`

| Method | Path | Description | Auth | Body / Params |
|---|---|---|---|---|
| POST | `/user/campaign/create-campaign` | Create a DRAFT campaign (requires APPROVED template). | requireAuth + requireOwner | `{ name, description, templateId, batchSize?, delayInSeconds? }` |
| POST | `/user/campaign/audience` | Add contacts/groups as audience to a DRAFT campaign. | requireAuth + requireOwner | `{ campaignId, contactIds?, groupIds? }` |
| POST | `/user/campaign/start` | Start campaign (DRAFT/SCHEDULED → RUNNING); seeds `CampaignJob` batches. | requireAuth + requireOwner | `{ campaignId }` |
| POST | `/user/campaign/pause` | Pause a RUNNING campaign → PAUSED. | requireAuth + requireOwner | `{ campaignId }` |
| POST | `/user/campaign/resume` | Resume a PAUSED campaign → RUNNING (background loop). | requireAuth + requireOwner | `{ campaignId }` |
| GET | `/user/campaign/list` | Paginated campaign list with status/tab/search filters. | requireAuth | query: `page, limit, search, status, tab` |
| GET | `/user/campaign/detail/:id` | Campaign detail incl. progress %, counts, template summary. | requireAuth | params: `id` |
| PUT | `/user/campaign/:id/update` | Update a DRAFT campaign (reschedule, template, batch/delay). | requireAuth + requireOwner | params: `id`; body: `{ name?, description?, templateId?, isScheduled?, scheduledAt?, batchSize?, delayInSeconds? }` |
| GET | `/user/campaign/:id/audience` | Paginated audience list. | requireAuth | params: `id`; query: `page, limit, search` |
| POST | `/user/campaign/cancel` | Cancel a non-completed campaign → CANCELLED. | requireAuth + requireOwner | `{ campaignId }` |
| POST | `/user/campaign/retry` | Move FAILED audience entries back to PENDING. | requireAuth + requireOwner | `{ campaignId }` |
| GET | `/user/campaign/stats` | Account-level counts + 5 most recent campaigns. | requireAuth | — |
| DELETE | `/user/campaign/:id/delete` | Soft-delete a non-running campaign. | requireAuth + requireOwner | params: `id` |
| POST | `/user/campaign/bulk-delete` | Bulk soft-delete campaigns (skips RUNNING). | requireAuth + requireOwner | `{ campaignIds }` |
| POST | `/user/campaign/audience/bulk` | Bulk-add contacts/groups to a DRAFT campaign. | requireAuth + requireOwner | `{ campaignId, contactIds?, groupIds? }` |
| POST | `/user/campaign/audience/remove` | Remove specific audience entries from a DRAFT campaign. | requireAuth + requireOwner | `{ campaignId, contactIds?, groupIds? }` |
| POST | `/user/campaign/audience/bulk-remove` | Bulk-remove audience entries from a DRAFT campaign. | requireAuth + requireOwner | `{ campaignId, contactIds?, groupIds? }` |
| GET | `/user/campaign/:id/logs` | Paginated `CampaignLog` entries filtered by type. | requireAuth | params: `id`; query: `page, limit, type?` |
| GET | `/user/campaign/:id/jobs` | `CampaignJob` batches + counts + progress. | requireAuth | params: `id`; query: `page, limit` |

#### `/user/contacts`

Three sub-trees: `/contact` (CRUD on individual contacts), `/groups` (contact groups), `/custom-fields` (per-account metadata schema). All routes `requireAuth + requireOwner`.

##### `/user/contacts/contact`

| Method | Path | Description | Body / Params |
|---|---|---|---|
| POST | `/user/contacts/contact/create` | Create contact (or restore soft-deleted by phone); optionally assigns groups + customFields. | `{ firstName, phone, lastName?, country?, languageCode?, email?, isOptedOut?, groups?, customFields? }` |
| PUT | `/user/contacts/contact/update` | Update a contact (replaces groups and customFields if provided). | `{ contactId, firstName?, lastName?, country?, languageCode?, email?, isOptedOut?, groups?, customFields? }` |
| GET | `/user/contacts/contact/detail/:contactId` | Fetch one contact with groups + customFields. | params: `contactId` |
| GET | `/user/contacts/contact/read` | Paginated contacts (search name/phone/email, filter groupId/isOptedOut). | query: `page, limit, search, groupId, isOptedOut` |
| DELETE | `/user/contacts/contact/delete/:contactId` | Soft-delete (cascades mappings + values). | params: `contactId` |
| DELETE | `/user/contacts/contact/bulk-delete` | Bulk soft-delete. | `{ contactIds }` |
| POST | `/user/contacts/contact/import` | Bulk import from CSV. | multipart: `file`; body: `groupIds?` (csv string) |
| GET | `/user/contacts/contact/export` | Stream contacts as CSV. | query: `search?` |
| POST | `/user/contacts/contact/assign-groups` | Bulk-create `contactGroupMap` rows. | `{ contactIds, groupIds }` |

##### `/user/contacts/groups`

| Method | Path | Description | Body / Params |
|---|---|---|---|
| POST | `/user/contacts/groups/create` | Create group (or restore soft-deleted by title). | `{ title, description? }` |
| PUT | `/user/contacts/groups/update` | Update title/description. | `{ groupId, title, description }` |
| GET | `/user/contacts/groups/detail/:groupId` | Group + flattened contacts (totalContacts). | params: `groupId` |
| PATCH | `/user/contacts/groups/toggle-archive` | Toggle single group's `isArchived`. | `{ groupId }` |
| PATCH | `/user/contacts/groups/toggle-archive-bulk` | Toggle `isArchived` for many groups. | `{ groupIds }` |
| DELETE | `/user/contacts/groups/delete/:groupId` | Soft-delete + remove mappings. | params: `groupId` |
| DELETE | `/user/contacts/groups/bulk-delete` | Bulk soft-delete + remove mappings. | `{ groupIds }` |
| GET | `/user/contacts/groups/read` | Paginated groups (filter isArchived/isDeleted, search). | query: `page, limit, search, isArchived, isDeleted` |
| DELETE | `/user/contacts/groups/remove-contacts` | Remove specific contacts from a group. | `{ groupId, contactIds }` |
| GET | `/user/contacts/groups/contacts/:groupId` | Paginated contacts inside a group (with customFields). | params: `groupId`; query: `page, limit, search` |

##### `/user/contacts/custom-fields`

| Method | Path | Description | Body / Params |
|---|---|---|---|
| POST | `/user/contacts/custom-fields/create` | Create a custom field (max 50 per account); restores soft-deleted. | `{ name, type }` |
| PUT | `/user/contacts/custom-fields/update` | Update name (regenerates key) and type. | `{ fieldId, name, type }` |
| GET | `/user/contacts/custom-fields/detail/:fieldId` | Get one custom field. | params: `fieldId` |
| GET | `/user/contacts/custom-fields/list` | Paginated list (search by name/key). | query: `page, limit, search` |
| DELETE | `/user/contacts/custom-fields/delete/:fieldId` | Soft-delete one field + its values. | params: `fieldId` |
| DELETE | `/user/contacts/custom-fields/bulk-delete` | Bulk soft-delete + values. | `{ fieldIds }` |

#### `/user/whatsapp`

The actual WhatsApp integration. Sub-mounts: `/verify-whatsapp-number`, `/create`, `/template`, `/meta`, `/bot`, `/bot-flow`, `/message`.

##### `/user/whatsapp/verify-whatsapp-number`

| Method | Path | Description | Auth | Body |
|---|---|---|---|---|
| POST | `/user/whatsapp/verify-whatsapp-number/submit-whatsapp-number` | Send a 6-digit OTP via WhatsApp to verify the client's phone (creates `wabaVerification`). | requireAuth | `{ phone }` |
| POST | `/user/whatsapp/verify-whatsapp-number/verify-otp` | Verify OTP and mark status VERIFIED. | requireAuth | `{ otp }` |

##### `/user/whatsapp/create`

| Method | Path | Description | Auth |
|---|---|---|---|
| POST | `/user/whatsapp/create/api` | Issue `SERVICE_API` tokens (`TEMPLATE`, `BOT`) per plan limits; revokes prior active tokens. | requireAuth |

##### `/user/whatsapp/template`

Meta-approved WhatsApp message templates. All routes `requireAuth + requireOwner`; `create`/`update` accept `multipart/form-data` with a single `file` upload (multer).

| Method | Path | Description | Body / Params |
|---|---|---|---|
| POST | `/user/whatsapp/template/create` | Create a DRAFT template (supports media headers); restores soft-deleted if same name+language. | `{ name, category, language, body, header?, footer?, buttons?, variableSamples?, locationDetails? }` + optional `file` |
| PUT | `/user/whatsapp/template/update` | Update a non-submitted/non-approved DRAFT. | `{ templateId, name?, category?, language?, body?, header?, footer?, buttons?, variableSamples?, locationDetails? }` + optional `file` |
| POST | `/user/whatsapp/template/submit` | Build Meta components + submit for approval. | `{ templateId }` |
| POST | `/user/whatsapp/template/duplicate` | Deep-copy (auto-suffixed `_copy[_n]`). | `{ templateId }` |
| GET | `/user/whatsapp/template/list` | Paginated list (search, status, category). | query: `page, limit, search?, status?, category?` |
| GET | `/user/whatsapp/template/detail/:templateId` | Detail (header, footer, buttons, components, media, `metaTemplateId`). | params: `templateId` |
| GET | `/user/whatsapp/template/read` | Compact list (smaller payload than `/list`). | query: `page, limit, search?, status?, category?` |
| DELETE | `/user/whatsapp/template/delete` | Soft-delete a non-submitted/non-approved template. | `{ templateId }` |

##### `/user/whatsapp/meta`

Meta webhook receiver. **No auth middleware** — Meta calls these directly. Verification via `WHATSAPP_VERIFY_TOKEN`.

| Method | Path | Description | Auth |
|---|---|---|---|
| GET | `/user/whatsapp/meta/webhook` | Meta webhook verification — echo `hub.challenge` when `hub.verify_token` matches. | None (token-checked) |
| POST | `/user/whatsapp/meta/webhook` | Receive Meta events (template status updates + inbound messages). ACKs `200` then performs dedup/upsert contact/log + bot trigger resolution + reply. | None (Meta) |

##### `/user/whatsapp/bot`

Simple keyword bots. All routes guarded by `serviceAuth("BOT")` — no `requireAuth`.

| Method | Path | Description | Body |
|---|---|---|---|
| POST | `/user/whatsapp/bot/createSimpleBot` | Create a SIMPLE bot (text reply) with auto-created simple reply. | `{ name, bodyText, triggerType, triggerValue?, isActive? }` |
| POST | `/user/whatsapp/bot/createMediaBot` | Create a MEDIA bot (media + caption); uploaded media required. | multipart: `mediaFile`; body: `{ botName, triggerType, triggerValue?, replyText?, mediaType, isActive? }` |
| POST | `/user/whatsapp/bot/createInteractiveBot` | Create an INTERACTIVE bot (buttons/CTA/list + optional media header). | multipart: `mediaFile?`; body: `{ botName, triggerType, triggerValue?, replyText?, interactiveType, buttons?, cta?, list?, mediaType?, isActive? }` |
| GET | `/user/whatsapp/bot/list` | Paginated bots (filter `botType`/`triggerType`/`isActive`). | query: `page, limit, search?, botType?, triggerType?, isActive?` |
| POST | `/user/whatsapp/bot/detail` | One bot by id (replies + media/buttons/list/cta normalized). | `{ id }` |
| DELETE | `/user/whatsapp/bot/delete` | Soft-delete bot, replies; end active sessions. | `{ id }` |
| PATCH | `/user/whatsapp/bot/status` | Toggle `isActive` (cascades replies + sessions). | `{ id, isActive }` |
| PUT | `/user/whatsapp/bot/update` | Update a bot reply (SIMPLE / MEDIA / INTERACTIVE). | multipart: `mediaFile?`; body: `{ replyId, replyType, replyText?, triggerType?, triggerValue?, interactiveType?, buttons?, cta?, list?, mediaType?, isActive? }` |

##### `/user/whatsapp/bot-flow`

Multi-node flow bots. All routes guarded by `serviceAuth("BOT")`.

| Method | Path | Description | Body |
|---|---|---|---|
| POST | `/user/whatsapp/bot-flow/create` | Create a FLOW bot (with empty START node + `BotFlow` definition). | `{ title, startTriggerSubject }` |
| PUT | `/user/whatsapp/bot-flow/update` | Update flow bot meta (title, start trigger, isActive). | `{ botId, title?, startTriggerSubject?, isActive? }` |
| DELETE | `/user/whatsapp/bot-flow/delete` | Soft-delete flow + replies + sessions; unpublish. | `{ botId }` |
| POST | `/user/whatsapp/bot-flow/createSimpleBotReply` | Add a SIMPLE node. | `{ botId, name, replyText, parentNodeKey }` |
| PUT | `/user/whatsapp/bot-flow/updateSimpleBotReply` | Update a SIMPLE node's name/text/active. | `{ replyId, name, replyText, isActive? }` |
| DELETE | `/user/whatsapp/bot-flow/deleteSimpleBotReply` | Delete a SIMPLE node (refuses if has children). | `{ replyId }` |
| POST | `/user/whatsapp/bot-flow/createMediaBotReply` | Add a MEDIA node (uploads media to Meta). | multipart: `mediaFile`; body: `{ botId, name, parentNodeKey, mediaType, caption? }` |
| PUT | `/user/whatsapp/bot-flow/updateMediaBotReply` | Update MEDIA node (re-uploads media). | multipart: `mediaFile`; body: `{ replyId, name?, mediaType?, caption? }` |
| DELETE | `/user/whatsapp/bot-flow/deleteMediaBotReply` | Delete a MEDIA node + its media row (refuses if has children). | `{ replyId }` |
| POST | `/user/whatsapp/bot-flow/createInteractiveBotReply` | Add an INTERACTIVE node (buttons/CTA/list + optional media header). | multipart: `mediaFile?`; body: `{ botId, name, nodeKey, parentNodeKey, interactiveType, header?, bodyText?, footerText?, buttons?, cta?, list? }` |

##### `/user/whatsapp/message`

Manual outbound sends. All routes `requireAuth`; `send-media` accepts a `file` upload.

| Method | Path | Description | Body / Params |
|---|---|---|---|
| POST | `/user/whatsapp/message/send-text` | Send a freeform WhatsApp TEXT message via Meta; logs `MessageLog`. | `{ to, message }` |
| POST | `/user/whatsapp/message/send-media` | Upload media to Meta + send image/video/doc; logs `MessageLog`. | multipart: `file`; body: `{ to, caption? }` |
| POST | `/user/whatsapp/message/send-template` | Send an APPROVED template message; logs `MessageLog`. | `{ to, templateId, variables? }` |
| GET | `/user/whatsapp/message/list` | Paginated `MessageLog` (filter by status/type/direction/conversationId, search phone/text/template). | query: `page, limit, search?, status?, type?, direction?, conversationId?` |
| GET | `/user/whatsapp/message/detail/:messageId` | Single `MessageLog` detail (with sender info). | params: `messageId` |

---

## Domain model

The schema (`src/prisma/schema.prisma`) is split into these logical clusters. All `*` rows are soft-deletable (carry `isDeleted`/`isActive`/`isArchived`).

**Identity & access control**
- `Admin` — platform admins (single `SYSTEM_ADMIN` bootstrapped via `/super-admin/auth/register`)
- `Role` + `Permission` + `RolePermission` — RBAC for internal admins (`SYSTEM_ADMIN`, `INTERNAL_ADMIN`)
- `User` — customer-team members (`CUSTOMER_OWNER`, `CUSTOMER_ADMIN`, `CUSTOMER_AGENT`)
- `CustomerAccount` — the customer business entity; `User.accountId` points here
- `Reseller` — white-label resellers (commission-based)
- `TeamInvite` — pending invitations to join a customer account
- `AccessToken` — long-lived service tokens (`TEMPLATE`, `BOT`, `MESSAGE`)

**WhatsApp integration**
- `WabaVerification` — per-account phone verification via OTP
- `WhatsAppAccount` — linked WABA / phone numbers
- `Template` — Meta-approved message templates (`DRAFT`/`SUBMITTED`/`APPROVED`/`REJECTED`)
- `Bot` + `BotReply` + `BotReplyMedia` + `BotReplyButton` + `BotReplyCTA` + `BotReplyList` + `BotReplyListSection` + `BotReplyListRow` — simple keyword bots and their reply variants
- `BotFlow` + `BotTemplate` — multi-node conversational flow bots
- `BotSession` — active bot conversation state
- `WebhookEvent` — dedup table for inbound Meta events

**Contacts & messaging**
- `Contact` + `ContactGroup` + `ContactGroupMap` + `ContactCustomField` + `ContactCustomValue` — contact lists, groups, and per-account metadata
- `MessageLog` — every inbound and outbound message (status `PENDING`/`SENT`/`DELIVERED`/`READ`/`FAILED`)

**Campaigns & billing**
- `Campaign` + `CampaignAudience` + `CampaignLog` + `CampaignJob` + `CampaignMessage` — broadcast campaigns with batch processing
- `Plan` — Starter / Growth / Scale (seeded)
- `Subscription` — `customerAccount ↔ plan` association with `startDate`/`endDate`/`isActive`
- `BillingTransaction` — `RECHARGE` / `COMMISSION` ledger entries (reseller credits and commissions)

**Enum quick reference**
- `TemplateCategory`: `MARKETING | UTILITY | AUTHENTICATION`
- `TemplateStatus`: `DRAFT | SUBMITTED | APPROVED | REJECTED`
- `MessageType`: `TEXT | TEMPLATE | IMAGE | VIDEO | DOCUMENT`
- `MessageStatus`: `PENDING | SENT | DELIVERED | READ | FAILED`
- `VerificationStatus`: `PENDING | VERIFIED | FAILED | EXPIRED`
- `RoleType`: `SYSTEM_ADMIN | INTERNAL_ADMIN | CUSTOMER_OWNER | CUSTOMER_ADMIN | CUSTOMER_AGENT`
- `ServiceType`: `TEMPLATE | BOT | MESSAGE`
- `BillingTransactionType`: `RECHARGE | COMMISSION`

---

## Scripts

| Script | Command | Purpose |
|---|---|---|
| `dev` | `tsx watch src/server.ts` | Run dev server with auto-restart |
| `build` | `tsc` | Compile TypeScript → `dist/` |
| `start` | `tsx src/server.ts` | Run server (tsx runtime, no build needed) |
| `seed` | `node src/prisma/seed.js` | Seed demo data (plans, templates, customers, campaigns) |
| `test` | `echo "no tests" && exit 1` | No tests yet |

---

## License

ISC.