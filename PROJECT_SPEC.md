# AI-Powered Criminal Network Analysis System — Full Build Specification

**Purpose of this document:** This is a complete, self-contained implementation spec intended to be fed to an AI coding agent (e.g., Claude Code) to build the entire system with minimal human intervention. It specifies exact technologies, folder structure, data schemas, module contracts, and step-by-step build order.

---

## 0. PROJECT SUMMARY

Build a system that:
1. Detects suspicious/illicit patterns in cryptocurrency transaction graphs using a Graph Neural Network (GNN), community detection, and anomaly detection.
2. Explains *why* each entity was flagged (explainability) and produces a tiered risk score.
3. Registers evidence (analysis results) with tamper-proof integrity guarantees using blockchain (hash-only, not raw data).
4. Wraps all of this in a secured, role-based web application with a graph-visualization dashboard.

**Framing constraint (must appear in UI copy, docstrings, and report):** The system identifies statistical patterns *associated with* illicit transaction categories in the training data. It does not determine guilt or claim to identify "criminals." All UI labels should say "suspicious pattern" / "risk score" / "flagged for review" — never "criminal" or "guilty."

---

## 1. FINAL TECH STACK (locked — do not substitute without reason)

| Layer | Technology |
|---|---|
| ML/GNN | Python 3.11, PyTorch 2.x, PyTorch Geometric (PyG) |
| Graph algorithms | NetworkX, python-louvain (`community` package) |
| Anomaly detection | scikit-learn (IsolationForest) |
| Explainability | PyTorch Geometric's `GNNExplainer` or `captum` integration |
| Backend API | Python 3.11, FastAPI, Uvicorn |
| Database | PostgreSQL 15+, SQLAlchemy 2.x (ORM), Alembic (migrations), JSONB columns for flexible fields |
| Auth | JWT (via `python-jose`), `passlib[bcrypt]` for password hashing |
| Blockchain | Solidity ^0.8.20, Hardhat (dev/test framework), Ethers.js v6, local Hardhat network for dev/demo |
| Backend↔Blockchain bridge | `web3.py` in FastAPI backend |
| Frontend | React 18 + Vite, TypeScript |
| Graph visualization | Cytoscape.js (via `react-cytoscapejs`) |
| Charts | Recharts (for risk distribution, metric charts) |
| Styling | Tailwind CSS |
| Containerization | Docker + docker-compose (Postgres, backend, hardhat node, frontend as services) |
| Dataset | Elliptic Bitcoin Dataset (Kaggle: `ellipticco/elliptic-data-set`) |

---

## 2. REPOSITORY STRUCTURE

```
criminal-network-analysis/
├── docker-compose.yml
├── README.md
├── ml/
│   ├── requirements.txt
│   ├── data/
│   │   ├── raw/                        # elliptic_txs_features.csv, elliptic_txs_classes.csv, elliptic_txs_edgelist.csv
│   │   └── processed/                  # cached graph objects, train/val/test node index files
│   ├── src/
│   │   ├── data_loader.py              # loads Elliptic CSVs, builds PyG Data object
│   │   ├── split.py                    # temporal train/val/test split (see Section 4.2)
│   │   ├── models/
│   │   │   ├── gnn.py                  # GraphSAGE/GCN model definition
│   │   │   └── train.py                # training loop, class-weighted loss
│   │   ├── community_detection.py      # Louvain on the graph
│   │   ├── anomaly_detection.py        # Isolation Forest on node features
│   │   ├── explainability.py           # GNNExplainer wrapper, produces reason codes
│   │   ├── risk_scoring.py             # combines GNN score + anomaly + community risk into 0-100 score
│   │   ├── evaluate.py                 # precision/recall/F1/ROC-AUC/PR-AUC/modularity
│   │   └── inference.py                # single entrypoint: raw graph -> risk-scored entities + explanations (JSON)
│   ├── notebooks/
│   │   └── experiments.ipynb           # Girvan-Newman vs Louvain, Autoencoder vs IsolationForest comparisons (optional/report-only)
│   └── models_artifacts/               # saved model weights (.pt), scalers (.pkl)
├── backend/
│   ├── requirements.txt
│   ├── app/
│   │   ├── main.py
│   │   ├── config.py
│   │   ├── database.py
│   │   ├── models/                     # SQLAlchemy ORM models (see Section 5.2)
│   │   ├── schemas/                    # Pydantic request/response schemas
│   │   ├── routers/
│   │   │   ├── auth.py
│   │   │   ├── cases.py
│   │   │   ├── entities.py             # exposes ML inference results
│   │   │   ├── evidence.py             # hashing + blockchain registration
│   │   │   └── audit.py
│   │   ├── services/
│   │   │   ├── ml_bridge.py            # calls ml/src/inference.py (subprocess or shared package)
│   │   │   ├── blockchain_service.py   # web3.py calls to smart contract
│   │   │   ├── hashing.py              # SHA-256 utilities
│   │   │   └── rbac.py                 # role/permission decorators
│   │   └── alembic/                    # migrations
├── blockchain/
│   ├── hardhat.config.js
│   ├── contracts/
│   │   └── EvidenceRegistry.sol        # see Section 6.2
│   ├── scripts/
│   │   └── deploy.js
│   └── test/
│       └── EvidenceRegistry.test.js
└── frontend/
    ├── package.json
    ├── src/
    │   ├── pages/
    │   │   ├── Login.tsx
    │   │   ├── Dashboard.tsx
    │   │   ├── CaseDetail.tsx          # Cytoscape graph + risk scores
    │   │   ├── EntityDetail.tsx        # explainability breakdown for one entity
    │   │   └── AuditLog.tsx
    │   ├── components/
    │   │   ├── GraphView.tsx
    │   │   ├── RiskBadge.tsx
    │   │   ├── ExplainabilityPanel.tsx
    │   │   └── BlockchainVerifyBadge.tsx
    │   ├── api/                        # typed API client
    │   └── auth/                       # JWT storage, RBAC-aware route guards
```

---

## 3. BUILD ORDER (agent should execute phases sequentially, each phase must be runnable/testable before moving to the next)

> **Note on phase numbering:** Explainability and risk scoring (steps 1.6–1.7 below) are part of PHASE 1, not a separate phase. If you previously discussed a 6-phase plan with explainability as its own phase, that maps to steps 1.6–1.7 here — the numbering below (Phase 1 ML → Phase 2 Backend → Phase 3 Blockchain → Phase 4 Frontend → Phase 5 Evaluation) is the authoritative one.

## PHASE 1 — ML PIPELINE

### 1.1 Dataset setup
- Download Elliptic dataset (3 CSVs: `elliptic_txs_features.csv` — 166 features per transaction node incl. a time-step column; `elliptic_txs_classes.csv` — labels: 1=illicit, 2=licit, unknown=unlabeled; `elliptic_txs_edgelist.csv` — directed edges).
- Load into a PyTorch Geometric `Data` object: node features `x`, edge index `edge_index`, labels `y` (map: illicit→1, licit→0, unknown→-1/mask out).

### 1.2 Temporal train/val/test split (CRITICAL — prevents data leakage)
- The dataset has 49 discrete time steps.
- Use a **transductive temporal split**: e.g., time steps 1–34 = train, 35–39 = validation, 40–49 = test. (Exact cutoffs can be tuned, but must be chronological, never random-shuffle.)
- The full graph (all nodes/edges across all time steps) is present during message passing (transductive setting is standard for Elliptic), but **loss and metrics are computed only on nodes whose time step falls in the respective split**, and only on labeled nodes.
- Document this explicitly in code comments and in the report.

### 1.3 GNN model (`ml/src/models/gnn.py`)
- Architecture: 2–3 layer GraphSAGE (or GCN as a simpler fallback) → binary node classification (illicit/licit).
- Input dim: 165 (feature count, excluding time step column) or as loaded.
- Hidden dim: 128 → 64.
- Output: 2-class logits (or 1 sigmoid output).
- Loss: `CrossEntropyLoss` with `weight=[w_licit, w_illicit]` computed from inverse class frequency in the **training split only**.
- Optimizer: Adam, lr=0.001, weight_decay=5e-4.
- Train for up to 200 epochs with early stopping on validation PR-AUC (patience=20).
- Save best model to `ml/models_artifacts/gnn_best.pt`.

### 1.4 Community detection (`ml/src/community_detection.py`)
- Convert PyG graph to NetworkX (undirected for Louvain).
- Run Louvain (`community.best_partition`) → community ID per node.
- Compute per-community illicit-node ratio → flag "high-risk communities" (e.g., top quartile by illicit ratio).
- Also implement Girvan-Newman as a separate function used ONLY in `notebooks/experiments.ipynb` for a comparison table (modularity score comparison) — not part of the production pipeline.

### 1.5 Anomaly detection (`ml/src/anomaly_detection.py`)
- Run `sklearn.ensemble.IsolationForest` on node feature vectors (fit on train-split nodes only, transform all).
- Output an anomaly score per node (higher = more anomalous).
- Also implement an Autoencoder variant in the notebook only, for a comparison table (reconstruction-error vs Isolation Forest score correlation with true labels) — not part of production pipeline.

### 1.6 Explainability (`ml/src/explainability.py`)
- Use PyG's `GNNExplainer` (or `torch_geometric.explain.Explainer` with `GNNExplainer` algorithm) on flagged high-risk nodes.
- For each explained node, extract:
  - Top-k contributing neighbor nodes (by edge mask importance)
  - Top-k contributing features (by node feature mask importance)
- Reasons must be generated by a **rule-based template layer over measurable GNNExplainer output** — not free-text paraphrasing of "what the model believes." The pipeline is strictly:
  ```
  GNNExplainer → important edges → important neighbor nodes → important feature indices
       → rule-based template → reason string
  ```
- **CRITICAL: Never invent semantic names for Elliptic's features.** They are PCA-anonymized/anonymized — there is no documented mapping to real-world concepts like "transaction frequency." Reference them only as `feature_12`, `feature_47`, etc. Do not let the agent generate human-sounding feature names; this would be a fabricated claim.
- Example of a correctly-scoped reason set:
  ```json
  {
    "node_id": "...",
    "reasons": [
      "Connected to 17 flagged accounts",
      "feature_47 was among the top contributing features to this prediction (anonymized feature — no semantic label available)",
      "Member of high-risk community #12"
    ]
  }
  ```
- Do NOT produce reasons like "the model believes this wallet is suspicious because of its transaction behavior" — this is unfalsifiable and not traceable to actual explainer output.

### 1.7 Risk scoring (`ml/src/risk_scoring.py`)
- Combine into a single 0–100 score per node:
  ```
  risk_score = w1 * normalize(gnn_illicit_probability)
             + w2 * normalize(isolation_forest_anomaly_score)
             + w3 * (1 if node in high_risk_community else 0)
             + w4 * normalize(graph_centrality)   # degree centrality by default (cheap); betweenness only if runtime on the actual graph proves acceptable — it's O(V*E) and can get expensive, so treat it as optional, not required
  ```
  Start with baseline heuristic weights (0.4, 0.2, 0.2, 0.2) — these are **arbitrary initial configuration values, not empirically validated weights**, and must not be described as "equal." Store them in a config file (not hard-coded) so they can be adjusted. If tuned later, tuning must use the validation split only, never the test split, and the tuning methodology must be documented in the report.
- Bucket: 0–30 Low, 31–60 Medium, 61–80 High, 81–100 Critical.

### 1.8 Evaluation (`ml/src/evaluate.py`)
- On test split (labeled nodes only): Precision, Recall, F1, ROC-AUC, **PR-AUC (primary metric given class imbalance)**, confusion matrix.
- Community metrics: modularity score, number of communities, illicit-node concentration per community.
- Save all metrics to `ml/models_artifacts/eval_report.json` for use in the report and dashboard.

### 1.9 Inference entrypoint (`ml/src/inference.py`)
- Single function `run_inference(graph_data) -> List[EntityResult]` where each `EntityResult` is:
  ```json
  {
    "entity_id": "tx_12345",
    "gnn_illicit_probability": 0.87,
    "anomaly_score": 0.62,
    "community_id": 12,
    "community_risk": "high",
    "centrality": 0.045,
    "risk_score": 84,
    "risk_tier": "Critical",
    "reasons": ["...", "...", "..."]
  }
  ```
- This JSON contract is what the backend consumes — build backend against this schema.

**Phase 1 deliverable check:** running `python ml/src/inference.py --input <graph> --output results.json` should produce a valid results file, and `python ml/src/evaluate.py` should print/save metrics. This is your MVP checkpoint.

---

## PHASE 2 — BACKEND + DATABASE

### 2.1 Database schema (PostgreSQL, via SQLAlchemy models)

```
users
  id (PK), username, email, password_hash, role (enum: admin, investigator, analyst, viewer), created_at

cases
  id (PK), title, description, created_by (FK users), status (enum: open, closed, archived), created_at

entities
  id (PK), case_id (FK), external_id (e.g. wallet/tx id), risk_score, risk_tier,
  gnn_probability, anomaly_score, community_id, centrality,
  reasons (JSONB), raw_ml_output (JSONB), created_at

evidence
  id (PK), case_id (FK), entity_id (FK, nullable), description,
  file_reference (nullable), sha256_hash, blockchain_tx_id, verification_status (enum: pending, registered, verified, tampered),
  uploaded_by (FK users), created_at

audit_log
  id (PK), user_id (FK), action (string), resource_type, resource_id, timestamp, ip_address
```

- Use JSONB for `reasons` and `raw_ml_output` (flexible, since ML output shape may evolve).
- Alembic for migrations; write initial migration creating all tables.

### 2.2 Auth & RBAC
- JWT-based auth (`/auth/login`, `/auth/register` — register restricted to admin-created accounts).
- Roles and permissions:
  - **admin**: manage users, all permissions
  - **investigator**: create cases, upload evidence, view analysis
  - **analyst**: run ML analysis, view results (no evidence upload)
  - **viewer**: read-only on permitted cases
- Implement as a FastAPI dependency `require_role(["admin", "investigator"])` used on route decorators.
- Passwords hashed with bcrypt via passlib.

### 2.3 API endpoints (minimum set)

```
POST   /auth/login
POST   /auth/register              (admin only)

GET    /cases
POST   /cases
GET    /cases/{id}

POST   /cases/{id}/analyze         # triggers ml_bridge -> inference.py, stores entities
GET    /cases/{id}/entities
GET    /entities/{id}              # includes reasons/explainability

POST   /evidence                   # supports two input modes, see below
GET    /evidence/{id}/verify        # re-hashes current data, compares to on-chain hash, returns match/tamper; only this call may transition status to verified/tampered

GET    /audit-log                  (admin only)
```

### 2.4 `POST /evidence` — explicit dual-mode contract
This endpoint must unambiguously support exactly two input modes (the agent should not have to infer which applies):
1. **File upload mode**: multipart file upload → hash = SHA-256 of the raw uploaded file bytes, unmodified.
2. **Structured/ML evidence mode**: JSON body (e.g. an entity's `raw_ml_output`) → hash = SHA-256 of the canonicalized serialization (`sort_keys=True`, fixed separators — see Section 6.3's hashing rule).

Request schema should include a `mode` field (`"file"` | `"structured"`) so the backend branches deterministically rather than guessing from payload shape. Both modes converge on the same downstream flow: compute hash → call `register_evidence` → store `evidence` row with status `registered`.

### 2.5 ML bridge (`app/services/ml_bridge.py`)
- Simplest correct approach: package `ml/src` as an importable module (`pip install -e ./ml`) and call `inference.run_inference()` directly from FastAPI, rather than subprocess calls — cleaner error handling.

### 2.6 Security additions
- All endpoints behind JWT.
- HTTPS assumed in deployment notes (local dev can be HTTP).
- Sensitive fields (e.g., `password_hash`) never returned in responses — enforce via Pydantic response models that exclude them.
- Rate limiting: use `slowapi` (simple, avoids building a custom gateway).

**Phase 2 deliverable check:** Full CRUD + auth working against Postgres, testable via FastAPI's auto-generated `/docs` (Swagger UI).

---

## PHASE 3 — BLOCKCHAIN LAYER

### 3.1 Smart contract (`blockchain/contracts/EvidenceRegistry.sol`)

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract EvidenceRegistry {
    struct EvidenceRecord {
        string evidenceId;
        bytes32 evidenceHash;
        uint256 timestamp;
        address investigator;
    }

    struct ActionRecord {
        string evidenceId;
        string action;         // e.g. "created", "accessed", "analyzed", "verified", "archived"
        address actor;
        uint256 timestamp;
    }

    mapping(string => EvidenceRecord) public records;
    ActionRecord[] public actionLog;

    event EvidenceRegistered(string evidenceId, bytes32 evidenceHash, address investigator, uint256 timestamp);
    event ActionRecorded(string evidenceId, string action, address actor, uint256 timestamp);

    function registerEvidence(string memory evidenceId, bytes32 evidenceHash) public {
        require(records[evidenceId].timestamp == 0, "Evidence already registered");
        records[evidenceId] = EvidenceRecord(evidenceId, evidenceHash, block.timestamp, msg.sender);
        emit EvidenceRegistered(evidenceId, evidenceHash, msg.sender, block.timestamp);
        actionLog.push(ActionRecord(evidenceId, "created", msg.sender, block.timestamp));
    }

    // Chain-of-custody: call this on every meaningful interaction with the evidence
    // (accessed, analyzed, verified, archived, etc.) so there is an on-chain audit trail
    // beyond the initial registration.
    function recordAction(string memory evidenceId, string memory action) public {
        require(records[evidenceId].timestamp != 0, "Evidence not registered");
        actionLog.push(ActionRecord(evidenceId, action, msg.sender, block.timestamp));
        emit ActionRecorded(evidenceId, action, msg.sender, block.timestamp);
    }

    function verifyEvidence(string memory evidenceId, bytes32 currentHash) public view returns (bool) {
        return records[evidenceId].evidenceHash == currentHash;
    }

    function getRecord(string memory evidenceId) public view returns (EvidenceRecord memory) {
        return records[evidenceId];
    }
}
```

### 3.2 Deployment
- Use Hardhat local network for dev/demo (`npx hardhat node`, then `scripts/deploy.js`).
- Write basic Hardhat tests (`test/EvidenceRegistry.test.js`) covering: register succeeds, duplicate register reverts, verify returns true for unmodified hash / false for tampered hash, `recordAction` appends correctly and reverts for unregistered evidence.

### 3.3 Backend integration (`backend/app/services/blockchain_service.py`)
- Use `web3.py` connected to the Hardhat local node RPC.
- `register_evidence(evidence_id, sha256_hash) -> tx_hash`
- `verify_evidence(evidence_id, current_hash) -> bool`
- `record_action(evidence_id, action) -> tx_hash` — call on evidence access, analysis, verification, and archival events for a genuine on-chain chain-of-custody trail (not just initial registration).
- Flow: evidence created in backend → SHA-256 computed → `register_evidence` called → tx hash stored in `evidence.blockchain_tx_id` → `verification_status` set to `registered` (NOT `verified` — registration only proves the hash was recorded on-chain, it does not by itself confirm anything).
- `verification_status` only becomes `verified` (or `tampered`) after the `/evidence/{id}/verify` endpoint is explicitly called and actually compares current-data-hash against on-chain-hash. Lifecycle: `pending` (created, not yet registered) → `registered` (hash on-chain) → `verified` or `tampered` (comparison actually performed). The UI must never display "Verified on-chain" before a real verification call has occurred — showing that label immediately after registration would be a false claim.
- On-demand verification endpoint re-hashes current record and calls `verify_evidence`.
- **Hashing input must be precisely defined and consistent:**
  - If evidence is a file, hash the raw file bytes directly.
  - If evidence is a structured/JSON analysis result, hash a **canonicalized serialization** (sorted keys, fixed separators, e.g. `json.dumps(data, sort_keys=True, separators=(",", ":"))`) so semantically identical objects always hash identically regardless of key order.
  - Never hash a Python dict's default `str()` or an unsorted `json.dumps()` — this is a common source of false "tampering" alerts.

**Phase 3 deliverable check:** Hardhat tests pass; backend can register and verify a piece of evidence end-to-end against the local chain.

---

## PHASE 4 — FRONTEND

### 4.1 Pages
- **Login** — JWT auth form.
- **Dashboard** — list of cases, risk distribution chart (Recharts), quick stats.
- **CaseDetail** — Cytoscape.js graph of entities/relationships, nodes colored by risk tier, click node → side panel.
- **EntityDetail / side panel** — risk score, tier badge, explainability reasons list, blockchain verification badge for linked evidence.
- **AuditLog** — table view (admin only).

### 4.2 Key components
- `GraphView.tsx`: Cytoscape instance, nodes styled by `risk_tier` color (Low=green, Medium=yellow, High=orange, Critical=red).
- `RiskBadge.tsx`: colored pill showing tier + numeric score.
- `ExplainabilityPanel.tsx`: renders `reasons[]` as a checklist (matches the "Reasons: ✓ ..." format from the design discussion).
- `BlockchainVerifyBadge.tsx`: green check "Verified on-chain" / red "Tampering detected" based on `/evidence/{id}/verify`.

### 4.3 Auth
- **Locked decision: store JWT in memory** (React context/state, not localStorage or a cookie) — this avoids CSRF-protection and cross-origin cookie configuration overhead that isn't worth it for a local student demo with separate frontend/backend origins. Token is lost on page refresh; acceptable for this project's scope (a "remember me" refresh-token flow is an optional stretch goal, not required).
- Route guards based on decoded role claim.

**Phase 4 deliverable check:** Full flow clickable: login → view case → view graph → click entity → see risk + explanation → view linked evidence → see blockchain verification status.

---

## PHASE 5 — EVALUATION + REPORT ARTIFACTS

- Compile `ml/models_artifacts/eval_report.json` metrics into report tables/charts.
- Document explicitly in the report:
  - Class imbalance handling approach (class-weighted loss, not SMOTE — rationale: SMOTE distorts graph topology).
  - Temporal split methodology and why (data leakage prevention).
  - Elliptic dataset limitations: PCA-anonymized features, ~2% labeled illicit, unlabeled majority, illicit labels correspond to documented categories (scams, malware, ransomware payments, etc.) — not a general theory of criminality.
  - Explicit framing statement: "This system identifies patterns statistically associated with illicit transaction categories in the training data; it does not determine guilt and is not a general criminal-detection system."

---

## 4. ENVIRONMENT / SETUP FILES THE AGENT SHOULD GENERATE

- `ml/requirements.txt`: torch, torch-geometric, networkx, python-louvain, scikit-learn, pandas, numpy, captum (if used for explainability)
  - **Installation note for the agent:** Do not blindly pin `torch-scatter`/`torch-sparse` versions independent of the detected PyTorch/CUDA (or CPU-only) environment — PyG's compiled extensions are notoriously version-sensitive and mismatched pins are a common source of hours-long dependency debugging. Instead, detect the installed PyTorch version and CUDA availability first, then follow PyG's official per-version installation matrix/instructions for that exact combination. If GPU/CUDA isn't available or isn't needed for this project's data size, prefer the CPU-only PyG wheels to sidestep the issue entirely — Elliptic is small enough that CPU training is acceptable for a student project.
- `backend/requirements.txt`: fastapi, uvicorn[standard], sqlalchemy, alembic, psycopg2-binary, python-jose[cryptography], passlib[bcrypt], web3, slowapi, pydantic-settings
- `blockchain/package.json`: hardhat, @nomicfoundation/hardhat-toolbox, ethers
- `frontend/package.json`: react, react-dom, vite, typescript, react-cytoscapejs, cytoscape, recharts, tailwindcss, axios, react-router-dom
- `docker-compose.yml`: services for `postgres`, `backend`, `hardhat-node`, `frontend`, with env vars wired (DB URL, JWT secret, RPC URL, contract address).
  - **Sequencing note: Docker is a final integration/deployment step, not a Phase 1 requirement.** Run Postgres, the backend, the Hardhat node, and the frontend natively during development. Debugging PyTorch/PyG + PostgreSQL + Node/Hardhat + React simultaneously inside Docker is unnecessary friction until each piece already works standalone. Write the Dockerfiles/compose file last, after Phase 4's deliverable check passes.

### 4.4 Dataset acquisition note
- The agent should **not** attempt to auto-download the Elliptic dataset from Kaggle (requires user credentials it won't have). Instead: `ml/data/raw/` should have a `README.md` stating the three required filenames, and `data_loader.py` should check for their presence at startup and raise a clear, actionable error ("Missing elliptic_txs_features.csv — download from https://www.kaggle.com/datasets/ellipticco/elliptic-data-set and place in ml/data/raw/") if they're absent, rather than failing with an unrelated file-not-found trace.

---

## 5. INSTRUCTIONS FOR THE AI CODING AGENT

1. Build strictly in phase order (1→5). Do not start Phase 2 until Phase 1's deliverable check passes.
2. After each phase, run and show the deliverable check output before proceeding.
3. Use the exact JSON contract in Section 3.1.9 (`EntityResult`) as the interface between ML and backend — do not silently change field names.
4. Never store raw evidence content on-chain — only SHA-256 hashes (Section 3.1's constraint applies throughout).
5. Never implement SMOTE on the graph-structured data; use class-weighted loss as specified.
6. Enforce the temporal (non-random) train/val/test split at all times; flag and refuse any code path that would shuffle nodes randomly across time steps for train/test purposes.
7. Keep Girvan-Newman and Autoencoder implementations confined to `ml/notebooks/experiments.ipynb` — do not wire them into the production inference pipeline.
8. All UI/API copy referring to flagged entities must use "suspicious," "flagged," or "risk," never "criminal" or "guilty."
9. If any ambiguity arises that isn't resolved by this spec, prefer the simplest implementation that satisfies the stated requirement, and note the assumption in a code comment.
10. Do not introduce new frameworks, libraries, or infrastructure (e.g. Celery, Redis, a message queue) without explicit justification tied to a stated requirement — the `POST /cases/{id}/analyze` endpoint should run synchronously for this project's scope; a job-status polling pattern is an acceptable future extension but is not required now.
11. Do not change API/JSON contracts (e.g. the `EntityResult` schema) without updating every consumer of that contract in the same change.
12. Every phase should include automated tests where applicable (Hardhat tests for the contract, pytest for backend routes, at minimum a smoke test for the ML inference entrypoint).
13. Do not fabricate semantic meaning for anonymized/PCA-transformed dataset features under any circumstances — see Section 3.1.6.
14. Do not tune, select models, or report metrics based on the test split at any point — the test split is touched exactly once, at final evaluation.
15. Do not report accuracy as a standalone or headline metric given the severe class imbalance — PR-AUC, precision, recall, and F1 must always accompany or replace it.
16. Do not hard-code secrets, private keys, database passwords, or JWT signing secrets anywhere in source — use environment variables / a `.env` file (gitignored) with a checked-in `.env.example` template.
17. **This specification is frozen.** Do not introduce Transformers/BERT, an IDS/SIEM, Redis, Celery, Kafka, a second blockchain platform, federated learning, reinforcement learning, additional GNN architectures beyond the one specified, Kubernetes/microservices, cloud deployment infrastructure, or additional databases — regardless of how naturally they might seem to fit as the build progresses. The complete intended pipeline is: Transaction Graph → GNN → Community Detection → Anomaly Detection → Risk Score → Explainability → Evidence Hash → Blockchain → Secure API → Graph Dashboard. Anything not in that list is out of scope.
18. **Build Phase 1 (ML pipeline) to its deliverable check completely before touching Phase 2.** Do not start scaffolding the backend, database, or frontend while the GNN/inference pipeline is still unproven — a working `EntityResult` JSON output and a saved `eval_report.json` are the gate.
