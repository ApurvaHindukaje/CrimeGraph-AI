import pytest
from fastapi.testclient import TestClient
import sys, os

sys.path.append(os.path.abspath(os.path.dirname(__file__)))

from app.main import app

def test_read_root():
    with TestClient(app) as client:
        response = client.get("/")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "online"
        assert "framing" in data

def test_login_success():
    with TestClient(app) as client:
        response = client.post("/auth/login", json={"username": "admin", "password": "admin123"})
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["user"]["username"] == "admin"
        assert data["user"]["role"] == "admin"

def test_create_and_analyze_case():
    with TestClient(app) as client:
        # Login as admin
        login_res = client.post("/auth/login", json={"username": "admin", "password": "admin123"})
        token = login_res.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        # Create Case
        case_res = client.post("/cases", json={"title": "Test Crypto Case #1", "description": "Automated test case"}, headers=headers)
        assert case_res.status_code == 200
        case_id = case_res.json()["id"]
        
        # Analyze Case
        analyze_res = client.post(f"/cases/{case_id}/analyze", headers=headers)
        assert analyze_res.status_code == 200
        
        # Get Entities
        entities_res = client.get(f"/cases/{case_id}/entities", headers=headers)
        assert entities_res.status_code == 200
        entities = entities_res.json()
        assert len(entities) > 0
        assert "risk_score" in entities[0]
        assert "reasons" in entities[0]

def test_evidence_structured_dual_mode():
    with TestClient(app) as client:
        login_res = client.post("/auth/login", json={"username": "admin", "password": "admin123"})
        token = login_res.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        # Register structured evidence
        evidence_res = client.post("/evidence/structured", json={
            "case_id": 1,
            "description": "Structured ML pattern output evidence",
            "mode": "structured",
            "data": {"txId": "tx_99999", "risk_score": 85}
        }, headers=headers)
        assert evidence_res.status_code == 200
        ev = evidence_res.json()
        assert ev["verification_status"] == "registered"
        assert len(ev["sha256_hash"]) == 64
        
        # Verify evidence
        verify_res = client.get(f"/evidence/{ev['id']}/verify", headers=headers)
        assert verify_res.status_code == 200
        assert verify_res.json()["verification_status"] in ["verified", "registered"]
