# Testing strategy

Unit tests exercise pure validation, preprocessing, classification, and evaluation logic. API repositories and the worker accept injected dependencies, which permits deterministic tests for database failures, duplicate inserts, missing models, and queue redelivery without arbitrary sleeps.

Integration tests should run MySQL and Redis from Compose and verify the complete event-to-result path. Regression scenarios include a duplicate `XREADGROUP` delivery, a worker restart with a pending message, malformed telemetry, a missing artifact, and publication failure. The durable assertions are the unique result count and the acknowledgement state, not timing.

The browser dashboard is intentionally thin: REST history is loaded before Socket.IO live delivery. A browser smoke test should submit telemetry, wait for the result through the API, and verify that the same result appears once in the live view.
