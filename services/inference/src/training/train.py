"""Offline training command. It never runs as part of worker startup."""
import os, json
import mysql.connector
import torch
from models.autoencoder import Autoencoder
from preprocessing.telemetry import FEATURES

def train():
    db = mysql.connector.connect(host=os.environ['DB_HOST'], port=int(os.environ['DB_PORT']), user=os.environ['DB_USER'], password=os.getenv('DB_PASSWORD', ''), database=os.environ['DB_NAME'])
    cursor = db.cursor(dictionary=True); cursor.execute('SELECT cpu_usage, memory_usage, disk_io, network_latency, error_rate, request_rate FROM events WHERE label IS NULL ORDER BY created_at LIMIT 10000'); rows = cursor.fetchall(); db.close()
    if not rows: raise RuntimeError('No unlabeled historical events available for training')
    data = torch.tensor([[float(row.get(feature) or 0) for feature in FEATURES] for row in rows], dtype=torch.float32)
    model = Autoencoder(len(FEATURES)); optimizer = torch.optim.Adam(model.parameters(), lr=0.001); loss_fn = torch.nn.MSELoss()
    for _ in range(int(os.getenv('TRAINING_EPOCHS', '100'))):
        loss = loss_fn(model(data), data); optimizer.zero_grad(); loss.backward(); optimizer.step()
    path = os.environ['MODEL_PATH']; os.makedirs(os.path.dirname(path) or '.', exist_ok=True); torch.save(model.state_dict(), path)
    version = os.environ['MODEL_VERSION']; db = mysql.connector.connect(host=os.environ['DB_HOST'], port=int(os.environ['DB_PORT']), user=os.environ['DB_USER'], password=os.getenv('DB_PASSWORD', ''), database=os.environ['DB_NAME']); cursor = db.cursor(); cursor.execute('INSERT INTO model_versions (version, artifact_path, input_features, metrics) VALUES (%s, %s, %s, %s) ON DUPLICATE KEY UPDATE artifact_path=VALUES(artifact_path), input_features=VALUES(input_features)', (version, path, json.dumps(FEATURES), '{}')); db.commit(); db.close(); print(f'trained model {version} at {path}')

if __name__ == '__main__': train()
