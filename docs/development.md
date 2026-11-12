# Development guide

Run the API with `npm start` after exporting values from `.env`. Run the worker with `PYTHONPATH=services/inference/src python services/inference/src/worker.py`. Use `docker compose up mysql redis` when only infrastructure is needed.

Keep SQL in repositories, validate at the boundary, and include event/model identifiers in logs. Do not add polling loops to recover from transient infrastructure failures; use stream blocking reads, bounded retries, and explicit dead-letter policy. Keep model training offline from inference startup and bump `MODEL_VERSION` for every changed artifact or threshold policy.

The Java 21 pointers do not map directly to this repository's runtime. Equivalent concerns are handled with Redis consumer groups, bounded Node connection pools, dependency injection, idempotent writes, and stream fan-out. If a Java service is added later, it should integrate through the same stream contracts rather than duplicate persistence logic.
