import os
import sys
import torch
import torch.nn as nn
import numpy as np
from sklearn.metrics import average_precision_score, roc_auc_score, f1_score

# Ensure ml directory is in path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))

from src.data_loader import load_elliptic_data
from src.split import get_temporal_split
from src.models.gnn import EllipticGraphSAGE

ARTIFACTS_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "models_artifacts"))

def calculate_class_weights(y, train_mask):
    train_labels = y[train_mask]
    num_licit = (train_labels == 0).sum().item()
    num_illicit = (train_labels == 1).sum().item()
    total = num_licit + num_illicit
    
    if num_illicit == 0 or num_licit == 0:
        return torch.tensor([1.0, 1.0])
        
    w_licit = total / (2.0 * num_licit)
    w_illicit = total / (2.0 * num_illicit)
    
    weights = torch.tensor([w_licit, w_illicit], dtype=torch.float)
    print(f"[INFO] Computed training class weights: licit={w_licit:.4f}, illicit={w_illicit:.4f}")
    return weights

def train_gnn():
    os.makedirs(ARTIFACTS_DIR, exist_ok=True)
    data = load_elliptic_data()
    train_mask, val_mask, test_mask = get_temporal_split(data)
    
    weights = calculate_class_weights(data.y, train_mask)
    device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
    print(f"[INFO] Training GNN model on device: {device}")
    
    model = EllipticGraphSAGE(in_channels=data.num_features).to(device)
    data = data.to(device)
    weights = weights.to(device)
    
    criterion = nn.CrossEntropyLoss(weight=weights)
    optimizer = torch.optim.Adam(model.parameters(), lr=0.001, weight_decay=5e-4)
    
    best_val_pr_auc = 0.0
    patience = 20
    patience_counter = 0
    best_model_path = os.path.join(ARTIFACTS_DIR, "gnn_best.pt")
    
    model.train()
    for epoch in range(1, 201):
        model.train()
        optimizer.zero_grad()
        logits = model(data.x, data.edge_index)
        loss = criterion(logits[train_mask], data.y[train_mask])
        loss.backward()
        optimizer.step()
        
        # Evaluate on Validation set
        model.eval()
        with torch.no_grad():
            val_logits = model(data.x, data.edge_index)[val_mask]
            val_probs = torch.softmax(val_logits, dim=1)[:, 1].cpu().numpy()
            val_targets = data.y[val_mask].cpu().numpy()
            
            if len(np.unique(val_targets)) > 1:
                val_pr_auc = average_precision_score(val_targets, val_probs)
            else:
                val_pr_auc = 0.0
                
        if val_pr_auc > best_val_pr_auc:
            best_val_pr_auc = val_pr_auc
            torch.save(model.state_dict(), best_model_path)
            patience_counter = 0
        else:
            patience_counter += 1
            
        if epoch % 10 == 0 or epoch == 1:
            print(f"Epoch {epoch:03d} | Train Loss: {loss.item():.4f} | Val PR-AUC: {val_pr_auc:.4f} | Best Val PR-AUC: {best_val_pr_auc:.4f}")
            
        if patience_counter >= patience:
            print(f"[INFO] Early stopping triggered at epoch {epoch}. Best Val PR-AUC: {best_val_pr_auc:.4f}")
            break
            
    print(f"[INFO] GNN training finished. Best model saved to {best_model_path}")
    return model

if __name__ == "__main__":
    train_gnn()
