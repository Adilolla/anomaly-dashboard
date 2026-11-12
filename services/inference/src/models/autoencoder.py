import torch
from torch import nn

class Autoencoder(nn.Module):
    def __init__(self, input_dim=6):
        super().__init__(); hidden = max(4, input_dim * 2)
        self.encoder = nn.Sequential(nn.Linear(input_dim, hidden), nn.ReLU(), nn.Linear(hidden, max(2, input_dim // 2)), nn.ReLU())
        self.decoder = nn.Sequential(nn.Linear(max(2, input_dim // 2), hidden), nn.ReLU(), nn.Linear(hidden, input_dim))
    def forward(self, x): return self.decoder(self.encoder(x))
