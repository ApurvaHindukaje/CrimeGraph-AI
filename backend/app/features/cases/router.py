from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.shared.database import get_db
from app.shared.models import Case, Entity, User, UserRole, AuditLog
from app.features.auth import get_current_user, require_role
from .schemas import CaseCreate, CaseOut, CaseDetailOut, EntityOut
from .ml_bridge import trigger_ml_analysis

router = APIRouter(prefix="/cases", tags=["Cases"])

@router.get("", response_model=List[CaseOut])
def list_cases(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    cases = db.query(Case).all()
    out = []
    for c in cases:
        c_dict = CaseOut.from_orm(c)
        c_dict.entity_count = db.query(Entity).filter(Entity.case_id == c.id).count()
        out.append(c_dict)
    return out

@router.post("", response_model=CaseOut)
def create_case(
    case_in: CaseCreate,
    db: Session = Depends(get_db),
    user: User = Depends(require_role([UserRole.ADMIN, UserRole.INVESTIGATOR]))
):
    new_case = Case(
        title=case_in.title,
        description=case_in.description,
        created_by=user.id
    )
    db.add(new_case)
    
    # Audit log
    audit = AuditLog(
        user_id=user.id,
        action="CREATE_CASE",
        resource_type="case",
        resource_id=str(new_case.title)
    )
    db.add(audit)
    db.commit()
    db.refresh(new_case)
    
    c_out = CaseOut.from_orm(new_case)
    c_out.entity_count = 0
    return c_out

@router.get("/{id}", response_model=CaseDetailOut)
def get_case(id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    case = db.query(Case).filter(Case.id == id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
        
    c_out = CaseDetailOut.from_orm(case)
    c_out.entity_count = len(case.entities)
    return c_out

@router.get("/{id}/entities", response_model=List[EntityOut])
def get_case_entities(id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    case = db.query(Case).filter(Case.id == id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    return case.entities

@router.post("/{id}/analyze")
def analyze_case(
    id: int,
    db: Session = Depends(get_db),
    user: User = Depends(require_role([UserRole.ADMIN, UserRole.INVESTIGATOR, UserRole.ANALYST]))
):
    case = db.query(Case).filter(Case.id == id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
        
    print(f"[INFO] Triggering ML pattern detection analysis for case {id}...")
    ml_results = trigger_ml_analysis()
    
    # Clear existing entities for this case if re-analyzed
    db.query(Entity).filter(Entity.case_id == id).delete()
    
    # Insert new analyzed entities
    entities_to_add = []
    for item in ml_results:
        ent = Entity(
            case_id=id,
            external_id=item["entity_id"],
            risk_score=item["risk_score"],
            risk_tier=item["risk_tier"],
            gnn_probability=item["gnn_illicit_probability"],
            anomaly_score=item["anomaly_score"],
            community_id=item["community_id"],
            centrality=item["centrality"],
            reasons=item["reasons"],
            raw_ml_output=item
        )
        entities_to_add.append(ent)
        
    db.bulk_save_objects(entities_to_add)
    
    # Audit log
    audit = AuditLog(
        user_id=user.id,
        action="ANALYZE_CASE_ML",
        resource_type="case",
        resource_id=str(id)
    )
    db.add(audit)
    db.commit()
    
    return {"message": f"ML analysis completed successfully. {len(entities_to_add)} entities analyzed and stored.", "case_id": id}
