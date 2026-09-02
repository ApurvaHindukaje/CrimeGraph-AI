import numpy as np
import networkx as nx

DEFAULT_WEIGHTS = {
    "w_gnn": 0.4,
    "w_anomaly": 0.2,
    "w_community": 0.2,
    "w_centrality": 0.2
}

def calculate_degree_centralities(data):
    edge_index = data.edge_index.cpu().numpy()
    G = nx.Graph()
    G.add_nodes_from(range(data.num_nodes))
    edges = [(edge_index[0, i], edge_index[1, i]) for i in range(edge_index.shape[1])]
    G.add_edges_from(edges)
    
    deg_centrality = nx.degree_centrality(G)
    centralities = np.array([deg_centrality.get(i, 0.0) for i in range(data.num_nodes)])
    
    # Normalize to [0, 1]
    max_c = centralities.max()
    if max_c > 0:
        centralities = centralities / max_c
    return centralities

def compute_risk_score(gnn_prob, anomaly_score, community_risk, centrality, weights=None):
    """
    Computes a 0-100 tiered risk score combining GNN, anomaly detection, 
    community risk ratio, and graph centrality.
    Buckets:
      0 - 30: Low
      31 - 60: Medium
      61 - 80: High
      81 - 100: Critical
    """
    w = weights if weights is not None else DEFAULT_WEIGHTS
    
    # Community risk component (1 if community risk > 15%, else ratio)
    comm_component = min(1.0, community_risk * 3.0)
    
    raw_score = (
        w["w_gnn"] * float(gnn_prob) +
        w["w_anomaly"] * float(anomaly_score) +
        w["w_community"] * float(comm_component) +
        w["w_centrality"] * float(centrality)
    )
    
    score_100 = min(100, max(0, int(round(raw_score * 100))))
    
    if score_100 <= 30:
        tier = "Low"
    elif score_100 <= 60:
        tier = "Medium"
    elif score_100 <= 80:
        tier = "High"
    else:
        tier = "Critical"
        
    return score_100, tier
