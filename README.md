# Ultron Humanoid Anomaly Dashboard

This repository is a synthetic humanoid-robot digital twin. It ingests fake ULTRON-01 hardware telemetry, persists it in MySQL, scores it with a PyTorch autoencoder, maps anomalies to robot subsystems, and streams repair guidance to a browser dashboard through Redis Streams and Socket.IO. BlueRock wraps the inference worker for free runtime visibility into the agentic diagnostic path.

## Architecture

```text
telemetry simulator -> API -> MySQL events -> Redis anomaly:events
                                      -> PyTorch inference + repair advisor -> MySQL results
                                                                      -> Redis anomaly:results
                                                                      -> API relay -> Socket.IO -> robot dashboard
```

The API uses repositories and services so HTTP concerns, persistence, and queue delivery remain independently testable. The worker acknowledges a message only after an idempotent result write. Unique `(event_id, model_version)` keys make redelivery safe. Result publication is a separate stream, so a worker restart cannot cause a second result row.

## Run locally with Docker

```bash
cp .env.example .env
docker compose up --build
```

Open <http://localhost:8080>. The API is at <http://localhost:3000>; health is available at `/api/health`. The simulator injects repeatable faults into the left knee, right shoulder, battery pack, vision stack, and balance IMU.

## Local Diagnostics Agent

The Repair Advisor combines deterministic fault analysis with an optional locally hosted Qwen instruct model. PyTorch and the deterministic rules determine the actual system state; Qwen only explains that structured result and answers grounded questions about the selected robot component. The dashboard and API continue working without Ollama.

### Install and run Ollama

Install [Ollama](https://ollama.com), then download the lightweight model:

```bash
ollama pull qwen2.5:3b
ollama serve
```

Configure `.env` (the defaults are already in `.env.example`):

```bash
OLLAMA_HOST=http://host.docker.internal:11434
OLLAMA_MODEL=qwen2.5:3b
OLLAMA_TIMEOUT_MS=7000
```

Start ULTRON:

```bash
docker compose up --build
```

Select a component in the dashboard and use the Repair Advisor questions. `LOCAL AI: qwen2.5:3b` means Ollama answered. If Ollama is unavailable, the panel shows `LOCAL AI: OFFLINE · DETERMINISTIC ACTIVE` and uses the existing rule-based guidance.

The grounded endpoint is:

```bash
curl -X POST http://localhost:3000/api/diagnostics/ask \
  -H 'content-type: application/json' \
  -d '{"robotId":"ULTRON-01","componentId":"left_knee","question":"What should I inspect first?"}'
```

The model cannot inject faults, clear faults, modify database records, or control the simulator. See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for the reasoning-layer boundary.

## Configuration

See `.env.example`. Required runtime values include database connection settings, `REDIS_URL`, `ANOMALY_THRESHOLD`, `MODEL_VERSION`, `API_PORT`, and `NODE_ENV`. Never commit `.env`, credentials, or model artifacts.

## API example

```bash
curl -X POST http://localhost:3000/api/events -H 'content-type: application/json' \
  -d '{"source":"web-01","cpu_usage":82.1,"memory_usage":65.4,"request_rate":1200}'
curl 'http://localhost:3000/api/results?limit=20'
```

## Model workflow

The worker loads `MODEL_PATH` and records `MODEL_VERSION` on every prediction. For development, `ALLOW_BASELINE_MODEL=true` enables a deterministic baseline when no artifact exists. The free Ultron Repair Advisor translates the affected subsystem into a diagnosis and safe simulated action. BlueRock observes the worker process and emits structured runtime events; it does not autonomously control real hardware.

## Tests

```bash
npm install
npm test
python -m pytest services/inference/tests
```

The Python unit tests cover sparse telemetry, inclusive thresholds, and label-based metrics. The database/Redis integration boundary is represented by injectable API repositories and worker dependencies; run the Compose stack for an end-to-end smoke test.
