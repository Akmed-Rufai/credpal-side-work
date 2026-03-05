# Credal Backend Project Initialization Plan

Based on the [CREDAL_Technical_Specification.md](file:///home/agabus-lite/Desktop/Web_projects/credal-app/credpal-side-work/CREDAL_Technical_Specification.md), the backend developer has already generated the standard NestJS boilerplate in the `src/` directory, but the required domain-driven folder structure and core dependencies are missing. 

### Database & Setup
We will proceed with **Prisma** as the ORM and **Zod** for environment validation.

### Core Dependencies Setup
I will install the necessary packages to satisfy the specification requirements:
- **Environment & Validation:** `@nestjs/config`, `zod`
- **Database (Prisma & PostgreSQL):** `prisma` (dev), `@prisma/client`
- **Security & Rate Limiting:** `@nestjs/throttler`, `helmet`
- **Queue (BullMQ):** `@nestjs/bullmq`, `bullmq`

### Project Structure Alignment
I will scaffold the required modular monolith structure under `src/`:

#### [NEW] `src/common/`
Global utilities, decorators, exception filters, guards, and interceptors.

#### [NEW] `src/config/`
Environment validation schemas using Zod.

#### [NEW] `src/database/`
Prisma schema, migrations, and seeders.

#### [NEW] `src/modules/`
Domain-driven modules. We will generate the module, controller, and service files for:
- `auth` (Login, Register, Tokens)
- `users` (User profiles)
- `organizations` (Org CRUD, Team members)
- `programs` (Programs, Cohorts, Sessions)
- `enrollments` (Tracking learner progress)
- `payments` (Initialization, Verification)
- `webhooks` (Dedicated handlers for Paystack/Flutterwave)
- `certificates` (Issuance, Validation)

#### [NEW] `src/jobs/`
Placeholders for worker processors (e.g., BullMQ for certificates).

## Development Tasks by Feature

### 1. Database Schema & Infrastructure
- [ ] Setup Prisma in the NestJS project
- [ ] Define Prisma schemas for `Users`, `Profiles`, `Organizations`, `Org_Members`, `Programs`, `Cohorts`, `Sessions`, `Enrollments`, `Transactions`, and `Certificates`
- [ ] Setup initial database migrations and basic seed scripts
- [ ] Create Zod schemas for validating `.env` variables

### 2. User & Authentication Feature
- [ ] Implement `AuthModule` using Passport.js (JWT strategy)
- [ ] Create Login and Registration endpoints
- [ ] Create logic to issue short-lived Access Tokens and long-lived Refresh Tokens in HTTP-only cookies
- [ ] Implement `UsersModule` for Profile creation and retrieval endpoints
- [ ] Apply `ThrottlerModule` to prevent brute-force on auth endpoints and global guards for role-based access

### 3. Organization Management Feature
- [ ] Implement `OrganizationsModule` focusing on Org CRUD logic
- [ ] Create endpoint to create an organization (generating unique `slug`)
- [ ] Create endpoint to manage org settings (logo upload, brand colors)
- [ ] Create endpoints for `Org_Members` (Adding Facilitators/Admins)

### 4. Learning Flow (Programs & Sessions) Feature
- [ ] Implement `ProgramsModule` for course program definition (Draft/Published states, pricing in Kobo/Cents)
- [ ] Create endpoints for defining `Cohorts` under a Program (start/end dates)
- [ ] Create endpoints for defining `Sessions` under a Cohort (meeting links, recording links)
- [ ] Implement public-facing endpoint `/api/programs/:slug` for fast frontend rendering

### 5. Payments & Webhooks Feature
- [ ] Implement `PaymentsModule` to initialize payments (POST `/api/payments/initialize`), generate pending transactions, and return Paystack checkout URLs
- [ ] Implement `WebhooksModule` dedicated to receiving `charge.success` from Paystack
- [ ] Webhook Logic: Validate HMAC SHA512 signature, update transaction to Success, and securely trigger enrollment creation using DB transactions

### 6. Enrollment & learner Progress Feature
- [ ] Implement `EnrollmentsModule` to handle student registration post-payment
- [ ] Create endpoints to view learner progress and manage sessions attended
- [ ] Logic to graduate learners (mark status as Completed)

### 7. Certificate Generation Feature
- [ ] Implement `CertificatesModule` to handle issuance and validation
- [ ] Configure `BullMQ` + `Redis` connection for background jobs 
- [ ] Implement the `generate-certificate` worker with `pdfkit` or `puppeteer` to offload PDF conversion from the main thread
- [ ] Create logic to upload PDFs to storage (e.g., S3/Cloudinary) and save URL in DB

### 8. App Security Auditing & Enhancements
- [ ] **Dependencies Strategy:** Refactor `package.json` updating flagged NestJS dependencies avoiding recursion vulnerabilities dynamically.
- [ ] **Data Sanitization Strategy:** Register `ZodValidationPipe` globally inside `main.ts` ensuring all unmapped routes strictly reject Mass Assignments and unintended entity mutations.
- [ ] **HTTP Headers & CSRF Prevention:** Bind `helmet()` within `bootstrap()` and force strict Cross-Origin bounds blocking generalized endpoints natively. Implement `sameSite: 'strict'` upon the token issuing logic inside `auth.controller.ts` mitigating XSS hijacking dynamically.

## Verification Plan

### Automated / Build Verification
- Run `npm run lint` and `npm run build` to ensure the new folder structures and modules compile successfully.
- Ensure the app can start via `npm run start:dev` without crashing.

### Manual Verification
- The directory tree will match section 7.1 of the Technical Specification document.
