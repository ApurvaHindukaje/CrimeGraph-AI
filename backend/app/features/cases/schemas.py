from datetime import datetime
from typing import List, Optional, Any, Dict
from pydantic import BaseModel
from app.shared.models import CaseStatus

class EntityOut(BaseModel):
    id: int
    case_id: int
    external_id: str
    risk_score: int
    risk_tier: str
    gnn_probability: float
    anomaly_score: float
    community_id: int
    centrality: float
    reasons: List[str]
    raw_ml_output: Optional[Dict[str, Any]] = None
    created_at: datetime

    class Config:
        from_attributes = True

class CaseCreate(BaseModel):
    title: str
    description: Optional[str] = None

class CaseOut(BaseModel):
    id: int
    title: str
    description: Optional[str]
    created_by: int
    status: CaseStatus
    created_at: datetime
    entity_count: Optional[int] = 0

    class Config:
        from_attributes = True

class CaseDetailOut(CaseOut):
    entities: List[EntityOut] = []
