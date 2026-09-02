import torch
import numpy as np

def generate_entity_explanations(node_idx, data, gnn_prob, anomaly_score, community_id, community_risk, partition):
    """
    Generates rule-based structured explanations based on measurable GNN, topological, 
    and feature properties.
    Strictly avoids fabricating semantic names for anonymized PCA features.
    """
    reasons = []
    
    # 1. Neighbor analysis (Graph topology)
    edge_index = data.edge_index.cpu().numpy()
    neighbors = edge_index[1, edge_index[0] == node_idx]
    labels = data.y.cpu().numpy()
    
    illicit_neighbors = sum(1 for n in neighbors if labels[n] == 1)
    if illicit_neighbors > 0:
        reasons.append(f"Connected to {illicit_neighbors} flagged node(s) in local transaction neighborhood")
    elif len(neighbors) > 5:
        reasons.append(f"High node degree ({len(neighbors)} transaction connections)")
        
    # 2. Feature analysis (Identify top magnitude feature indices)
    x_node = data.x[node_idx].cpu().numpy()
    top_feature_indices = np.argsort(np.abs(x_node))[-3:][::-1]
    feat_str = ", ".join([f"feature_{i}" for i in top_feature_indices])
    reasons.append(f"Top feature contributions: {feat_str} (anonymized PCA features — no semantic label available)")
    
    # 3. Community risk
    if community_risk > 0.15:
        reasons.append(f"Member of high-risk transaction community #{community_id} ({community_risk*100:.1f}% flagged ratio)")
    else:
        reasons.append(f"Assigned to transaction community #{community_id}")
        
    # 4. Anomaly score
    if anomaly_score > 0.6:
        reasons.append(f"Isolation Forest feature vector anomaly score is high ({anomaly_score:.2f})")
        
    # 5. GNN confidence
    if gnn_prob > 0.7:
        reasons.append(f"GNN pattern classifier illicit probability score: {gnn_prob*100:.1f}%")
        
    return reasons
