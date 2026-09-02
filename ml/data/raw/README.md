# Elliptic Bitcoin Dataset

To run the pipeline on the full Kaggle dataset:
1. Download `elliptic_txs_features.csv`, `elliptic_txs_classes.csv`, and `elliptic_txs_edgelist.csv` from [Kaggle Elliptic Dataset](https://www.kaggle.com/datasets/ellipticco/elliptic-data-set).
2. Place all 3 CSV files in this directory (`ml/data/raw/`).

If these files are missing, the system will automatically fall back to generating synthetic Elliptic-format transaction graph data so the prototype runs out-of-the-box!
