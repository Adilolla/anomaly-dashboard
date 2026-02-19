# 🚀 anomaly-dashboard

A simple full-stack **real-time anomaly detection dashboard** built with MySQL, Python (PyTorch), Node.js, and Socket.IO.

When a new value is inserted into a MySQL database, a Python ML service checks whether it is an anomaly using a **PyTorch Autoencoder neural network**. The result is pushed live to a web dashboard using **Socket.IO** — no page refresh required.

---

# 📅 Project Updates

## ✅ v1.0 — Initial Release (2026-02-18)

- REST API to insert events
- MySQL `events` and `anomaly_results` tables
- PyTorch Autoencoder for anomaly detection
- Python polling service (runs every 2 seconds)
- Node.js + Express backend
- Socket.IO real-time updates
- Live Chart.js dashboard
- Anomaly counter
- Normal event counter
- Color-coded event log
- Connection status indicator

Future updates will be logged here.

---

# 🧩 How It Works (Step-by-Step)

1. A new event is inserted into the `events` table.
2. Python (`detector.py`) checks for new rows every 2 seconds.
3. The Autoencoder calculates reconstruction error.
4. If the error is high → it is marked as an anomaly.
5. The result is written to `anomaly_results`.
6. Node.js emits the update via Socket.IO.
7. The dashboard updates instantly.

---

# 🏗 System Architecture

MySQL (events)
│
▼
Python ML Service (Autoencoder)
│
▼
MySQL (anomaly_results)
│
▼
Node.js + Socket.IO
│
▼
Live Dashboard (Chart.js)


---

# 🛠 Tech Stack

| Layer | Technology |
|-------|------------|
| Database | MySQL 8 |
| ML Service | Python 3 + PyTorch |
| Backend | Node.js + Express |
| Realtime | Socket.IO |
| Frontend | HTML + Chart.js |
# 🔮 Roadmap & Future Updates

This project will continue evolving to become a more production-ready real-time ML system.

## 🚀 Upcoming Improvements

### 1️⃣ Model Improvements
- Add proper training pipeline (separate training script)
- Save and load trained model weights
- Add configurable anomaly threshold
- Support multivariate inputs (not just a single value)
- Add model evaluation metrics (precision, recall, F1-score)

### 2️⃣ Performance Enhancements
- Replace 2-second polling with event-driven architecture
- Use message queue (Redis / Kafka) instead of DB polling
- Optimize database queries
- Add batching for ML inference
- Add async processing in Python service

### 3️⃣ DevOps & Deployment
- Dockerize entire project
- Add docker-compose for full stack setup
- Environment variable configuration (.env)
- Production logging system
- Cloud deployment (AWS / GCP / Azure)
- CI/CD pipeline

### 4️⃣ Dashboard Improvements
- Historical data view
- Adjustable time ranges
- Error distribution visualization
- Threshold adjustment slider (live tuning)
- Download results as CSV
- Dark mode UI

### 5️⃣ Security & Production Readiness
- Authentication (JWT-based login)
- Rate limiting on API
- Input validation & sanitization
- Secure database credentials
- HTTPS support

### 6️⃣ Advanced ML Features
- Add alternative models (LSTM, Isolation Forest)
- Real-time model retraining
- Concept drift detection
- Model monitoring dashboard
- Store anomaly explanations

---

## 📅 Planned Version Updates

### v1.1
- Environment variable config
- Saved model weights
- Docker support

### v1.2
- Remove polling → event-based architecture
- Dashboard enhancements

### v2.0
- Scalable production architecture
- Advanced anomaly detection models
- Cloud deployment

---

This roadmap will guide the evolution of anomaly-dashboard from a demo system to a scalable real-time ML platform.

