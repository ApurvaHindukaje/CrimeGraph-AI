import networkx as nx
import community as community_louvain
import torch
import numpy as np

def detect_communities_louvain(data):
    """
    Applies Louvain community detection on the transaction graph.
    Returns:
      community_map: dict mapping node_idx -> community_id
      community_risk: dict mapping community_id -> risk_ratio (illicit nodes / total labeled nodes in community)
    """
    # Convert PyG edge_index to NetworkX Graph
    edge_index = data.edge_index.cpu().numpy()
    G = nx.Graph()
    G.add_nodes_from(range(data.num_nodes))
    edges = [(edge_index[0, i], edge_index[1, i]) for i in range(edge_index.shape[1])]
    G.add_edges_from(edges)
    
    # Run Louvain
    partition = community_louvain.best_partition(G)
    
    # Calculate community risk ratios based on known labeled nodes
    labels = data.y.cpu().numpy()
    community_stats = {}
    for node_idx, comm_id in partition.items():
        if comm_id not in community_stats:
            community_stats[comm_id] = {'illicit': 0, 'total_labeled': 0, 'total_nodes': 0}
        community_stats[comm_id]['total_nodes'] += 1
        lbl = labels[node_idx]
        if lbl != -1:
            community_stats[comm_id]['total_labeled'] += 1
            if lbl == 1:
                community_stats[comm_id]['illicit'] += 1
                
    community_risk = {}
    for comm_id, stats in community_stats.items():
        if stats['total_labeled'] > 0:
            community_risk[comm_id] = stats['illicit'] / stats['total_labeled']
        else:
            community_risk[comm_id] = 0.0
            
    print(f"[INFO] Louvain detected {len(set(partition.values()))} communities.")
    return partition, community_risk

def compute_girvan_newman_communities(data, num_clusters=5):
    """
    Girvan-Newman algorithm implementation for comparison in notebook experiments.
    Not used in production due to high time complexity.
    """
    edge_index = data.edge_index.cpu().numpy()
    G = nx.Graph()
    G.add_nodes_from(range(min(200, data.num_nodes))) # Run on small subgraph for performance
    edges = [(edge_index[0, i], edge_index[1, i]) for i in range(edge_index.shape[1]) 
             if edge_index[0, i] < 200 and edge_index[1, i] < 200]
    G.add_edges_from(edges)
    
    comp = nx.community.girvan_newman(G)
    for _ in range(num_clusters - 1):
        try:
            communities = next(comp)
        except StopIteration:
            break
    return [list(c) for c in communities] if 'communities' in locals() else []
