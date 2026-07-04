# HRMS Backend Architecture (FastAPI)
**Team:** Srijan & Arya — Backend Crew
**Source spec:** `Human Resource Management System (1).pdf` (Odoo Hackathon)

---

## 1. Tech Stack

| Concern | Choice | Why |
|---|---|---|
| Framework | FastAPI | async, auto OpenAPI docs, pydantic validation |
| Language | Python 3.11+ | |
| ORM | SQLAlchemy 2.0 (async) | mature, works with Alembic |
| Migrations | Alembic | schema versioning |
| DB | PostgreSQL | relational data, good date/time + JSON support |
| Validation | Pydantic v2 | request/response schemas |
| Auth | JWT (access + refresh) via `python-jose`, `passlib[bcrypt]` | stateless, scalable |
| Email | `fastapi-mail` (or console backend in dev) | verification emails |
| Task queue (optional) | Celery + Redis, or FastAPI `BackgroundTasks` for hackathon scope | sending email async |
| File storage | Local disk (`/uploads`) in hackathon; S3-compatible interface abstracted for later | profile pictures, documents |
| Testing | Pytest + httpx `AsyncClient` + pytest-asyncio | |
| Server | Uvicorn (dev), Gunicorn+Uvicorn workers (prod) | |
| Containerization | Docker + docker-compose (api, db, redis) | one-command local env |
| Config | `pydantic-settings` reading `.env` | |

---

## 2. Layered Architecture

Strict one-directional dependency flow — no layer reaches "up":

```
Router (HTTP)  →  Service (business logic)  →  Repository (DB access)  →  Model (SQLAlchemy)
      ↓                    ↓
  Pydantic Schemas   Domain exceptions
```

- **Routers**: parse/validate request, call one service method, return schema. No DB/session logic, no business rules.
- **Services**: business rules, orchestration, permission checks that depend on data (e.g. "employee can only see own attendance"), transaction boundaries.
- **Repositories**: pure CRUD/query methods against SQLAlchemy models. No business logic.
- **Models**: SQLAlchemy ORM classes = source of truth for schema.
- **Schemas** (Pydantic): `*Create`, `*Update`, `*Out` per resource — never return ORM objects directly.

This separation lets Srijan and Arya work on different **modules** (vertical slices) without touching each other's files, since each module is self-contained: `router.py + service.py + repository.py + schemas.py` per feature folder.

---

## 3. Project Structure

```
backend/
├── alembic/
│   ├── versions/
│   └── env.py
├── app/
│   ├── main.py                     # FastAPI app factory, router registration, middleware
│   ├── core/
│   │   ├── config.py                # Settings (pydantic-settings, reads .env)
│   │   ├── security.py              # password hashing, JWT encode/decode
│   │   ├── dependencies.py          # get_db, get_current_user, require_role()
│   │   ├── exceptions.py            # domain exceptions + exception handlers
│   │   └── logging_config.py
│   ├── db/
│   │   ├── base.py                  # Base declarative class, import registry
│   │   └── session.py               # async engine + sessionmaker
│   ├── models/
│   │   ├── user.py
│   │   ├── employee.py
│   │   ├── attendance.py
│   │   ├── leave.py
│   │   ├── payroll.py
│   │   └── audit_log.py
│   ├── modules/
│   │   ├── auth/
│   │   │   ├── router.py            # /auth/signup, /auth/login, /auth/verify-email, /auth/refresh
│   │   │   ├── service.py
│   │   │   ├── schemas.py
│   │   │   └── repository.py
│   │   ├── users/                   # profile management
│   │   │   ├── router.py            # /users/me, /users/{id} (admin)
│   │   │   ├── service.py
│   │   │   ├── schemas.py
│   │   │   └── repository.py
│   │   ├── attendance/
│   │   │   ├── router.py            # /attendance/check-in, /check-out, /me, /{employee_id}, /team
│   │   │   ├── service.py
│   │   │   ├── schemas.py
│   │   │   └── repository.py
│   │   ├── leave/
│   │   │   ├── router.py            # /leave/requests, /leave/requests/{id}/approve|reject, /leave/balance
│   │   │   ├── service.py
│   │   │   ├── schemas.py
│   │   │   └── repository.py
│   │   ├── payroll/
│   │   │   ├── router.py            # /payroll/me, /payroll/{employee_id}, PUT for admin
│   │   │   ├── service.py
│   │   │   ├── schemas.py
│   │   │   └── repository.py
│   │   └── dashboard/
│   │       ├── router.py            # aggregated view endpoints
│   │       └── service.py
│   ├── common/
│   │   ├── enums.py                 # Role, LeaveType, LeaveStatus, AttendanceStatus
│   │   ├── pagination.py
│   │   └── audit.py                 # generic audit-log writer used by services
│   └── tests/
│       ├── conftest.py              # test db, fixtures for admin/employee tokens
│       ├── test_auth.py
│       ├── test_attendance.py
│       ├── test_leave.py
│       └── test_payroll.py
├── uploads/                          # local file storage (gitignored)
├── .env.example
├── docker-compose.yml
├── Dockerfile
├── requirements.txt / pyproject.toml
└── alembic.ini
```

`app/main.py` only wires things together: creates the app, adds CORS/middleware, includes each module's router with its prefix and tags, and registers exception handlers. No business logic ever lives there.

---

## 4. Database Schema

### 4.1 `users` (auth identity — separate from HR profile data)
| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| employee_code | VARCHAR unique | matches "Employee ID" in signup form |
| email | VARCHAR unique, indexed | |
| hashed_password | VARCHAR | bcrypt |
| role | ENUM(`admin`,`employee`) | |
| is_email_verified | BOOLEAN default false | |
| is_active | BOOLEAN default true | soft-disable account |
| created_at, updated_at | TIMESTAMP | |

### 4.2 `email_verification_tokens`
| id | UUID PK |
| user_id | FK → users.id |
| token_hash | VARCHAR | store hash, not raw token |
| expires_at | TIMESTAMP |
| used_at | TIMESTAMP nullable |

Same pattern reused for `password_reset_tokens` (not in spec explicitly but trivial add-on, flag as stretch goal).

### 4.2b `refresh_tokens` (JWT refresh-token store — makes tokens revocable)
| id | UUID PK |
| user_id | FK → users.id, indexed |
| token_hash | VARCHAR | SHA-256 of the raw refresh token — raw value is never persisted |
| jti | UUID | must match the `jti` claim inside the JWT — lets one DB row be found by claim alone |
| issued_at | TIMESTAMP | |
| expires_at | TIMESTAMP | mirrors the `exp` claim, indexed for cleanup jobs |
| revoked_at | TIMESTAMP nullable | set on logout, on refresh-rotation of the old token, or by admin "sign out everywhere" |
| replaced_by_jti | UUID nullable | points at the new token issued when this one was rotated — lets reuse-detection walk the chain |

A JWT access token is stateless and *cannot* be revoked before it expires — that's why it's kept short-lived (15–30 min). The refresh token is the only long-lived credential, so it is the only one backed by a DB row and the only one that can actually be killed on logout/compromise.

### 4.3 `employees` (HR profile — 1:1 with `users`)
| id | UUID PK |
| user_id | FK → users.id, unique |
| first_name, last_name | VARCHAR |
| phone | VARCHAR nullable |
| address | TEXT nullable |
| profile_picture_url | VARCHAR nullable |
| department | VARCHAR |
| designation | VARCHAR |
| date_of_joining | DATE |
| manager_id | FK → employees.id nullable | self-referential, for future org chart |
| created_at, updated_at | TIMESTAMP |

Field-level edit permissions enforced in **service layer**, not DB: employee PATCH only allows `{phone, address, profile_picture_url}`; admin PATCH allows all fields.

### 4.4 `employee_documents`
| id | UUID PK |
| employee_id | FK |
| doc_type | VARCHAR | e.g. "ID Proof", "Offer Letter" |
| file_url | VARCHAR |
| uploaded_at | TIMESTAMP |

### 4.5 `attendance_records`
| id | UUID PK |
| employee_id | FK, indexed |
| date | DATE, indexed | unique together with employee_id |
| check_in_time | TIMESTAMP nullable |
| check_out_time | TIMESTAMP nullable |
| status | ENUM(`present`,`absent`,`half_day`,`leave`) |
| created_at, updated_at | TIMESTAMP |

- Unique constraint `(employee_id, date)` — one row per employee per day.
- `status` is computed by the service on check-in/check-out/leave-approval, not chosen freely by the client.

### 4.6 `leave_balances`
| id | UUID PK |
| employee_id | FK |
| leave_type | ENUM(`paid`,`sick`,`unpaid`) |
| total_allocated | DECIMAL(5,1) |
| used | DECIMAL(5,1) default 0 |
| year | INT | reset/allocate per calendar year |

Unique `(employee_id, leave_type, year)`.

### 4.7 `leave_requests`
| id | UUID PK |
| employee_id | FK, indexed |
| leave_type | ENUM(`paid`,`sick`,`unpaid`) |
| start_date, end_date | DATE |
| days_count | DECIMAL(5,1) | computed, excludes weekends (config flag) |
| remarks | TEXT nullable |
| status | ENUM(`pending`,`approved`,`rejected`) default `pending` |
| reviewed_by | FK → users.id nullable |
| reviewer_comment | TEXT nullable |
| reviewed_at | TIMESTAMP nullable |
| created_at, updated_at | TIMESTAMP |

### 4.8 `salary_structures`
| id | UUID PK |
| employee_id | FK, unique per active record |
| basic_pay | DECIMAL(12,2) |
| hra | DECIMAL(12,2) |
| allowances | DECIMAL(12,2) |
| deductions | DECIMAL(12,2) |
| net_pay | DECIMAL(12,2) | computed = basic+hra+allowances-deductions |
| effective_from | DATE |
| updated_by | FK → users.id | admin who last edited |
| created_at, updated_at | TIMESTAMP |

Keep history: never UPDATE in place for a pay change — insert new row with new `effective_from`, mark previous inactive (`is_current BOOLEAN`), so payroll has an audit trail.

### 4.9 `audit_logs` (cross-cutting)
| id | UUID PK |
| actor_user_id | FK |
| action | VARCHAR | e.g. `leave.approve`, `payroll.update` |
| target_type, target_id | VARCHAR, UUID |
| metadata | JSONB | before/after diff |
| created_at | TIMESTAMP |

Every approval/reject/salary-update/profile-edit-by-admin writes one row here via `common/audit.py`. Cheap to add, valuable for demoing "enterprise-grade" thinking to judges.

### ER relationships summary
```
users (1) ── (1) employees ── (*) attendance_records
                            ── (*) leave_requests
                            ── (*) leave_balances
                            ── (*) salary_structures
                            ── (*) employee_documents
users (1) ── (*) audit_logs (as actor)
```

---

## 5. Auth & Authorization

### 5.1 Password rules
Enforced in `AuthService.signup()` via a Pydantic validator: min 8 chars, ≥1 uppercase, ≥1 digit, ≥1 special char. Hash with bcrypt (`passlib`), never store/log plaintext.

### 5.2 Signup flow
1. `POST /auth/signup` with `{employee_code, email, password, role}`.
2. Service checks uniqueness of `employee_code`/`email`, creates `users` row with `is_email_verified=False`, creates a linked blank `employees` row.
3. Generates a verification token, stores its hash, emails the raw token as a link (BackgroundTask).
4. `GET /auth/verify-email?token=...` validates hash+expiry, sets `is_email_verified=True`.
5. Login is rejected with a specific error until verified.

### 5.3 Login flow
1. `POST /auth/login` with `{email, password}`.
2. Verify user exists, `is_active`, `is_email_verified`, password matches — return **generic** "invalid credentials" for both wrong-email and wrong-password (avoid user enumeration).
3. Issue an **access token** and a **refresh token** (claim shapes below), persist the refresh token's hash in `refresh_tokens`.
4. `POST /auth/refresh` and `POST /auth/logout` round out the flow (detail below).

### 5.3b JWT claim structure

Both tokens are signed HS256 with `JWT_SECRET` from config. Two separate secrets (`JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET`) are recommended so a leaked access-token secret can't be used to mint refresh tokens.

**Access token** — short-lived (15–30 min), never touches the DB on verification (fully stateless):
```json
{
  "sub": "5f0e9c2a-...-employee-uuid",
  "role": "admin" | "employee",
  "type": "access",
  "iat": 1751600000,
  "exp": 1751601800,
  "jti": "b3b6a1e0-..."
}
```

**Refresh token** — long-lived (7 days), deliberately minimal (no role — role is re-fetched from DB on refresh so a role change/demotion takes effect immediately instead of surviving until the old token expires):
```json
{
  "sub": "5f0e9c2a-...-employee-uuid",
  "type": "refresh",
  "iat": 1751600000,
  "exp": 1752204800,
  "jti": "9d1f2b77-..."
}
```

`core/security.py` exposes `create_access_token(user)`, `create_refresh_token(user)`, and `decode_token(token, expected_type)` — the latter checks signature, `exp`, **and** that `type` matches what the caller expects, so an access token can never be replayed against `/auth/refresh` and vice versa.

### 5.3c Refresh & revocation flow
1. `POST /auth/refresh {refresh_token}` — decode & verify signature/exp/type, then look up `refresh_tokens` by `jti`.
2. If the row is missing, already `revoked_at`, or past `expires_at` → 401 (forces re-login).
3. **Rotate on every use**: mark the old row `revoked_at = now()`, issue a brand-new refresh token + row, set `replaced_by_jti` on the old row pointing at the new one. The client always swaps in the newest refresh token.
4. **Reuse detection**: if a refresh token that is already `revoked_at` gets presented again, that's a stolen/replayed token — revoke the *entire chain* for that user (walk `replaced_by_jti` or just revoke all rows for `user_id`) and force re-login everywhere.
5. `POST /auth/logout {refresh_token}` — sets `revoked_at = now()` on that row. Optional admin action "sign out everywhere" = revoke all rows where `user_id = X`.

### 5.4 Authorization
- `get_current_user` dependency decodes the access token, loads the user, raises 401 if invalid/expired.
- `require_role(Role.ADMIN)` dependency factory raises 403 if role mismatch — used on all admin-only routes (`/employees`, `/leave/requests/{id}/approve`, payroll writes).
- Object-level checks (an employee hitting `/attendance/{employee_id}` for someone else's id) happen **inside the service**, comparing `current_user.id` vs the resource's `employee_id`, since role alone doesn't capture that.

---

## 6. API Surface

Base path: `/api/v1`. All responses use a consistent envelope for errors (see §7).

### Auth — `modules/auth`
| Method | Path | Access | Description |
|---|---|---|---|
| POST | /auth/signup | public | register user + blank employee profile |
| GET | /auth/verify-email | public | consume verification token |
| POST | /auth/login | public | returns access + refresh token |
| POST | /auth/refresh | public (valid refresh token) | rotate access token |
| POST | /auth/logout | authenticated | revoke refresh token |

### Users / Profile — `modules/users`
| Method | Path | Access | Description |
|---|---|---|---|
| GET | /users/me | authenticated | own full profile |
| PATCH | /users/me | authenticated | edit own limited fields |
| GET | /users | admin | paginated employee list (dashboard) |
| GET | /users/{employee_id} | admin | any employee's full profile |
| PATCH | /users/{employee_id} | admin | edit any field |
| POST | /users/{employee_id}/documents | admin or self | upload document |
| POST | /users/me/profile-picture | authenticated | upload avatar |

### Attendance — `modules/attendance`
| Method | Path | Access | Description |
|---|---|---|---|
| POST | /attendance/check-in | employee | creates/updates today's record, sets check_in_time |
| POST | /attendance/check-out | employee | sets check_out_time, finalizes status (present/half-day by hours worked) |
| GET | /attendance/me?from=&to=&view=daily\|weekly | employee | own records |
| GET | /attendance/{employee_id} | admin | one employee's records |
| GET | /attendance | admin | all employees, filterable by date/status (dashboard table) |

### Leave — `modules/leave`
| Method | Path | Access | Description |
|---|---|---|---|
| GET | /leave/balance | employee | own balances by type |
| POST | /leave/requests | employee | create request (validates against balance, overlapping dates) |
| GET | /leave/requests/me | employee | own requests + status |
| GET | /leave/requests/{id} | owner or admin | detail |
| GET | /leave/requests | admin | all requests, filter by status/employee (approval queue) |
| PATCH | /leave/requests/{id}/decision | admin | `{status: approved|rejected, comment}` — atomically updates request, leave_balances, and attendance_records for the date range |
| GET | /leave/calendar?month=&employee_id= | employee (self) / admin (any) | Present/Absent/Leave markers for monthly calendar view |

### Payroll — `modules/payroll`
| Method | Path | Access | Description |
|---|---|---|---|
| GET | /payroll/me | employee | own current salary structure, read-only |
| GET | /payroll/{employee_id} | admin | any employee's current + history |
| PUT | /payroll/{employee_id} | admin | create new salary_structure row (versioned), triggers audit log |

### Dashboard — `modules/dashboard`
| Method | Path | Access | Description |
|---|---|---|---|
| GET | /dashboard/employee | employee | aggregate: profile summary, this week's attendance, pending leave, recent alerts |
| GET | /dashboard/admin | admin | aggregate: headcount, today's attendance snapshot, pending leave approval count |

---

## 7. Cross-Cutting Concerns

### 7.1 Error handling
Define domain exceptions in `core/exceptions.py`: `NotFoundError`, `PermissionDeniedError`, `ValidationConflictError`, `InvalidCredentialsError`. Register FastAPI exception handlers in `main.py` mapping each to the right HTTP status + a consistent JSON body:
```json
{ "error": { "code": "LEAVE_INSUFFICIENT_BALANCE", "message": "..." } }
```
Routers never catch exceptions themselves — they let services raise, handlers translate to HTTP.

### 7.2 Validation
- Pydantic schemas validate shape/type at the router boundary.
- Cross-field/business validation (date ranges, sufficient leave balance, no overlapping leave requests, no future-dated attendance) lives in the service layer and raises domain exceptions.

### 7.3 Config
`core/config.py` uses `pydantic-settings` to load `DATABASE_URL`, `JWT_SECRET`, `JWT_ALGORITHM`, `ACCESS_TOKEN_EXPIRE_MINUTES`, `REFRESH_TOKEN_EXPIRE_DAYS`, `SMTP_*`, `UPLOAD_DIR`, `CORS_ORIGINS` from `.env`. Never hardcode secrets; `.env.example` checked in, `.env` gitignored.

### 7.4 Logging & audit
Structured logging (JSON) via `logging_config.py` for request/response and errors. Business-significant events (approve/reject leave, edit payroll, admin-edits-employee) additionally write to `audit_logs` — this is what makes the leave/payroll workflows demoable and trustworthy.

### 7.5 Pagination & filtering
Shared `common/pagination.py` helper (`limit`, `offset`, returns `{items, total, limit, offset}`) reused by `/users`, `/attendance`, `/leave/requests` list endpoints.

### 7.6 CORS & middleware
CORS restricted to the frontend's dev/prod origins from config. Add a request-timing middleware and a request-id middleware (useful when debugging demo issues live).

---

## 8. Suggested Split: Srijan & Arya

Two people, vertical-slice ownership avoids merge conflicts since each module folder is self-contained. Shared foundation (day 1) should be paired, then split.

**Day 1 (pair together):** `core/` (config, security, dependencies, exceptions), `db/` (session, base), `models/` for all tables, Alembic init + first migration, docker-compose (Postgres + API), seed script with a demo admin + a few employees.

**Then split:**
- **Srijan:** `auth` module (signup/login/verify/refresh/logout) + `users` module (profile view/edit, document/avatar upload, admin employee list) + `dashboard` module.
- **Arya:** `attendance` module (check-in/out, daily/weekly views, admin views) + `leave` module (requests, balances, approval workflow, calendar) + `payroll` module.

Rationale: attendance/leave/payroll are tightly coupled (leave approval mutates attendance and balances), so keeping them with one owner avoids cross-person coordination on that shared logic; auth/users/dashboard are the other natural cluster and dashboard reads from both sides once both are stubbed, so it's built last.

Integration points to agree on **up front** so the two tracks don't collide:
1. The `Employee` and `User` model shapes (frozen after Day 1 pairing).
2. The `require_role` / `get_current_user` dependency signatures (Srijan owns `auth`, but Arya's routers depend on them from hour one — freeze this interface early).
3. Enum values (`common/enums.py`) — `Role`, `LeaveType`, `LeaveStatus`, `AttendanceStatus` — written once, imported everywhere.
4. The audit-log helper signature (`log_action(db, actor_id, action, target_type, target_id, metadata)`) — both sides call it, so write it once during pairing.

---

## 9. Dev Workflow

- `docker-compose up` → Postgres + API with hot reload (`uvicorn --reload`).
- Alembic autogenerate migrations after each model change: `alembic revision --autogenerate -m "..."`, `alembic upgrade head`.
- Seed script (`app/db/seed.py`) creates one admin + a handful of employees with attendance/leave/payroll sample data so the frontend team is never blocked waiting for real data.
- FastAPI's auto-generated Swagger UI at `/docs` is the shared contract between frontend and backend during the hackathon — keep schemas accurate and it doubles as live API documentation.
- Pytest suite hits a separate test database (or a transactional rollback per test) — at minimum, cover: signup/login happy+error paths, leave-approval balance deduction, and permission checks (employee cannot access another employee's data or admin routes).

---

## 10. Stretch Goals (only if time remains)

- Password reset flow (mirrors email verification).
- Rate limiting on `/auth/login` (brute-force protection).
- WebSocket or polling endpoint for "recent activity" live updates on dashboards.
- Export payroll/attendance to CSV/PDF for admin.
- Org chart via `employees.manager_id` for multi-level approval.
