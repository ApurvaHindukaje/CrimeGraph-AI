import os
import sys
import json
import argparse
import torch
import numpy as np

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from src.data_loader import load_elliptic_data
from src.split import get_temporal_split
from src.models.gnn import EllipticGraphSAGE
from src.community_detection import detect_communities_louvain
from src.anomaly_detection import detect_anomalies_isolation_forest
from src.explainability import generate_entity_explanations
from src.risk_scoring import compute_risk_score, calculate_degree_centralities

ARTIFACTS_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "models_artifacts"))

def run_inference(data=None):
    """
    Single inference entrypoint for graph transaction pattern analysis.
    Produces list of EntityResult JSON objects as defined by spec Section 1.9.
    """
    if data is None:
        data = load_elliptic_data()
        
    train_mask, val_mask, test_mask = get_temporal_split(data)
    
    device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
    model = EllipticGraphSAGE(in_channels=data.num_features).to(device)
    
    model_path = os.path.join(ARTIFACTS_DIR, "gnn_best.pt")
    if os.path.exists(model_path):
        model.load_state_dict(torch.load(model_path, map_location=device, weights_only=True))
        print(f"[INFO] Inference using model weights from {model_path}")
    else:
        print("[WARNING] gnn_best.pt not found. Running inference with initial weights.")
        
    model.eval()
    data = data.to(device)
    
    with torch.no_grad():
        logits = model(data.x, data.edge_index)
        probs = torch.softmax(logits, dim=1)[:, 1].cpu().numpy()
        
    anomaly_scores = detect_anomalies_isolation_forest(data, train_mask)
    partition, community_risk = detect_communities_louvain(data)
    centralities = calculate_degree_centralities(data)
    
    results = []
    tx_ids = getattr(data, "tx_ids", [f"tx_{i}" for i in range(data.num_nodes)])
    
    for i in range(data.num_nodes):
        gnn_prob = float(probs[i])
        anom_score = float(anomaly_scores[i])
        comm_id = int(partition.get(i, 0))
        comm_r = float(community_risk.get(comm_id, 0.0))
        cent = float(centralities[i])
        
        r_score, r_tier = compute_risk_score(gnn_prob, anom_score, comm_r, cent)
        reasons = generate_entity_explanations(i, data, gnn_prob, anom_score, comm_id, comm_r, partition)
        
        comm_risk_label = "high" if comm_r > 0.15 else ("medium" if comm_r > 0.05 else "low")
        
        entity_res = {
            "entity_id": tx_ids[i],
            "gnn_illicit_probability": round(gnn_prob, 4),
            "anomaly_score": round(anom_score, 4),
            "community_id": comm_id,
            "community_risk": comm_risk_label,
            "centrality": round(cent, 4),
            "risk_score": r_score,
            "risk_tier": r_tier,
            "reasons": reasons
        }
        results.append(entity_res)
        
    return results

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Run ML pipeline inference")
    parser.add_argument("--output", type=str, default="results.json", help="Path to output JSON")
    args = parser.parse_args()
    
    res = run_inference()
    with open(args.output, "w") as f:
        json.dump(res, f, indent=2)
    print(f"[SUCCESS] Inference completed for {len(res)} entities. Output saved to {args.output}")
