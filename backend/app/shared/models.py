import enum
from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Enum as SQLEnum, JSON, Text
from sqlalchemy.orm import relationship
from app.shared.database import Base

class UserRole(str, enum.Enum):
    ADMIN = "admin"
    INVESTIGATOR = "investigator"
    ANALYST = "analyst"
    VIEWER = "viewer"

class CaseStatus(str, enum.Enum):
    OPEN = "open"
    CLOSED = "closed"
    ARCHIVED = "archived"

class VerificationStatus(str, enum.Enum):
    PENDING = "pending"
    REGISTERED = "registered"
    VERIFIED = "verified"
    TAMPERED = "tampered"

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(SQLEnum(UserRole), default=UserRole.ANALYST, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    cases = relationship("Case", back_populates="creator")
    evidence_uploads = relationship("Evidence", back_populates="uploader")
    audit_logs = relationship("AuditLog", back_populates="user")

class Case(Base):
    __tablename__ = "cases"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    status = Column(SQLEnum(CaseStatus), default=CaseStatus.OPEN, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    creator = relationship("User", back_populates="cases")
    entities = relationship("Entity", back_populates="case", cascade="all, delete-orphan")
    evidence = relationship("Evidence", back_populates="case", cascade="all, delete-orphan")

class Entity(Base):
    __tablename__ = "entities"
    
    id = Column(Integer, primary_key=True, index=True)
    case_id = Column(Integer, ForeignKey("cases.id"), nullable=False)
    external_id = Column(String(100), index=True, nullable=False)
    risk_score = Column(Integer, nullable=False)
    risk_tier = Column(String(20), nullable=False)
    gnn_probability = Column(Float, nullable=False)
    anomaly_score = Column(Float, nullable=False)
    community_id = Column(Integer, nullable=False)
    centrality = Column(Float, nullable=False)
    reasons = Column(JSON, nullable=True)
    raw_ml_output = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    case = relationship("Case", back_populates="entities")
    evidence = relationship("Evidence", back_populates="entity")

class Evidence(Base):
    __tablename__ = "evidence"
    
    id = Column(Integer, primary_key=True, index=True)
    case_id = Column(Integer, ForeignKey("cases.id"), nullable=False)
    entity_id = Column(Integer, ForeignKey("entities.id"), nullable=True)
    description = Column(Text, nullable=False)
    file_reference = Column(String(255), nullable=True)
    sha256_hash = Column(String(64), nullable=False)
    blockchain_tx_id = Column(String(100), nullable=True)
    verification_status = Column(SQLEnum(VerificationStatus), default=VerificationStatus.PENDING, nullable=False)
    uploaded_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    case = relationship("Case", back_populates="evidence")
    entity = relationship("Entity", back_populates="evidence")
    uploader = relationship("User", back_populates="evidence_uploads")

class AuditLog(Base):
    __tablename__ = "audit_log"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    action = Column(String(100), nullable=False)
    resource_type = Column(String(50), nullable=False)
    resource_id = Column(String(50), nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow)
    ip_address = Column(String(45), nullable=True)
    
    user = relationship("User", back_populates="audit_logs")
