# ThyroCare — PRD

## Original problem statement
Persian-language, RTL healthcare app "ThyroCare" (Master's thesis, Health IT) supporting self-management and longitudinal health information management for adult patients with differentiated thyroid cancer (papillary/follicular) post-surgery in follow-up. Roles: Patient, Physician/Endocrinologist, Administrator. Modules: patient dashboard, patient + thyroid cancer medical profile, education library, medication management, lab results (TSH, FT4, Tg, Anti-Tg), follow-up appointments & reminders, symptom tracking, treatment history/timeline, medical documents, physician dashboard, admin dashboard. Clinical restrictions: no AI diagnosis/treatment, no automatic lab interpretation, no dose recommendations, no decisions on surgery/RAI/recurrence, content reviewed by specialists, fictional data only. Technical: full-stack, responsive, Persian RTL, 3 roles with access control, persistent DB, secure auth, CRUD, shared backend for web + Android, deployment-ready; investigate APK packaging. Incremental development; Phase 1 = foundation, auth, RBAC, RTL, patient dashboard, patient profile.

## User choices
- Email + password (JWT httpOnly cookies, bcrypt); admin = gillianarchuleta90119@outlook.com
- Patients self-register -> pending -> admin approves; physicians created by admin only
- Physicians see only admin-assigned patients
- Jalali display, ISO storage
- Installable web app first, Capacitor APK later

## Architecture
- Backend FastAPI: core.py (db, User model, tokens w/ token_version, require_role, audit, digit/date validators), profiles.py, auth_routes.py, patient_routes.py, physician_routes.py, admin_routes.py, seed.py, server.py (indexes, origin/CSRF check, CORS)
- Collections: users, patient_profiles, medical_profiles, physician_assignments, audit_logs, login_attempts
- Frontend React RTL (Vazirmatn), react-query, shadcn, react-multi-date-picker (Persian), dayjs+jalaliday

## Implemented
- 2026-11-04: Architecture analysis
- 2026-11-04: Phase 1 — auth (register/login/logout/refresh/me/change-password), per-email lockout, token revocation on password change/reset, pending/approve/reject/disable, admin create physician, assignments, audit log, patient dashboard (completeness, medical summary, care team, coming-soon modules), patient profile (personal/medical/security tabs), physician assigned-patient list + read-only detail, Persian digit normalization, past-date validation, RTL mobile bottom nav. Tested (iteration_1) + fixes verified by curl/screenshot.

## Backlog
- P1 Phase 2: medications + lab results (TSH/FT4/Tg/Anti-Tg) with trend charts, no interpretation
- P1 Phase 3: appointments/reminders + symptom tracking
- P1 Phase 4: treatment timeline + documents (object storage)
- P1 Phase 5: education CMS with specialist review; physician notes
- P2 Phase 6: PWA manifest/service worker, Capacitor APK, deployment, security review
- P2: forgot-password via email (needs email provider), physician-entered vs patient-reported medical data

## Next tasks
- User acceptance of Phase 1, then Phase 2
