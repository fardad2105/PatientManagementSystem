# ThyroCare Backend — Java 17 · Spring Boot 3.3 · Hibernate (JPA) · Spring Security · PostgreSQL

Same REST contract (`/api/...`, snake_case JSON, `{"detail": ...}` errors) as the React frontend expects.

## Layout
- `domain/` JPA entities (User, PatientProfile, MedicalProfile, PhysicianAssignment, AuditLog, LoginAttempt, Medication, MedicationLog, LabResult)
- `repository/Repositories.java` Spring Data repositories (patient-owned lookups always filter by patient id)
- `security/` JWT (httpOnly cookies + Bearer for a future Android client), origin/CSRF filter, role rules
- `service/` business logic; `web/` controllers and DTO records
- `db/migration/` Flyway SQL (Hibernate runs with `ddl-auto=validate`)

## Access rules
- `/api/patient/**` ROLE_PATIENT, own records only (other ids → 404)
- `/api/physician/**` ROLE_PHYSICIAN, only admin-assigned active patients (else 404), read-only
- `/api/admin/**` ROLE_ADMIN, accounts and assignments only — no clinical data endpoints
- Pending users are authenticated but hold no role → 403 everywhere except `/api/auth/me`
- Password change/reset bumps `token_version`, revoking all existing sessions
- 5 failed logins per account → 15-minute lockout

## Run locally
Requirements: JDK 17, Maven 3.9, PostgreSQL 14+ running on `localhost:5432` with database `thyrocare` (`createdb thyrocare`).
```
mvn spring-boot:run          # http://localhost:8080/api/health
```
All config (`DATABASE_URL`, `JWT_SECRET`, `ADMIN_*`, `CORS_ORIGINS`, ...) has local-dev defaults in
`src/main/resources/application.yml`, so no env vars are needed to run. Flyway creates/updates the
schema automatically on first start. Admin login: `gillianarchuleta90119@outlook.com` / `ThyroAdmin#2026`.

To override any value, export it before running (env vars take precedence over the defaults):
```
export DATABASE_URL=jdbc:postgresql://localhost:5432/thyrocare DATABASE_USERNAME=... DATABASE_PASSWORD=...
export JWT_SECRET=<64 hex chars> ADMIN_EMAIL=... ADMIN_PASSWORD=... CORS_ORIGINS=http://localhost:3000
export COOKIE_SECURE=false SEED_DEMO_DATA=true
```
Frontend: set `REACT_APP_BACKEND_URL=http://localhost:8080` in `frontend/.env`, then `yarn start`.

## Deploy (Docker)
```
cp backend-java/deploy/.env.example backend-java/deploy/.env   # edit values
docker compose -f backend-java/deploy/docker-compose.yml --env-file backend-java/deploy/.env up --build -d
```
nginx serves the React build and proxies `/api` to Spring on the same origin, so cookies stay `SameSite=Lax`.
Put HTTPS in front (e.g. a reverse proxy with Let's Encrypt) and keep `COOKIE_SECURE=true`.

`SEED_DEMO_DATA=true` creates fictional demo accounts — keep it `false` with real patients.
