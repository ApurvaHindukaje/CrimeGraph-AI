from datetime import datetime
from typing import Optional
from pydantic import BaseModel

class AuditLogOut(BaseModel):
    id: int
    user_id: int
    action: str
    resource_type: str
    resource_id: Optional[str]
    timestamp: datetime
    ip_address: Optional[str]

    class Config:
        from_attributes = True
