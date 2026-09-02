import os
import sys
import pandas as pd
import numpy as np
import torch
from torch_geometric.data import Data

RAW_DATA_DIR = os.path.join(os.path.dirname(__file__), "..", "data", "raw")
PROCESSED_DATA_DIR = os.path.join(os.path.dirname(__file__), "..", "data", "processed")

def generate_synthetic_elliptic_dataset(num_nodes=1000, num_features=165, num_timesteps=49):
    """
    Generates synthetic transaction graph mimicking Elliptic dataset structure.
    Used for instant prototyping when raw Kaggle files are not present.
    """
    print("[INFO] Generating synthetic Elliptic-like transaction graph dataset...")
    os.makedirs(RAW_DATA_DIR, exist_ok=True)
    
    node_ids = [f"tx_{i+100000}" for i in range(num_nodes)]
    timesteps = np.random.randint(1, num_timesteps + 1, size=num_nodes)
    
    # 165 features per node + txId + time_step = 167 columns
    features = np.random.randn(num_nodes, num_features).astype(np.float32)
    
    # Create classes: 2% illicit (1), 25% licit (2), remainder unknown
    classes = []
    for i in range(num_nodes):
        r = np.random.rand()
        if r < 0.05:
            classes.append("1") # illicit
        elif r < 0.30:
            classes.append("2") # licit
        else:
            classes.append("unknown")
            
    feat_cols = ["txId", "time_step"] + [f"feature_{i}" for i in range(num_features)]
    feat_df = pd.DataFrame(np.hstack([np.array(node_ids).reshape(-1, 1), 
                                       timesteps.reshape(-1, 1), 
                                       features]), columns=feat_cols)
    feat_df.to_csv(os.path.join(RAW_DATA_DIR, "elliptic_txs_features.csv"), index=False, header=False)
    
    class_df = pd.DataFrame({"txId": node_ids, "class": classes})
    class_df.to_csv(os.path.join(RAW_DATA_DIR, "elliptic_txs_classes.csv"), index=False)
    
    # Edges (prefer edges within same or adjacent timesteps)
    edges = []
    node_to_idx = {nid: i for i, nid in enumerate(node_ids)}
    for i in range(num_nodes):
        # 1-4 random outgoing edges
        num_out = np.random.randint(1, 4)
        possible_targets = np.where(np.abs(timesteps - timesteps[i]) <= 2)[0]
        if len(possible_targets) > 0:
            targets = np.random.choice(possible_targets, size=min(num_out, len(possible_targets)), replace=False)
            for t in targets:
                if t != i:
                    edges.append((node_ids[i], node_ids[t]))
                    
    edge_df = pd.DataFrame(edges, columns=["txId1", "txId2"])
    edge_df.to_csv(os.path.join(RAW_DATA_DIR, "elliptic_txs_edgelist.csv"), index=False)
    print(f"[INFO] Synthetic dataset generated with {num_nodes} nodes and {len(edges)} edges.")

def load_elliptic_data(force_reprocess=False):
    """
    Loads Elliptic dataset from CSVs into PyG Data object.
    Automatically generates synthetic data if raw CSVs are missing.
    """
    os.makedirs(PROCESSED_DATA_DIR, exist_ok=True)
    cache_path = os.path.join(PROCESSED_DATA_DIR, "pyg_data.pt")
    
    if os.path.exists(cache_path) and not force_reprocess:
        print("[INFO] Loading cached PyG graph object from processed directory...")
        return torch.load(cache_path, weights_only=False)
        
    feat_file = os.path.join(RAW_DATA_DIR, "elliptic_txs_features.csv")
    class_file = os.path.join(RAW_DATA_DIR, "elliptic_txs_classes.csv")
    edge_file = os.path.join(RAW_DATA_DIR, "elliptic_txs_edgelist.csv")
    
    if not (os.path.exists(feat_file) and os.path.exists(class_file) and os.path.exists(edge_file)):
        print("[WARNING] Missing raw Elliptic CSV files in ml/data/raw/")
        print("Required files: elliptic_txs_features.csv, elliptic_txs_classes.csv, elliptic_txs_edgelist.csv")
        generate_synthetic_elliptic_dataset()
        
    print("[INFO] Reading Elliptic CSV files...")
    # Load features
    features_df = pd.read_csv(feat_file, header=None)
    # Col 0: txId, Col 1: time_step, Cols 2+: features
    tx_ids = features_df[0].astype(str).tolist()
    time_steps = torch.tensor(features_df[1].values, dtype=torch.long)
    x = torch.tensor(features_df.iloc[:, 2:].values, dtype=torch.float)
    
    id_map = {tx_id: idx for idx, tx_id in enumerate(tx_ids)}
    
    # Load classes
    classes_df = pd.read_csv(class_file)
    class_map = {'1': 1, '2': 0, 'unknown': -1} # 1 = illicit, 0 = licit, -1 = unknown
    
    y = torch.full((len(tx_ids),), -1, dtype=torch.long)
    for _, row in classes_df.iterrows():
        tid = str(row['txId'])
        if tid in id_map:
            cls_val = str(row['class'])
            y[id_map[tid]] = class_map.get(cls_val, -1)
            
    # Load edges
    edges_df = pd.read_csv(edge_file)
    src_list = []
    dst_list = []
    for _, row in edges_df.iterrows():
        u = str(row['txId1'])
        v = str(row['txId2'])
        if u in id_map and v in id_map:
            src_list.append(id_map[u])
            dst_list.append(id_map[v])
            
    edge_index = torch.tensor([src_list, dst_list], dtype=torch.long)
    
    data = Data(
        x=x,
        edge_index=edge_index,
        y=y,
        time_step=time_steps
    )
    data.tx_ids = tx_ids
    data.num_features = x.shape[1]
    
    torch.save(data, cache_path)
    print(f"[INFO] PyG graph object saved to {cache_path}. Nodes: {data.num_nodes}, Edges: {data.num_edges}")
    return data

if __name__ == "__main__":
    data = load_elliptic_data(force_reprocess=True)
    print(f"Loaded Data: {data}")
