## Hoopy Authentication Server – Architecture & LLM Agent Guidance

This document explains the architecture of the Hoopy authentication server and serves as **guidance for future enhancements and for LLM-based coding agents** working on this codebase.

---

## 1. High-Level Overview

- **Tech stack**
  - **Runtime**: Node.js (NestJS 11)
  - **Framework**: NestJS (`@nestjs/common`, `@nestjs/core`, `@nestjs/platform-express`)
  - **Transport**: HTTP (Express 5 under the hood via Nest platform-express)
  - **Auth**: JWT (`@nestjs/jwt`, `passport`, `passport-jwt`)
  - **Persistence**: PostgreSQL via TypeORM 0.3.x, migrations enabled
  - **Cache / async infra**: Redis via `ioredis` (infrastructure already modeled)
  - **File storage**: Supabase storage (via `@supabase/supabase-js`) behind an abstraction
  - **Testing**: Jest + `@nestjs/testing` + Supertest
  - **Package manager**: Yarn (`yarn.lock` present; `package-lock.json` removed)

- **Architectural style**
  - A **modular monolith** structured around Nest modules (auth, user, account, company, contact, employee, attachments, storage, configuration, database).
  - Each module provides its own **application services** and **repository interfaces**, which makes the codebase **microservice-ready**: modules already behave as if they were separate services talking via well-defined APIs.

- **Key design principles**
  - **Domain boundaries via Nest modules** (not via shared entities).
  - **Repository abstraction layer** per domain (e.g. `UserRepository`, `AccountRepository`), with TypeORM implementations hidden behind DI tokens.
  - **Cross-module interactions via services & DTOs**, not via direct repository or entity coupling.
  - **Configuration & environment** managed via a custom `ConfigurationModule` on top of `@nestjs/config`.
  - **Security & testing**: all new changes should keep Jest tests green and not bypass or weaken validation, authentication, or authorization.

---

## 2. Module Structure & Responsibilities

### 2.1 App module

- **File**: `src/app.module.ts`
- **Responsibilities**
  - Root Nest module.
  - Imports all feature modules:
    - `ConfigurationModule.forRootAsync`
    - `DatabaseTypeOrmModule`
    - `AuthModule`
    - `UserModule`
    - `AccountModule`
    - `CompanyModule`
    - `EmployeeModule`
    - `ContactModule`
    - `StorageModule`
    - `AttachmentsModule`
  - No domain logic; just system composition.

### 2.2 Configuration module

- **Files**
  - `src/infrastructure/configuration/configuration.module.ts`
  - `src/infrastructure/configuration/configuration.global.ts`
  - `src/infrastructure/configuration/configuration.consts.ts`
  - `src/infrastructure/configuration/configuration.validator.ts`
  - `src/infrastructure/configuration/index.ts`
- **Responsibilities**
  - Wraps `@nestjs/config` in a project-specific `ConfigurationModule`.
  - Loads `.env` and validates it via `validateConfig`.
  - Provides structured configuration objects under tokens such as:
    - `JWT_CONFIG`
    - `APP_CONFIG`
    - `REDIS_CONFIG`
    - `DEBUG_CONFIG`
- **Agent guidance**
  - **Do not** read `process.env` directly from business logic; instead inject `ConfigService` and use these config tokens.
  - When adding new config, extend the config loader and validator, and expose a token in `configuration.consts.ts`.

### 2.3 Database / TypeORM module

- **Files**
  - `src/infrastructure/database/typeorm/typeorm.module.ts`
  - `src/infrastructure/database/typeorm/typeorm.config.ts`
  - `src/infrastructure/database/typeorm/datasource.ts`
  - Migrations in `src/migrations/*`
- **Responsibilities**
  - Configure TypeORM database connection for PostgreSQL.
  - Enable migrations (see `docs/database-migrations.md` for details).
  - Expose a `DatabaseTypeOrmModule` for other modules to import.
- **Agent guidance**
  - **Never enable `synchronize: true`** in production config.
  - For schema changes:
    - Update entities.
    - Generate a migration.
    - Review and commit migration alongside code.

### 2.4 Auth module

- **Files**
  - `src/auth/auth.module.ts`
  - `src/auth/auth.service.ts`
  - `src/auth/auth.controller.ts`
  - `src/auth/dto/auth.dto.ts`
  - `src/auth/strategies/jwt.strategy.ts`
  - `src/auth/guards/jwt.guard.ts`
- **Responsibilities**
  - User registration, login, token refresh, logout.
  - JWT validation via Passport strategy.
  - Swagger documentation for auth endpoints.
- **Key design points**
  - `AuthService` orchestrates **user + account + contact creation**:
    - Uses `UserRepository` to persist the user.
    - Uses `AccountService` to create an account.
    - Uses `ContactService` to create primary email and phone contacts.
  - JWT signing and verification use values from `JWT_CONFIG` via `ConfigService`.
  - No direct use of other modules’ repositories or entities.
- **Agent guidance**
  - For new auth flows, **keep orchestration in `AuthService`** and push domain-specific logic into the appropriate module (e.g. contacts, accounts).
  - When needing user data, prefer **services / repositories** over embedding join-heavy queries in auth.
  - Avoid leaking password hashes or refresh tokens beyond what is necessary; respect existing selection rules in repositories.

### 2.5 User module

- **Files**
  - `src/user/user.module.ts`
  - `src/user/user.service.ts`
  - `src/user/user.controller.ts`
  - `src/user/entities/user.entity.ts`
  - `src/user/dto/create-user.dto.ts`
  - `src/user/dto/update-user.dto.ts`
  - `src/user/user.repository.ts`
- **Responsibilities**
  - CRUD operations for users (excluding authentication concerns).
  - Exposes an API for listing and managing users (secured via JWT guard at controller level).
- **Repository abstraction**
  - `UserRepository` interface:
    - `create(data: Partial<User>): User`
    - `save(user: User): Promise<User>`
    - `findAll(): Promise<User[]>` (selects **non-sensitive** fields only)
    - `findById(id: string): Promise<User | null>` (non-sensitive fields)
    - `remove(user: User): Promise<User>`
  - `TypeOrmUserRepository` implements this using TypeORM.
- **Agent guidance**
  - **Do not** expose `password` or `refreshToken` in read APIs; user repository intentionally selects safe fields.
  - If you need richer user projections, add explicit repository methods instead of broadening existing selections.
  - For cross-module access to users, define clear service methods or repository methods on this module, rather than querying `User` from other modules.

### 2.6 Account module

- **Files**
  - `src/account/account.module.ts`
  - `src/account/entities/account.entity.ts`
  - `src/account/services/account.service.ts`
  - `src/account/account.repository.ts`
- **Responsibilities**
  - Manage customer accounts (name, type, owner).
  - Provide operations to create and lookup an account by owner.
- **Repository abstraction**
  - `AccountRepository`:
    - `create({ name, type, owner })`
    - `save(account)`
    - `findByOwnerId(ownerId: string)`
  - `TypeOrmAccountRepository` is the concrete implementation.
- **Agent guidance**
  - For new features needing account data, use `AccountService` or `AccountRepository` instead of reading the `accounts` table directly from other modules.
  - Keep ownership rules (account belongs to a single user) enforced here.

### 2.7 Company module

- **Files**
  - `src/company/company.module.ts`
  - `src/company/entities/company.entity.ts`
  - `src/company/services/company.service.ts`
  - `src/company/company.repository.ts`
- **Responsibilities**
  - Manage companies and their relationship to user owners.
- **Repository abstraction**
  - `CompanyRepository`:
    - `create({ name, sector, owner })`
    - `save(company)`
    - `findByOwnerId(ownerId: string)`
- **Agent guidance**
  - As with accounts, keep access via service/repository abstractions.
  - If you need to extend company metadata, add fields to the entity and corresponding migration, then update DTOs carefully.

### 2.8 Contact module

- **Files**
  - `src/contact/contact.module.ts`
  - `src/contact/contact.service.ts`
  - `src/contact/contact.controller.ts`
  - `src/contact/entities/contact.entity.ts`
  - `src/contact/dto/create-contact.dto.ts`
  - `src/contact/dto/update-contact.dto.ts`
  - `src/contact/contact.repository.ts`
  - Feature spec: `contacts-feature.md` (in repo root)
- **Responsibilities**
  - Provide **flexible contact information** per user:
    - Multiple contact methods (email, phone, LinkedIn, etc.).
    - Primary contact per type.
    - Labels and metadata per entry.
- **Repository abstraction**
  - `ContactRepository`:
    - `unsetPrimaryForType(userId, type)`
    - `create(data)`
    - `save(contact)`
    - `findPrimary(userId, type)`
    - `findByIdForUser(id, userId)`
    - `deleteForUser(id, userId)` (returns affected count)
  - `TypeOrmContactRepository` implements this logic, including primary flag handling.
- **Agent guidance**
  - When updating primary contact logic, do so here, not in callers.
  - Respect the business rules laid out in `contacts-feature.md` (e.g., at most one primary per type; don’t require schema changes for new types).
  - For future microservice migrations, this module’s API is the boundary for contact-related behavior.

### 2.9 Employee module

- **Files**
  - `src/employee/employee.module.ts`
  - `src/employee/employee.service.ts`
  - `src/employee/employee.controller.ts`
  - `src/employee/entities/employee.entity.ts`
  - `src/employee/entities/employee-education.entity.ts`
  - `src/employee/dto/create-employee.dto.ts`
  - `src/employee/dto/update-employee.dto.ts`
  - `src/employee/employee.repository.ts`
- **Responsibilities**
  - CRUD for employees and their education history.
  - Handle complex update semantics (replace education list, cascade deletes).
- **Repository abstractions**
  - `EmployeeRepository`:
    - `create`, `save`
    - `findAllWithEducations`
    - `findOneWithEducations`
    - `remove`
  - `EmployeeEducationRepository`:
    - `create`
    - `saveAll`
    - `deleteByEmployeeId`
- **Agent guidance**
  - For changes to how educations are managed (e.g., partial updates), centralize logic in `EmployeeService` and these repositories.
  - Ensure cascading delete behavior remains correct and tested.

### 2.10 Storage & attachments

#### Storage module

- **Files**
  - `src/storage/storage.module.ts`
  - `src/storage/storage.service.interface.ts`
  - `src/storage/supabase-storage.service.ts`
  - `src/supabase/supabase.client.ts`
- **Responsibilities**
  - Wrap Supabase storage behind a `StorageService` interface.
  - `SupabaseStorageService` is the current implementation:
    - Uploads files to a `hoopy` bucket.
    - Returns public URLs for stored objects.
- **Agent guidance**
  - For alternative storage providers (S3, local FS, GCS), implement the same `StorageService` interface and exchange via DI.
  - Do **not** scatter Supabase API usage across the app; keep it here.

#### Attachments module

- **Files**
  - `src/attachments/attachments.module.ts`
  - `src/attachments/attachments.service.ts`
  - `src/attachments/attachments.controller.ts`
  - `src/attachments/attachment.entity.ts`
  - `src/attachments/attachment.repository.ts`
- **Responsibilities**
  - Provides an API to upload files and link them to arbitrary related entities (`relatedType`, `relatedId`).
  - Stores file metadata and public URLs.
- **Repository abstraction**
  - `AttachmentRepository` with methods:
    - `create`, `save`
    - `findById`
    - `remove`
    - `findByRelated(relatedType, relatedId)`
- **Agent guidance**
  - When adjusting file path scheme or storage bucket usage, update:
    - `SupabaseStorageService`
    - `AttachmentsService` (especially delete logic and URL parsing)
  - Keep `relatedType` and `relatedId` generic; don’t hardwire them to specific entity classes in this module.

---

## 3. Cross-Cutting Concerns

### 3.1 Validation & DTOs

- DTOs use `class-validator` / `class-transformer`.
- `bootstrap.ts` applies a global `ValidationPipe` with:
  - `transform: true`
  - `whitelist: true`
  - `forbidNonWhitelisted: true`
- **Agent guidance**
  - Always define DTOs for request bodies and query params.
  - Prefer narrowing types via DTOs rather than accepting `any`.
  - When adding fields, update DTOs, entities, and tests together.

### 3.2 Authentication & authorization

- Authentication is JWT-based.
- `JwtAuthGuard` is applied to controllers that require authentication (e.g., `UserController`, `AttachmentsController`).
- **Agent guidance**
  - For new endpoints that expose or mutate user data, **secure them with guards** unless they must be public.
  - Avoid direct token parsing; let Nest + Passport handle it.

### 3.3 Testing

- Jest configuration is in `package.json` under `"jest"`.
- Tests live primarily under `test/` and some `src/**.spec.ts`.
- Common mocks/utilities are defined in `test/test.utils.ts`.
- **Agent guidance**
  - When changing service behavior, **update or add tests** to capture new expectations.
  - Prefer mocking repositories / services via tokens (e.g. `'UserRepository'`) rather than touching the DB.

---

## 4. Microservice Readiness & Extension Strategy

The codebase is intentionally shaped as a **modular monolith** that can be split into microservices later.

### 4.1 Boundaries suitable for microservices

Potential future service boundaries:
- **Auth service**: authentication / token lifecycle only.
- **User service**: user identities and basic profiles.
- **Account service**: accounts and billing-related data.
- **Company service**: organizations and ownership relationships.
- **Contact service**: flexible contact info.
- **Employee service**: HR data and education.
- **Attachments / storage service**: file metadata and storage orchestration.

Because each module already:
- has a **service API**,
- depends on **repository interfaces**, and
- avoids directly using other modules’ repositories,
these boundaries can be lifted out with minimal internal refactoring.

### 4.2 When extending the system

For **LLM agents and human developers**, follow these rules when adding new features:

- **Respect module boundaries**
  - **Do** add new behavior to the relevant module’s service & repository.
  - **Do not** reach into another module’s TypeORM repositories or entities.

- **Preserve repository interfaces**
  - If you need new queries, **add new methods** to the repository interface and implementation.
  - Avoid broad “get everything” methods; encode intention (e.g. `findActiveByOwnerId`).

- **Keep cross-module communication explicit**
  - Use service methods or well-defined DTOs when modules interact.
  - Treat these as if they were HTTP/RPC contracts to future microservices.

- **Keep configuration centralized**
  - Add new config keys to `configuration.global.ts` and validator, not via ad-hoc `process.env` in random files.

- **Maintain security & validation**
  - Ensure new endpoints:
    - Have appropriate guards.
    - Validate all inputs via DTOs and `class-validator`.

- **Update tests**
  - For substantive changes, **update or add Jest tests**:
    - Unit tests for services.
    - Integration-style tests (e.g. controllers with mocks) for endpoint behavior.

---

## 5. Recommended Prompt for LLM Agents

When using an LLM agent to work on this repo, prefix requests with context like:

> You are working on a NestJS 11 modular monolith that is microservice-ready.  
> - Each domain module (auth, user, account, company, contact, employee, attachments, storage) owns its own services and repository interfaces (e.g. `UserRepository`, `AccountRepository`).  
> - Cross-module behavior must go through services and DTOs, not direct TypeORM repository access or shared entities.  
> - Configuration is centralized in `ConfigurationModule` and accessed via `ConfigService` + tokens (e.g. `JWT_CONFIG`, `APP_CONFIG`).  
> - Persistence is via TypeORM 0.3 with migrations; do not enable `synchronize: true` in production.  
> - Validation uses global `ValidationPipe` and `class-validator`; new endpoints must define proper DTOs and avoid accepting extra fields.  
> - Authentication is JWT-based; new protected endpoints must apply the existing guards.  
> - File storage goes through the `StorageService` interface and `AttachmentsService` only; do not call Supabase directly from other modules.  
> - Always keep existing tests passing and add/update Jest tests to cover new logic.  
>  
> When implementing changes, respect these constraints, preserve module boundaries, and extend repository/service interfaces thoughtfully.

Use this document as the **single source of truth** for architectural intent when making non-trivial changes or planning future extensions.

