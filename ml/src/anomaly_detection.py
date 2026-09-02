import torch
import numpy as np
from sklearn.ensemble import IsolationForest
import torch.nn as nn

def detect_anomalies_isolation_forest(data, train_mask):
    """
    Fits IsolationForest on training node feature vectors and scores all nodes.
    Returns normalized anomaly scores in [0, 1] range (higher = more anomalous).
    """
    X_all = data.x.cpu().numpy()
    X_train = X_all[train_mask.cpu().numpy()]
    
    clf = IsolationForest(n_estimators=100, contamination=0.05, random_state=42)
    clf.fit(X_train)
    
    # decision_function returns negative values for anomalies, positive for inliers
    raw_scores = -clf.decision_function(X_all)
    
    # Normalize to [0, 1]
    min_s, max_s = raw_scores.min(), raw_scores.max()
    if max_s > min_s:
        norm_scores = (raw_scores - min_s) / (max_s - min_s)
    else:
        norm_scores = np.zeros_like(raw_scores)
        
    print(f"[INFO] IsolationForest fitted. Mean anomaly score: {norm_scores.mean():.4f}")
    return norm_scores

class SimpleAutoencoder(nn.Module):
    """Autoencoder variant for experiment comparison in notebook."""
    def __init__(self, in_dim, latent_dim=32):
        super(SimpleAutoencoder, self).__init__()
        self.encoder = nn.Sequential(nn.Linear(in_dim, 64), nn.ReLU(), nn.Linear(64, latent_dim))
        self.decoder = nn.Sequential(nn.Linear(latent_dim, 64), nn.ReLU(), nn.Linear(64, in_dim))
        
    def forward(self, x):
        return self.decoder(self.encoder(x))
