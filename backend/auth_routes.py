from datetime import datetime, timezone, timedelta
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Request, Response
from pydantic import BaseModel, EmailStr, Field

from core import (User, audit, clear_auth_cookies, db, decode_token, get_current_user, hash_password, now_iso,
                  set_auth_cookies, to_oid, verify_password)

router = APIRouter(prefix="/api/auth")

MAX_ATTEMPTS = 5
LOCK_MINUTES = 15


class RegisterIn(BaseModel):
    name: str = Field(min_length=2, max_length=80)
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    phone: Optional[str] = Field(default=None, pattern=r"^[0-9+\-\s]{7,20}$")


class LoginIn(BaseModel):
    email: str
    password: str


class ChangePasswordIn(BaseModel):
    current_password: str
    new_password: str = Field(min_length=8, max_length=128)


@router.post("/register")
async def register(body: RegisterIn, response: Response):
    email = body.email.lower()
    if await db.users.find_one({"email": email}):
        raise HTTPException(status_code=400, detail="این ایمیل قبلاً ثبت شده است")
    user = User(email=email, name=body.name.strip(), phone=body.phone, role="patient", status="pending",
                password_hash=hash_password(body.password))
    result = await db.users.insert_one(user.to_mongo())
    user.id = str(result.inserted_id)
    await audit(user, "register", "user", user.id)
    set_auth_cookies(response, user.id)
    return user.public()


@router.post("/login")
async def login(body: LoginIn, request: Request, response: Response):
    email = body.email.strip().lower()
    identifier = f"{request.client.host if request.client else 'unknown'}:{email}"
    attempt = await db.login_attempts.find_one({"identifier": identifier})
    now = datetime.now(timezone.utc)
    if attempt and attempt.get("locked_until") and datetime.fromisoformat(attempt["locked_until"]) > now:
        raise HTTPException(status_code=429, detail="به دلیل تلاش‌های ناموفق متعدد، ورود به مدت ۱۵ دقیقه مسدود شد")
    user = User.from_mongo(await db.users.find_one({"email": email}))
    if not user or not verify_password(body.password, user.password_hash):
        count = (attempt or {}).get("count", 0) + 1
        update = {"count": count, "updated_at": now.isoformat()}
        if count >= MAX_ATTEMPTS:
            update = {"count": 0, "locked_until": (now + timedelta(minutes=LOCK_MINUTES)).isoformat()}
        await db.login_attempts.update_one({"identifier": identifier}, {"$set": update}, upsert=True)
        await audit(None, "login_failed", "user", None, "deny", email)
        raise HTTPException(status_code=401, detail="ایمیل یا رمز عبور اشتباه است")
    if user.status == "rejected":
        raise HTTPException(status_code=403, detail="درخواست ثبت‌نام شما توسط مدیر سیستم رد شده است")
    if user.status == "disabled":
        raise HTTPException(status_code=403, detail="حساب کاربری شما غیرفعال شده است")
    await db.login_attempts.delete_one({"identifier": identifier})
    await audit(user, "login", "user", user.id)
    set_auth_cookies(response, user.id)
    return user.public()


@router.post("/logout")
async def logout(response: Response):
    clear_auth_cookies(response)
    return {"ok": True}


@router.get("/me")
async def me(user: User = Depends(get_current_user)):
    return user.public()


@router.post("/refresh")
async def refresh(request: Request, response: Response):
    token = request.cookies.get("refresh_token")
    if not token:
        raise HTTPException(status_code=401, detail="نشست شما منقضی شده است")
    user_id = decode_token(token, "refresh")
    user = User.from_mongo(await db.users.find_one({"_id": to_oid(user_id)}))
    if not user or user.status in ("disabled", "rejected"):
        clear_auth_cookies(response)
        raise HTTPException(status_code=401, detail="حساب کاربری فعال نیست")
    set_auth_cookies(response, user.id)
    return user.public()


@router.post("/change-password")
async def change_password(body: ChangePasswordIn, user: User = Depends(get_current_user)):
    if not verify_password(body.current_password, user.password_hash):
        raise HTTPException(status_code=400, detail="رمز عبور فعلی اشتباه است")
    await db.users.update_one({"_id": to_oid(user.id)},
                              {"$set": {"password_hash": hash_password(body.new_password), "password_changed_at": now_iso()}})
    await audit(user, "change_password", "user", user.id)
    return {"ok": True}
