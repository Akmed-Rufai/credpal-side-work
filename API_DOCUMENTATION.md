# Credpal API Documentation

This document outlines the REST API endpoints available in the backend service. It is designed for frontend developers to integrate the UI seamlessly with the backend.

## Base Information
- **Base URL:** The default base URL is whatever the backend server listens on, typically `http://localhost:3000` (or as defined by the deployment environment).
- **Authentication:** Most protected routes use JWT Authentication. Tokens are issued via HTTP-only cookies (`Authentication` and `Refresh` cookies) upon login/registration. Some routes can also use Bearer tokens if configured in `JwtAuthGuard`.

---

## Auth Module (`/auth`)

Endpoints for user registration, login, token refresh, and logout.

### 1. Register User
- **Endpoint:** `POST /auth/register`
- **Description:** Creates a new user account.
- **Request Body:**
  ```json
  {
    "email": "user@example.com",     // Required, valid email
    "password": "strongpassword123", // Required, min 8 characters
    "firstName": "John",             // Required
    "lastName": "Doe",               // Required
    "phone": "+1234567890"           // Optional
  }
  ```
- **Response:** Returns the created `user` object. Sets `Authentication` and `Refresh` cookies.

### 2. Login
- **Endpoint:** `POST /auth/login`
- **Description:** Authenticates a user.
- **Request Body:**
  ```json
  {
    "email": "user@example.com", // Required
    "password": "password123"    // Required
  }
  ```
- **Response:** Returns the `user` object. Sets `Authentication` and `Refresh` cookies.

### 3. Refresh Token
- **Endpoint:** `POST /auth/refresh`
- **Description:** Generates a new access token using a valid refresh token.
- **Authentication:** Requires `Refresh` cookie.
- **Request Body:** None
- **Response:** Returns the `user` object. Resets `Authentication` and `Refresh` cookies.

### 4. Logout
- **Endpoint:** `POST /auth/logout`
- **Description:** Logs out a user by clearing auth cookies.
- **Request Body:** None
- **Response:** `{ "success": true }`

---

## Users Module (`/users`)

Endpoints for managing user profiles.

### 1. Get Profile
- **Endpoint:** `GET /users/profile`
- **Authentication:** Required (JWT)
- **Description:** Retrieves the authenticated user's profile information.

### 2. Create/Update Profile
- **Endpoint:** `POST /users/profile`
- **Authentication:** Required (JWT)
- **Description:** Creates or updates the authenticated user's profile.
- **Request Body:**
  ```json
  {
    "firstName": "John",                     // Required
    "lastName": "Doe",                       // Required
    "phone": "+1234567890",                  // Optional
    "avatarUrl": "https://example.com/a.jpg" // Optional, valid URL
  }
  ```

---

## Organizations Module (`/organizations`)

Endpoints for managing organizations.

### 1. Create Organization
- **Endpoint:** `POST /organizations`
- **Authentication:** Required (JWT)
- **Request Body:**
  ```json
  {
    "name": "Acme Corp",                     // Required
    "slug": "acme-corp",                     // Required (lowercase, alphanumeric, hyphens)
    "logoUrl": "https://example.com/logo.png", // Optional, valid URL
    "brandColor": "#FF5733"                  // Optional, valid Hex Color
  }
  ```

### 2. Get User's Organizations
- **Endpoint:** `GET /organizations`
- **Authentication:** Required (JWT)
- **Description:** Returns a list of organizations the user belongs to.

### 3. Get Organization by ID
- **Endpoint:** `GET /organizations/:id`
- **Authentication:** Required (JWT)
- **Description:** Retrieves details of a specific organization.

### 4. Update Organization
- **Endpoint:** `PATCH /organizations/:id`
- **Authentication:** Required (JWT)
- **Request Body:** Partial fields of the Create Organization payload.

### 5. Add Member to Organization
- **Endpoint:** `POST /organizations/:id/members`
- **Authentication:** Required (JWT)
- **Request Body:**
  ```json
  {
    "email": "member@example.com",        // Required, valid email
    "role": "FACILITATOR"                 // Optional: 'ADMIN' or 'FACILITATOR' (default)
  }
  ```

### 6. Remove Member from Organization
- **Endpoint:** `DELETE /organizations/:id/members/:memberId`
- **Authentication:** Required (JWT)

---

## Programs Module (`/programs`)

Endpoints for creating and managing educational programs, cohorts, and sessions.

### 1. Get Public Programs
- **Endpoint:** `GET /programs/public`
- **Description:** Retrieves all publicly available programs.

### 2. Get Organization Programs
- **Endpoint:** `GET /programs/orgs/:orgId`
- **Authentication:** Required (JWT)

### 3. Get Program by ID
- **Endpoint:** `GET /programs/:programId`
- **Authentication:** Required (JWT)

### 4. Create Program
- **Endpoint:** `POST /programs/orgs/:orgId`
- **Authentication:** Required (JWT)
- **Request Body:**
  ```json
  {
    "title": "Introduction to React",       // Required
    "description": "Learn the basics",      // Optional
    "price": 500000,                        // Required, integer in kobo/cents (e.g., 500000 = NGN 5000.00)
    "currency": "NGN",                      // Optional, default "NGN", 3 characters
    "coverImage": "https://link.to/img.png" // Optional, valid URL
  }
  ```

### 5. Update Program
- **Endpoint:** `PATCH /programs/:programId`
- **Authentication:** Required (JWT)
- **Request Body:** Partial of Create Program body, plus optionally:
  ```json
  {
    "status": "PUBLISHED" // 'DRAFT' or 'PUBLISHED'
  }
  ```

### 6. Create Cohort for Program
- **Endpoint:** `POST /programs/:programId/cohorts`
- **Authentication:** Required (JWT)
- **Request Body:**
  ```json
  {
    "name": "Fall 2026",                            // Required
    "startDate": "2026-09-01T10:00:00.000Z",        // Required, valid ISO8601 datetime
    "endDate": "2026-12-01T10:00:00.000Z"           // Required, valid ISO8601 datetime
  }
  ```

### 7. Create Session for Cohort
- **Endpoint:** `POST /programs/cohorts/:cohortId/sessions`
- **Authentication:** Required (JWT)
- **Request Body:**
  ```json
  {
    "title": "Week 1: Components",                  // Required
    "startTime": "2026-09-02T10:00:00.000Z",        // Required, valid ISO8601 datetime
    "endTime": "2026-09-02T12:00:00.000Z",          // Required, valid ISO8601 datetime
    "meetingLink": "https://zoom.us/j/123456789"    // Optional, valid URL
  }
  ```

---

## Enrollments Module (`/enrollments`)

Endpoints for handling student enrollments and tracking progress.

### 1. Get User's Enrollments
- **Endpoint:** `GET /enrollments/my-enrollments`
- **Authentication:** Required (JWT)

### 2. Enroll in Cohort
- **Endpoint:** `POST /enrollments/cohorts/:cohortId`
- **Authentication:** Required (JWT)
- **Response Code:** `201 Created`

### 3. Update Progress
- **Endpoint:** `PATCH /enrollments/:id/progress`
- **Authentication:** Required (JWT)
- **Request Body:**
  ```json
  {
    "progress": 50 // Required, number between 0 and 100
  }
  ```

### 4. Update Enrollment Status
- **Endpoint:** `PATCH /enrollments/:id/status`
- **Authentication:** Required (JWT)
- **Request Body:**
  ```json
  {
    "status": "ACTIVE" // Required: 'ACTIVE', 'COMPLETED', or 'DROPPED'
  }
  ```

---

## Certificates Module (`/certificates`)

Endpoints for certificate generation.

### 1. Request Certificate
- **Endpoint:** `POST /certificates/request`
- **Authentication:** Required (JWT)
- **Response Code:** `202 Accepted`
- **Request Body:**
  ```json
  {
    "cohortId": "123e4567-e89b-12d3-a456-426614174000" // Required, valid strictly formatted UUID
  }
  ```

---

## Payments Module (`/payments`)

Endpoints for handling payment initialization (e.g. Paystack).

### 1. Initialize Payment
- **Endpoint:** `POST /payments/initialize`
- **Authentication:** Required (JWT)
- **Response Code:** `200 OK`
- **Request Body:**
  ```json
  {
    "cohortId": "123e4567-e89b-12d3-a456-426614174000" // Required, valid strictly formatted UUID
  }
  ```

---

## Webhooks Module (`/webhooks`)

Endpoints used for third-party service callbacks. Usually, frontend developers don't call these directly.

### 1. Paystack Webhook
- **Endpoint:** `POST /webhooks/paystack`
- **Headers:** Requires `x-paystack-signature` for HMAC validation.
- **Payload Structure (Example):**
  ```json
  {
    "event": "charge.success",
    "data": {
      "reference": "txn_123456",
      "metadata": {
        "user_id": "abc-123",
        "cohort_id": "xyz-789"
      }
    }
  }
  ```
