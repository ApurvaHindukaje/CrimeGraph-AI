from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.shared.database import get_db
from app.shared.models import AuditLog, User, UserRole
from app.features.auth import require_role
from .schemas import AuditLogOut

router = APIRouter(prefix="/audit-log", tags=["Audit"])

@router.get("", response_model=List[AuditLogOut])
def get_audit_log(
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_role([UserRole.ADMIN]))
):
    return db.query(AuditLog).order_by(AuditLog.timestamp.desc()).all()
