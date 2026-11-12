# Implementation plan

## Audit findings

The prototype had two duplicated Express servers, both coupled directly to MySQL. The nested server contained a real password, while the root server contained a placeholder password; both opened a permissive CORS policy and returned raw database errors. The API accepted arbitrary JSON, had no pagination or health checks, and inserted events without publishing work.

The Python detector retrained an in-memory model every time it started, polled MySQL every two seconds, selected unprocessed rows without claiming them, and inserted results without a uniqueness constraint. A worker crash or two worker instances could therefore duplicate inference. The API independently polled MySQL for results, which could miss rows or emit duplicates around timestamp boundaries. There were no migrations, tests, model artifacts, deployment configuration, or frontend source in the repository.

The functionality to preserve is event ingestion, anomaly scoring, persistence, REST result retrieval, and live Socket.IO updates. The implementation below keeps those concepts while replacing polling with Redis Streams and making result writes idempotent.

## Phases

1. Establish environment-driven configuration, repository layout, schema migrations, and safe local/Docker defaults.
2. Add layered API services for validated telemetry ingestion, paginated reads, health/readiness, and Socket.IO result delivery.
3. Add a Redis Streams inference worker with consumer groups, retries, dead-letter handling, deterministic preprocessing, versioned model loading, and idempotent persistence.
4. Add a modular static dashboard that loads history through REST and consumes result events through Socket.IO.
5. Add unit, integration-oriented, and regression tests for validation, preprocessing, thresholding, idempotency, and retry behavior.
6. Add documentation and CI that run the available Node/Python checks and build the containers.

## Delivery boundary

This change provides a production-shaped development platform without pretending that a trained model artifact exists. Inference loads a configured artifact when present and uses a documented deterministic baseline only when `ALLOW_BASELINE_MODEL=true` (the Docker development default). A real model is produced by the training command and then selected with `MODEL_PATH` and `MODEL_VERSION`.
