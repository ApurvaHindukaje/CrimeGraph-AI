import os
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from sqlalchemy.orm import Session
from app.shared.database import get_db
from app.shared.models import Evidence, VerificationStatus, User, UserRole, AuditLog
from app.features.auth import get_current_user, require_role
from .schemas import EvidenceOut, EvidenceCreateStructured
from .hashing import hash_file_bytes, hash_structured_data
from .blockchain import blockchain_service

router = APIRouter(prefix="/evidence", tags=["Evidence"])

UPLOAD_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", "uploads"))
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/file", response_model=EvidenceOut)
async def upload_file_evidence(
    case_id: int = Form(...),
    description: str = Form(...),
    entity_id: Optional[int] = Form(None),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    user: User = Depends(require_role([UserRole.ADMIN, UserRole.INVESTIGATOR]))
):
    file_bytes = await file.read()
    sha256_h = hash_file_bytes(file_bytes)
    
    file_path = os.path.join(UPLOAD_DIR, f"{sha256_h[:10]}_{file.filename}")
    with open(file_path, "wb") as f:
        f.write(file_bytes)
        
    evidence = Evidence(
        case_id=case_id,
        entity_id=entity_id,
        description=description,
        file_reference=file_path,
        sha256_hash=sha256_h,
        verification_status=VerificationStatus.PENDING,
        uploaded_by=user.id
    )
    db.add(evidence)
    db.commit()
    db.refresh(evidence)
    
    # Register hash on blockchain
    tx_id = blockchain_service.register_evidence(str(evidence.id), sha256_h)
    evidence.blockchain_tx_id = tx_id
    evidence.verification_status = VerificationStatus.REGISTERED
    
    # Audit log
    audit = AuditLog(
        user_id=user.id,
        action="REGISTER_EVIDENCE_FILE",
        resource_type="evidence",
        resource_id=str(evidence.id)
    )
    db.add(audit)
    db.commit()
    db.refresh(evidence)
    
    return evidence

@router.post("/structured", response_model=EvidenceOut)
def create_structured_evidence(
    ev_in: EvidenceCreateStructured,
    db: Session = Depends(get_db),
    user: User = Depends(require_role([UserRole.ADMIN, UserRole.INVESTIGATOR]))
):
    sha256_h = hash_structured_data(ev_in.data)
    
    evidence = Evidence(
        case_id=ev_in.case_id,
        entity_id=ev_in.entity_id,
        description=ev_in.description,
        file_reference=None,
        sha256_hash=sha256_h,
        verification_status=VerificationStatus.PENDING,
        uploaded_by=user.id
    )
    db.add(evidence)
    db.commit()
    db.refresh(evidence)
    
    # Register hash on blockchain
    tx_id = blockchain_service.register_evidence(str(evidence.id), sha256_h)
    evidence.blockchain_tx_id = tx_id
    evidence.verification_status = VerificationStatus.REGISTERED
    
    # Audit log
    audit = AuditLog(
        user_id=user.id,
        action="REGISTER_EVIDENCE_STRUCTURED",
        resource_type="evidence",
        resource_id=str(evidence.id)
    )
    db.add(audit)
    db.commit()
    db.refresh(evidence)
    
    return evidence

@router.get("/{id}/verify", response_model=EvidenceOut)
def verify_evidence(id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    evidence = db.query(Evidence).filter(Evidence.id == id).first()
    if not evidence:
        raise HTTPException(status_code=404, detail="Evidence not found")
        
    # Re-hash local data / file if exists
    current_hash = evidence.sha256_hash
    if evidence.file_reference and os.path.exists(evidence.file_reference):
        with open(evidence.file_reference, "rb") as f:
            current_hash = hash_file_bytes(f.read())
            
    is_valid = blockchain_service.verify_evidence(str(evidence.id), current_hash)
    
    if is_valid and current_hash == evidence.sha256_hash:
        evidence.verification_status = VerificationStatus.VERIFIED
        blockchain_service.record_action(str(evidence.id), "verified")
    else:
        evidence.verification_status = VerificationStatus.TAMPERED
        blockchain_service.record_action(str(evidence.id), "tamper_alert")
        
    audit = AuditLog(
        user_id=current_user.id,
        action=f"VERIFY_EVIDENCE_{evidence.verification_status.value.upper()}",
        resource_type="evidence",
        resource_id=str(evidence.id)
    )
    db.add(audit)
    db.commit()
    db.refresh(evidence)
    
    return evidence

@router.get("/case/{case_id}", response_model=List[EvidenceOut])
def get_case_evidence(case_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(Evidence).filter(Evidence.case_id == case_id).order_by(Evidence.id.desc()).all()
