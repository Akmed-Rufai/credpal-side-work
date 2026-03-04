# Credal Backend Platform

Credal is a B2B2C learning infrastructure platform. This repository contains the backend codebase built as a **Modular Monolith** optimizing for Time-to-Market and Data Integrity.

## Technology Stack

- **Framework:** Node.js (TypeScript) with NestJS (v11+)
- **Database:** PostgreSQL (with `pg` connection pooling)
- **ORM:** Prisma using `@prisma/adapter-pg` for enhanced connection handling
- **Validation:** Zod for environment and request payloads
- **Background Jobs:** BullMQ + Redis (planned)

## Project Setup

### 1. Environment Variables
Create a `.env` file in the root directory.

```bash
NODE_ENV=development
PORT=3000
DATABASE_URL="postgresql://user:password@localhost:5432/credpal_db?schema=public"
JWT_ACCESS_SECRET="your-access-secret"
JWT_REFRESH_SECRET="your-refresh-secret"
PAYSTACK_SECRET_KEY="sk_test_..."
REDIS_URL="redis://localhost:6379"
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Database Setup & Prisma Migrations

Ensure your PostgreSQL server is running and the database matches your `DATABASE_URL`. We use `@prisma/adapter-pg` with a generic connection pool, so standard Prisma workflows apply but the application handles connections more robustly.

To push the schema to the database and generate the Prisma client:
```bash
npx prisma migrate dev --name init
```

### 4. Running the Application

```bash
# development
npm run start

# watch mode
npm run start:dev

# production mode
npm run start:prod
```

## Modular Monolith Structure Overview

- `src/common`: Global decorators, filters, guards, and interceptors.
- `src/config`: Zod environment validation.
- `src/database`: Prisma Service and adapter logic.
- `src/modules`: Domain-driven logical components (`auth`, `users`, `organizations`, `programs`, etc.).

## License
UNLICENSED

