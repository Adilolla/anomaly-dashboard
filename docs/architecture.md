# ULTRON Architecture

## Why the LLM is not the source of truth

The diagnostic assistant is deliberately downstream of the engineering pipeline:

```text
Telemetry
  -> PyTorch anomaly detection
  -> deterministic fault rules
  -> structured diagnostic result
  -> local Qwen explanation
```

Telemetry is objective application state. PyTorch identifies abnormal patterns, and deterministic rules map those patterns to known component fault signatures, evidence, severity, confidence, and recommended action. Those results are persisted in MySQL before they are exposed to the assistant.

Qwen only explains the persisted result and answers grounded follow-up questions. The API constructs the diagnostic context from MySQL; the browser cannot supply or override evidence. The model is read-only: it cannot inject telemetry, clear faults, modify records, or control the simulator.

If Ollama is offline, times out, is not configured, or returns malformed output, the API returns deterministic guidance instead. This separation reduces hallucination risk and keeps the dashboard useful during a demo even when the optional local model is unavailable.

## Local Diagnostics Agent

`POST /api/diagnostics/ask` accepts only `robotId`, `componentId`, and a technician question. The backend retrieves the latest matching diagnostic result, builds a small context, and calls Ollama. The response identifies whether the answer came from `qwen` or the `deterministic` fallback.

## Existing platform contracts

The platform uses Redis Streams rather than timer-based database polling. The API writes the event first, publishes its ID, and records publication status. The inference consumer group uses explicit acknowledgements and retries pending messages after consumer failure. MySQL uniqueness constraints provide the durable idempotency boundary; Redis delivery is at-least-once by design.

The API is a small layered service: routes/controllers are kept in `src/index.js`, validation and stream delivery are services, and SQL is isolated in repositories. The worker is dependency-injected with database, queue, and model objects so retry and duplicate-delivery behavior can be tested without live infrastructure.

Socket.IO is a fan-out projection of the result stream. A reconnecting dashboard first reads `/api/results`, then listens for new stream-backed events. The REST endpoint is the recovery path; the socket is not the source of truth. The schema stores model version and threshold per result, making deployment and threshold changes auditable.
