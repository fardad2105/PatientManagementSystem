# ThyroCare — PRD

## Original problem statement
Persian-language, RTL healthcare app "ThyroCare" (Master's thesis, Health IT) supporting self-management and longitudinal health information management for adult patients with differentiated thyroid cancer (papillary/follicular) post-surgery in follow-up. Roles: Patient, Physician/Endocrinologist, Administrator. Modules: patient dashboard, patient + thyroid cancer medical profile, education library, medication management, lab results (TSH, FT4, Tg, Anti-Tg), follow-up appointments & reminders, symptom tracking, treatment history/timeline, medical documents, physician dashboard, admin dashboard. Clinical restrictions: no AI diagnosis/treatment, no automatic lab interpretation, no dose recommendations, no decisions on surgery/RAI/recurrence, content reviewed by specialists, fictional data only. Technical: full-stack, responsive, Persian RTL, 3 roles with access control, persistent DB, secure auth, CRUD, shared backend for web + Android, deployment-ready; investigate APK packaging. Incremental development; Phase 1 = foundation, auth, RBAC, RTL, patient dashboard, patient profile. First task: analysis only, no implementation.

## User choices (2026-11-04)
- Auth: email + password (JWT, bcrypt), seeded admin
- Accounts: patients self-register -> admin approves; physicians created by admin only
- Physician access: only patients assigned by admin
- Calendar: Jalali display, ISO/UTC storage
- Android: installable PWA first, Capacitor APK in later phase (built on user's machine)

## Architecture (proposed)
React (CRA + Tailwind + shadcn, RTL, Vazirmatn font) / FastAPI / MongoDB. Single /api backend shared by web, PWA and APK.

## Implemented
- 2026-11-04: Architecture analysis only. No code written.

## Backlog
- P0 Phase 1: auth, RBAC, approval flow, RTL shell, patient dashboard, patient profile, audit log
- P1 Phase 2: medications + lab results; Phase 3: appointments/reminders + symptoms
- P1 Phase 4: timeline + documents (object storage); Phase 5: physician & admin dashboards, education CMS with review workflow
- P2 Phase 6: PWA hardening, Capacitor APK, deployment, security review

## Next tasks
- Await user approval of architecture, then start Phase 1
