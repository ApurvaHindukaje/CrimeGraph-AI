from datetime import datetime
from typing import Optional, Any, Dict
from pydantic import BaseModel
from app.shared.models import VerificationStatus

class EvidenceCreateStructured(BaseModel):
    case_id: int
    entity_id: Optional[int] = None
    description: str
    mode: str = "structured"
    data: Dict[str, Any]

class EvidenceOut(BaseModel):
    id: int
    case_id: int
    entity_id: Optional[int]
    description: str
    file_reference: Optional[str]
    sha256_hash: str
    blockchain_tx_id: Optional[str]
    verification_status: VerificationStatus
    uploaded_by: int
    created_at: datetime

    class Config:
        from_attributes = True
