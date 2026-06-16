from pydantic import BaseModel

class ComplaintRequest(BaseModel):
    complaint: str