from uuid import UUID

from pydantic import BaseModel, ConfigDict


class ComplaintStatusBase(BaseModel):
    name: str
    code: str
    sort_order: int
    is_terminal: bool = False


class ComplaintStatusCreate(ComplaintStatusBase):
    pass


class ComplaintStatusRead(ComplaintStatusBase):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
