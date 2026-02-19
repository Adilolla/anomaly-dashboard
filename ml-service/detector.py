import time
import torch
import mysql.connector
from model import Autoencoder

DB_CONFIG = {
    "host": "127.0.0.1",
    "user": "root",
    "password": "Franklinpass123_",
    "database": "anomaly_dashboard"
}
THRESHOLD = 0.5
POLL_INTERVAL = 2

model = Autoencoder(input_dim=1)
optimizer = torch.optim.Adam(model.parameters(), lr=0.001)
loss_fn = torch.nn.MSELoss()

def get_connection():
    return mysql.connector.connect(**DB_CONFIG)

def train_on_history():
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT value FROM events LIMIT 200")
    rows = cursor.fetchall()
    conn.close()
    if not rows:
        print("No historical data yet, skipping training.")
        return
    data = torch.tensor([[r[0]] for r in rows], dtype=torch.float32)
    for _ in range(100):
        output = model(data)
        loss = loss_fn(output, data)
        optimizer.zero_grad()
        loss.backward()
        optimizer.step()
    print("✅ Model trained on historical data.")

def detect_anomaly(value):
    x = torch.tensor([[value]], dtype=torch.float32)
    with torch.no_grad():
        reconstruction = model(x)
    score = loss_fn(reconstruction, x).item()
    return score > THRESHOLD, round(score, 4)

def process_pending():
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT e.id, e.value FROM events e
        LEFT JOIN anomaly_results ar ON ar.event_id = e.id
        WHERE ar.event_id IS NULL
    """)
    rows = cursor.fetchall()
    for event_id, value in rows:
        is_anomaly, score = detect_anomaly(value)
        cursor.execute("""
            INSERT INTO anomaly_results (event_id, is_anomaly, anomaly_score)
            VALUES (%s, %s, %s)
        """, (event_id, is_anomaly, score))
        print(f"Event {event_id}: value={value}, anomaly={is_anomaly}, score={score}")
    conn.commit()
    conn.close()

if __name__ == "__main__":
    train_on_history()
    print("👀 Monitoring for new events...")
    while True:
        process_pending()
        time.sleep(POLL_INTERVAL)