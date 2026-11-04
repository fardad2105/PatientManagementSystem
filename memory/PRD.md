# ThyroCare — PRD

## Original problem statement
Persian-language, RTL healthcare app "ThyroCare" (Master's thesis, Health IT) supporting self-management and longitudinal health information management for adult patients with differentiated thyroid cancer (papillary/follicular) post-surgery in follow-up. Roles: Patient, Physician/Endocrinologist, Administrator. Modules: patient dashboard, patient + thyroid cancer medical profile, education library, medication management, lab results (TSH, FT4, Tg, Anti-Tg), follow-up appointments & reminders, symptom tracking, treatment history/timeline, medical documents, physician dashboard, admin dashboard. Clinical restrictions: no AI diagnosis/treatment, no automatic lab interpretation, no dose recommendations, no decisions on surgery/RAI/recurrence, content reviewed by specialists, fictional data only. Technical: full-stack, responsive, Persian RTL, 3 roles with access control, persistent DB, secure auth, CRUD, shared backend for web + Android, deployment-ready; investigate APK packaging. Incremental development.

Later request (2026-11-04, Persian): change the Phase 1 backend to Java + Spring Framework + Hibernate + Spring Security and continue Phase 2 (Medications and Labs) in Java. User chose: "write Java backend without running it on Emergent" (Emergent preview/Publish support Python only).

## User choices
- Email + password (JWT httpOnly cookies, bcrypt); admin = gillianarchuleta90119@outlook.com
- Patients self-register -> pending -> admin approves; physicians created by admin only
- Physicians see only admin-assigned patients; Jalali display; PWA first, APK later
- Backend: Java 17 / Spring Boot 3.3 / Hibernate (JPA) / Spring Security / PostgreSQL / Flyway — self-hosted (Docker compose provided)

## Architecture
- /app/backend-java: domain (9 JPA entities), repository/Repositories.java, security (JwtService, JwtAuthFilter, OriginCheckFilter, SecurityConfig), service (Auth, Profile, Medication, Lab, Access, Audit), web (controllers + Dtos records, snake_case JSON), seed/DataSeeder, db/migration V1+V2, Dockerfile, deploy/ (docker-compose, nginx, frontend.Dockerfile, .env.example), run-local.sh
- /app/backend (Python FastAPI): Phase 1 only, legacy; still what supervisor/Emergent preview start by default
- Frontend React RTL: same API contract for both backends

## Implemented
- 2026-11-04: Architecture analysis
- 2026-11-04: Phase 1 (Python) — auth, RBAC, approval, profiles, dashboards, audit (iteration_1)
- 2026-11-04: Phase 1 ported to Java/Spring + Phase 2: medications (CRUD, intake logs taken/missed), labs TSH/FT4/Tg/Anti-Tg (CRUD, per-test units, lab reference range, linear time-scaled trend chart, no interpretation), dashboard summaries, physician read-only meds/labs. Tested in sandbox with temporary JDK + PostgreSQL (iteration_2: 35/36 then fixes verified by curl/screenshot)

- 2026-11-04: Phase 3 (Java) — appointments CRUD + status (scheduled/done/cancelled/missed, overdue prompt), in-app reminders (window before visit, dashboard + appointments page), next appointment on dashboard, physician read-only appointments; medication intake log with chosen Jalali date + 24h Persian time (future rejected). Flyway V3. iteration_3: backend 43/43, UI flows pass

## Backlog
- P1: symptom tracking (remaining from original Phase 3 plan)
- P2: push/email reminders when app is closed (needs FCM/email provider)
- P1 Phase 4: treatment timeline + documents (file storage)
- P1 Phase 5: education CMS with specialist review; physician notes / physician-entered labs
- P2 Phase 6: PWA, Capacitor APK, production hosting, security review; Java automated tests (Testcontainers)
- P2: forgot-password via email; custom intake time for medication logs

## Next tasks
- User runs Java backend locally or on their server (README), then Phase 3
