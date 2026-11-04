from datetime import datetime, timezone, timedelta
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Request, Response
from pydantic import BaseModel, EmailStr, Field

from pymongo import ReturnDocument

from core import (PhoneStr, User, audit, clear_auth_cookies, db, get_current_user, hash_password, now_iso,
                  set_auth_cookies, to_oid, user_from_token, verify_password)

router = APIRouter(prefix="/api/auth")

MAX_ATTEMPTS = 5
LOCK_MINUTES = 15


class RegisterIn(BaseModel):
    name: str = Field(min_length=2, max_length=80)
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    phone: PhoneStr


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
    set_auth_cookies(response, user)
    return user.public()


@router.post("/login")
async def login(body: LoginIn, response: Response):
    email = body.email.strip().lower()
    identifier = email  # per-account lockout; ingress pod IPs are not real client IPs
    locked_msg = "به دلیل تلاش‌های ناموفق متعدد، ورود به مدت ۱۵ دقیقه مسدود شد"
    attempt = await db.login_attempts.find_one({"identifier": identifier})
    now = datetime.now(timezone.utc)
    if attempt and attempt.get("locked_until") and datetime.fromisoformat(attempt["locked_until"]) > now:
        raise HTTPException(status_code=429, detail=locked_msg)
    user = User.from_mongo(await db.users.find_one({"email": email}))
    if not user or not verify_password(body.password, user.password_hash):
        doc = await db.login_attempts.find_one_and_update(
            {"identifier": identifier}, {"$inc": {"count": 1}, "$set": {"updated_at": now.isoformat()}},
            upsert=True, return_document=ReturnDocument.AFTER)
        await audit(None, "login_failed", "user", None, "deny", email)
        if doc["count"] >= MAX_ATTEMPTS:
            await db.login_attempts.update_one({"identifier": identifier}, {"$set": {
                "count": 0, "locked_until": (now + timedelta(minutes=LOCK_MINUTES)).isoformat()}})
            raise HTTPException(status_code=429, detail=locked_msg)
        raise HTTPException(status_code=401, detail="ایمیل یا رمز عبور اشتباه است")
    if user.status == "rejected":
        raise HTTPException(status_code=403, detail="درخواست ثبت‌نام شما توسط مدیر سیستم رد شده است")
    if user.status == "disabled":
        raise HTTPException(status_code=403, detail="حساب کاربری شما غیرفعال شده است")
    await db.login_attempts.delete_one({"identifier": identifier})
    await audit(user, "login", "user", user.id)
    set_auth_cookies(response, user)
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
    user = await user_from_token(token, "refresh")
    if not user:
        clear_auth_cookies(response)
        raise HTTPException(status_code=401, detail="نشست شما معتبر نیست؛ دوباره وارد شوید")
    set_auth_cookies(response, user)
    return user.public()


@router.post("/change-password")
async def change_password(body: ChangePasswordIn, response: Response, user: User = Depends(get_current_user)):
    if not verify_password(body.current_password, user.password_hash):
        raise HTTPException(status_code=400, detail="رمز عبور فعلی اشتباه است")
    await db.users.update_one({"_id": to_oid(user.id)}, {
        "$set": {"password_hash": hash_password(body.new_password), "password_changed_at": now_iso()},
        "$inc": {"token_version": 1}})
    await audit(user, "change_password", "user", user.id)
    user.token_version += 1
    set_auth_cookies(response, user)
    return {"ok": True}
