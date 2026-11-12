import os
import torch
from models.autoencoder import Autoencoder

class BaselineModel:
    def score(self, vector):
        return sum(value * value for value in vector) / max(len(vector), 1)

def load_model(path, allow_baseline=False):
    if os.path.exists(path):
        model = Autoencoder(); model.load_state_dict(torch.load(path, map_location='cpu', weights_only=True)); model.eval()
        return model
    if allow_baseline: return BaselineModel()
    raise FileNotFoundError(f'Model artifact not found: {path}')

def score(model, vector):
    if isinstance(model, BaselineModel): return model.score(vector)
    tensor = torch.tensor([vector], dtype=torch.float32)
    with torch.no_grad(): return float(torch.mean((model(tensor) - tensor) ** 2).item())
