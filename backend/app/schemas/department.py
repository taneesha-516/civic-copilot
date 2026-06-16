from uuid import UUID

from pydantic import BaseModel, EmailStr

from app.schemas.common import TimestampedResponse


class DepartmentBase(BaseModel):
    name: str
    code: str
    description: str | None = None
    contact_email: EmailStr | None = None
    is_active: bool = True


class DepartmentCreate(DepartmentBase):
    pass


class DepartmentUpdate(BaseModel):
    name: str | None = None
    code: str | None = None
    description: str | None = None
    contact_email: EmailStr | None = None
    is_active: bool | None = None


class DepartmentRead(DepartmentBase, TimestampedResponse):
    id: UUID
