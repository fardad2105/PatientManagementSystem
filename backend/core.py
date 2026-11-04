import os
from datetime import datetime, timezone, timedelta
from typing import Annotated, Optional

import bcrypt
import jwt
from bson import ObjectId
from bson.errors import InvalidId
from fastapi import Depends, HTTPException, Request, Response
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, BeforeValidator, ConfigDict, Field

client = AsyncIOMotorClient(os.environ["MONGO_URL"])
db = client[os.environ["DB_NAME"]]

JWT_ALGORITHM = "HS256"
ACCESS_MINUTES = 15
REFRESH_DAYS = 7

PyObjectId = Annotated[str, BeforeValidator(lambda v: str(v))]
DateStr = Annotated[Optional[str], Field(default=None, pattern=r"^\d{4}-\d{2}-\d{2}$")]


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def to_oid(value: str) -> ObjectId:
    try:
        return ObjectId(value)
    except (InvalidId, TypeError):
        raise HTTPException(status_code=404, detail="مورد یافت نشد")


class BaseDocument(BaseModel):
    model_config = ConfigDict(populate_by_name=True, extra="ignore")
    id: Optional[PyObjectId] = Field(default=None, alias="_id")

    @classmethod
    def from_mongo(cls, doc):
        return cls.model_validate(doc) if doc else None

    def to_mongo(self) -> dict:
        return self.model_dump(exclude={"id"})


class User(BaseDocument):
    email: str
    name: str
    role: str  # patient | physician | admin
    status: str  # pending | active | rejected | disabled
    phone: Optional[str] = None
    specialty: Optional[str] = None
    password_hash: str = ""
    created_at: str = Field(default_factory=now_iso)
    status_changed_at: Optional[str] = None

    def public(self) -> dict:
        return self.model_dump(exclude={"password_hash"})


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))


def _secret() -> str:
    return os.environ["JWT_SECRET"]


def create_token(user_id: str, kind: str) -> str:
    delta = timedelta(minutes=ACCESS_MINUTES) if kind == "access" else timedelta(days=REFRESH_DAYS)
    payload = {"sub": user_id, "type": kind, "exp": datetime.now(timezone.utc) + delta}
    return jwt.encode(payload, _secret(), algorithm=JWT_ALGORITHM)


def decode_token(token: str, kind: str) -> str:
    try:
        payload = jwt.decode(token, _secret(), algorithms=[JWT_ALGORITHM])
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="نشست شما منقضی شده است")
    if payload.get("type") != kind:
        raise HTTPException(status_code=401, detail="توکن نامعتبر است")
    return payload["sub"]


def set_auth_cookies(response: Response, user_id: str) -> None:
    opts = dict(httponly=True, secure=True, samesite="lax", path="/")
    response.set_cookie("access_token", create_token(user_id, "access"), max_age=ACCESS_MINUTES * 60, **opts)
    response.set_cookie("refresh_token", create_token(user_id, "refresh"), max_age=REFRESH_DAYS * 86400, **opts)


def clear_auth_cookies(response: Response) -> None:
    response.delete_cookie("access_token", path="/")
    response.delete_cookie("refresh_token", path="/")


async def get_current_user(request: Request) -> User:
    token = request.cookies.get("access_token")
    if not token:
        header = request.headers.get("Authorization", "")
        if header.startswith("Bearer "):
            token = header[7:]
    if not token:
        raise HTTPException(status_code=401, detail="لطفاً وارد حساب کاربری شوید")
    user_id = decode_token(token, "access")
    user = User.from_mongo(await db.users.find_one({"_id": to_oid(user_id)}))
    if not user or user.status in ("disabled", "rejected"):
        raise HTTPException(status_code=401, detail="حساب کاربری فعال نیست")
    return user


def require_role(*roles: str):
    async def checker(user: User = Depends(get_current_user)) -> User:
        if user.status != "active":
            raise HTTPException(status_code=403, detail="حساب شما هنوز توسط مدیر سیستم تأیید نشده است")
        if user.role not in roles:
            raise HTTPException(status_code=403, detail="شما به این بخش دسترسی ندارید")
        return user
    return checker


async def audit(actor: Optional[User], action: str, resource_type: str, resource_id: Optional[str] = None,
                outcome: str = "allow", details: Optional[str] = None) -> None:
    await db.audit_logs.insert_one({
        "actor_id": actor.id if actor else None,
        "actor_email": actor.email if actor else None,
        "actor_role": actor.role if actor else None,
        "action": action,
        "resource_type": resource_type,
        "resource_id": resource_id,
        "outcome": outcome,
        "details": details,
        "created_at": now_iso(),
    })
