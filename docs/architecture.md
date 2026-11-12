# Architecture decisions

The platform uses Redis Streams rather than timer-based database polling. The API writes the event first, publishes its ID, and records publication status. The inference consumer group uses explicit acknowledgements and retries pending messages after consumer failure. MySQL uniqueness constraints provide the durable idempotency boundary; Redis delivery is at-least-once by design.

The API is a small layered service: routes/controllers are kept in `src/index.js`, validation and stream delivery are services, and SQL is isolated in repositories. The worker is dependency-injected with database, queue, and model objects so retry and duplicate-delivery behavior can be tested without live infrastructure. This applies SOLID and KISS without introducing a Java service into a Node/Python system.

Socket.IO is a fan-out projection of the result stream. A reconnecting dashboard first reads `/api/results`, then listens for new stream-backed events. The REST endpoint is the recovery path; the socket is not the source of truth.

The schema stores model version and threshold per result, making deployment and threshold changes auditable. `inference_runs` records the processing lifecycle and has a unique event/model key. A future Kafka deployment can preserve the same idempotent consumer contract using an event id as the message key.
