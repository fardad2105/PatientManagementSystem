# Auth Testing Playbook

1. Mongo: `db.users.find({role:"admin"})` — hash starts with `$2b$`; indexes users.email unique, login_attempts.identifier.
2. API:
```
curl -c c.txt -X POST $URL/api/auth/login -H "Content-Type: application/json" -d '{"email":"...","password":"..."}'
curl -b c.txt $URL/api/auth/me
```
Login returns the user and sets access_token + refresh_token cookies; /me returns the same user.
3. Pending users can log in but get 403 on /api/patient/*. Rejected/disabled users get 403 on login.
4. Physician requesting an unassigned patient -> 404. Patient calling /api/admin/* or /api/physician/* -> 403.
5. 5 failed logins from same ip+email -> 429 lockout for 15 min.
