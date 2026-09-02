import os
import sys
import json
import torch
import numpy as np
from sklearn.metrics import (
    precision_score, recall_score, f1_score, roc_auc_score,
    average_precision_score, confusion_matrix
)
import community as community_louvain
import networkx as nx

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from src.data_loader import load_elliptic_data
from src.split import get_temporal_split
from src.models.gnn import EllipticGraphSAGE
from src.community_detection import detect_communities_louvain

ARTIFACTS_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "models_artifacts"))

def evaluate_pipeline():
    os.makedirs(ARTIFACTS_DIR, exist_ok=True)
    data = load_elliptic_data()
    train_mask, val_mask, test_mask = get_temporal_split(data)
    
    device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
    model = EllipticGraphSAGE(in_channels=data.num_features).to(device)
    
    model_path = os.path.join(ARTIFACTS_DIR, "gnn_best.pt")
    if os.path.exists(model_path):
        model.load_state_dict(torch.load(model_path, map_location=device, weights_only=True))
        print(f"[INFO] Loaded trained GNN model weights from {model_path}")
    else:
        print("[WARNING] Trained model weights not found. Running evaluation with untrained model.")
        
    model.eval()
    data = data.to(device)
    
    with torch.no_grad():
        logits = model(data.x, data.edge_index)
        probs = torch.softmax(logits, dim=1)[:, 1].cpu().numpy()
        preds = torch.argmax(logits, dim=1).cpu().numpy()
        
    test_indices = test_mask.cpu().numpy()
    y_test = data.y.cpu().numpy()[test_indices]
    probs_test = probs[test_indices]
    preds_test = preds[test_indices]
    
    prec = precision_score(y_test, preds_test, zero_division=0)
    rec = recall_score(y_test, preds_test, zero_division=0)
    f1 = f1_score(y_test, preds_test, zero_division=0)
    
    if len(np.unique(y_test)) > 1:
        roc_auc = roc_auc_score(y_test, probs_test)
        pr_auc = average_precision_score(y_test, probs_test)
    else:
        roc_auc, pr_auc = 0.0, 0.0
        
    cm = confusion_matrix(y_test, preds_test).tolist()
    
    # Community detection metrics
    partition, community_risk = detect_communities_louvain(data)
    
    # Calculate Louvain modularity
    edge_index = data.edge_index.cpu().numpy()
    G = nx.Graph()
    G.add_nodes_from(range(data.num_nodes))
    edges = [(edge_index[0, i], edge_index[1, i]) for i in range(edge_index.shape[1])]
    G.add_edges_from(edges)
    modularity = community_louvain.modularity(partition, G)
    
    report = {
        "evaluation_split": "temporal_test_split (steps 40-49)",
        "num_test_labeled_nodes": int(test_mask.sum().item()),
        "metrics": {
            "precision": float(prec),
            "recall": float(rec),
            "f1_score": float(f1),
            "roc_auc": float(roc_auc),
            "pr_auc": float(pr_auc)
        },
        "confusion_matrix": cm,
        "community_analysis": {
            "num_communities": len(set(partition.values())),
            "modularity_score": float(modularity),
            "high_risk_communities": sum(1 for r in community_risk.values() if r > 0.15)
        },
        "framing_notice": "Identifies statistical patterns associated with illicit transaction categories in training data; does not determine legal guilt."
    }
    
    report_path = os.path.join(ARTIFACTS_DIR, "eval_report.json")
    with open(report_path, "w") as f:
        json.dump(report, f, indent=2)
        
    print(f"[INFO] Evaluation report saved to {report_path}")
    print(json.dumps(report, indent=2))
    return report

if __name__ == "__main__":
    evaluate_pipeline()
