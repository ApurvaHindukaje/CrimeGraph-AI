from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.shared.database import get_db
from app.shared.models import User, UserRole, AuditLog
from .schemas import UserCreate, UserOut, Token, UserLogin
from .rbac import verify_password, get_password_hash, create_access_token, get_current_user, require_role

router = APIRouter(prefix="/auth", tags=["Auth"])

@router.post("/login", response_model=Token)
def login(login_data: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == login_data.username).first()
    if not user or not verify_password(login_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password"
        )
        
    access_token = create_access_token(data={"sub": user.username, "role": user.role.value})
    return {"access_token": access_token, "token_type": "bearer", "user": user}

@router.post("/register", response_model=UserOut)
def register_user(
    user_in: UserCreate, 
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_role([UserRole.ADMIN]))
):
    existing = db.query(User).filter((User.username == user_in.username) | (User.email == user_in.email)).first()
    if existing:
        raise HTTPException(status_code=400, detail="Username or email already registered")
        
    new_user = User(
        username=user_in.username,
        email=user_in.email,
        password_hash=get_password_hash(user_in.password),
        role=user_in.role
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # Log audit action
    audit = AuditLog(
        user_id=admin_user.id,
        action=f"CREATE_USER_{new_user.role.value.upper()}",
        resource_type="user",
        resource_id=str(new_user.id)
    )
    db.add(audit)
    db.commit()

    return new_user

@router.get("/users", response_model=List[UserOut])
def list_users(
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_role([UserRole.ADMIN]))
):
    return db.query(User).order_by(User.id.asc()).all()

@router.get("/me", response_model=UserOut)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user
