from uuid import UUID

from pydantic import BaseModel, EmailStr

from app.models.user import UserRole
from app.schemas.common import TimestampedResponse


class UserBase(BaseModel):
    full_name: str
    email: EmailStr
    phone: str | None = None
    role: UserRole = UserRole.CITIZEN
    department_id: UUID | None = None
    is_active: bool = True


class UserCreate(UserBase):
    password: str | None = None


class UserRead(UserBase, TimestampedResponse):
    id: UUID
