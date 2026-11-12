# Real-time anomaly platform

This repository ingests multivariate infrastructure telemetry, persists it in MySQL, scores it in an event-driven Python worker, and streams completed results to a browser dashboard through Redis Streams and Socket.IO.

## Architecture

```text
dashboard -> API -> MySQL events -> Redis anomaly:events
                              -> inference consumer group -> MySQL results
                                                        -> Redis anomaly:results
                                                        -> API relay -> Socket.IO
```

The API uses repositories and services so HTTP concerns, persistence, and queue delivery remain independently testable. The worker acknowledges a message only after an idempotent result write. Unique `(event_id, model_version)` keys make redelivery safe. Result publication is a separate stream, so a worker restart cannot cause a second result row.

## Run locally with Docker

```bash
cp .env.example .env
docker compose up --build
```

Open <http://localhost:8080>. The API is at <http://localhost:3000>; health is available at `/api/health`.

## Configuration

See `.env.example`. Required runtime values include database connection settings, `REDIS_URL`, `ANOMALY_THRESHOLD`, `MODEL_VERSION`, `API_PORT`, and `NODE_ENV`. Never commit `.env`, credentials, or model artifacts.

## API example

```bash
curl -X POST http://localhost:3000/api/events -H 'content-type: application/json' \
  -d '{"source":"web-01","cpu_usage":82.1,"memory_usage":65.4,"request_rate":1200}'
curl 'http://localhost:3000/api/results?limit=20'
```

## Model workflow

The worker loads `MODEL_PATH` and records `MODEL_VERSION` on every prediction. For development, `ALLOW_BASELINE_MODEL=true` enables a deterministic baseline when no artifact exists. A training command and artifact registry are intentionally kept separate from startup; a trained artifact must be mounted into the worker before production use. Evaluation utilities report precision, recall, F1, false-positive rate, and false-negative rate when labels are available.

## Tests

```bash
npm install
npm test
python -m pytest services/inference/tests
```

The Python unit tests cover sparse telemetry, inclusive thresholds, and label-based metrics. The database/Redis integration boundary is represented by injectable API repositories and worker dependencies; run the Compose stack for an end-to-end smoke test.
