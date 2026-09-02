import torch
import torch.nn as nn
import torch.nn.functional as F
from torch_geometric.nn import SAGEConv

class EllipticGraphSAGE(nn.Module):
    """
    GraphSAGE model for detecting suspicious transaction patterns in transaction graphs.
    Framing: Identifies statistical patterns associated with illicit categories.
    """
    def __init__(self, in_channels, hidden_channels=128, out_channels=2, dropout=0.3):
        super(EllipticGraphSAGE, self).__init__()
        self.conv1 = SAGEConv(in_channels, hidden_channels)
        self.conv2 = SAGEConv(hidden_channels, hidden_channels // 2)
        self.classifier = nn.Linear(hidden_channels // 2, out_channels)
        self.dropout = dropout

    def forward(self, x, edge_index):
        x = self.conv1(x, edge_index)
        x = F.relu(x)
        x = F.dropout(x, p=self.dropout, training=self.training)
        
        x = self.conv2(x, edge_index)
        x = F.relu(x)
        x = F.dropout(x, p=self.dropout, training=self.training)
        
        logits = self.classifier(x)
        return logits

    def get_embeddings(self, x, edge_index):
        x = self.conv1(x, edge_index)
        x = F.relu(x)
        x = self.conv2(x, edge_index)
        return F.relu(x)
