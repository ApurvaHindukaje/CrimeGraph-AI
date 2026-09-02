import sys
import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.shared import settings, engine, Base, SessionLocal, User, UserRole, Case, Entity
from app.features.auth import auth_router, get_password_hash
from app.features.cases import cases_router
from app.features.evidence import evidence_router
from app.features.audit import audit_router

limiter = Limiter(key_func=get_remote_address)

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("[INFO] Initializing Database Schema...")
    import time
    for attempt in range(10):
        try:
            Base.metadata.create_all(bind=engine)
            db = SessionLocal()
            try:
                default_users = [
                    ("admin", "admin@analysis.local", "admin123", UserRole.ADMIN),
                    ("investigator1", "investigator1@analysis.local", "investigator123", UserRole.INVESTIGATOR),
                    ("analyst1", "analyst1@analysis.local", "analyst123", UserRole.ANALYST)
                ]
                for uname, email, raw_pass, role in default_users:
                    usr = db.query(User).filter(User.username == uname).first()
                    if not usr:
                        print(f"[INFO] Creating default seed account: {uname}")
                        new_usr = User(
                            username=uname,
                            email=email,
                            password_hash=get_password_hash(raw_pass),
                            role=role
                        )
                        db.add(new_usr)
                    else:
                        print(f"[INFO] Syncing password hash for default seed account: {uname}")
                        usr.password_hash = get_password_hash(raw_pass)
                db.commit()
                print("[SUCCESS] Default seed accounts verified and synced.")

                # Seed default logical investigative cases if none exist
                admin_usr = db.query(User).filter(User.username == "admin").first()
                if admin_usr:
                    existing_cases_count = db.query(Case).count()
                    if existing_cases_count == 0:
                        print("[INFO] Seeding logical investigative cases...")
                        default_cases = [
                            {
                                "title": "Operation DarkNet Mixer — High-Volume BTC Tumbler Investigation",
                                "description": "Investigation into automated Bitcoin mixing services laundering ransomware proceeds across 45 linked intermediary wallets."
                            },
                            {
                                "title": "Operation Aegis — Ransomware Payment Flow Analysis",
                                "description": "Tracing $2.4M USD equivalent crypto ransom payments stemming from corporate infrastructure attacks."
                            },
                            {
                                "title": "Operation Chameleon — Cross-Chain DEX Swap Trail",
                                "description": "Identifying rapid cross-chain swaps between Ethereum and privacy-focused tokens to obscure illicit fund origin."
                            },
                            {
                                "title": "Operation SanctionShield — OFAC-Sanctioned Address Cluster",
                                "description": "Analysis of wallet addresses interacting with sanctioned entity nodes and high-risk mixers."
                            }
                        ]

                        from app.features.cases import trigger_ml_analysis
                        ml_results = trigger_ml_analysis()

                        for c_info in default_cases:
                            c = Case(
                                title=c_info["title"],
                                description=c_info["description"],
                                created_by=admin_usr.id
                            )
                            db.add(c)
                            db.commit()
                            db.refresh(c)

                            # Populate analyzed entities for each case
                            entities_to_add = []
                            for item in ml_results:
                                ent = Entity(
                                    case_id=c.id,
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
                            db.commit()
                        print(f"[SUCCESS] Seeded {len(default_cases)} logical cases with analyzed graph entities.")
            finally:
                db.close()
            break
        except Exception as e:
            print(f"[WARNING] DB initialization retry ({attempt+1}/10): {e}")
            time.sleep(2)
    yield

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="AI-Powered Suspicious Pattern Analysis System Backend API. Identifies statistical patterns associated with illicit transaction categories.",
    version="1.0.0",
    lifespan=lifespan
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(cases_router)
app.include_router(evidence_router)
app.include_router(audit_router)

@app.get("/")
def read_root():
    return {
        "status": "online",
        "system": settings.PROJECT_NAME,
        "framing": "Identifies statistical patterns associated with illicit transaction categories in training data; does not determine legal guilt."
    }
