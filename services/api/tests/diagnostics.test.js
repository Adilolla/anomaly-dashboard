const test = require('node:test');
const assert = require('node:assert/strict');
const { buildDiagnosticContext } = require('../src/diagnostics/context');
const { askOllama } = require('../src/diagnostics/ollama');
const { deterministicAnswer } = require('../src/diagnostics/fallback');
const { validateDiagnosticQuestion } = require('../src/diagnostics/request');

const record = { id: 12, component_id: 'left_knee', component_name: 'Left Knee Actuator', is_anomaly: 1, anomaly_score: 0.94, severity: 'critical', advisor_confidence: 0.87, diagnosis: 'Mechanical actuator friction.', recommended_action: 'Inspect actuator resistance and cooling.', cpu_usage: 0.8, error_rate: 0.5, metadata: JSON.stringify({ robot_id: 'ULTRON-03', robot_name: 'Ultron Humanoid', telemetry_profile: 'fault-injection' }) };

test('builds a small grounded diagnostic context', () => {
  const context = buildDiagnosticContext(record);
  assert.deepEqual(context.robotId, 'ULTRON-03');
  assert.deepEqual(context.componentId, 'left_knee');
  assert.equal(context.status, 'CRITICAL');
  assert.equal(context.anomalyScore, 0.94);
  assert.equal(context.currentTelemetry.cpuUsage, 0.8);
  assert.equal(context.evidence.telemetryProfile, 'fault-injection');
  assert.equal(Object.keys(context).includes('password'), false);
});

test('falls back to deterministic guidance when Ollama is unavailable', async () => {
  await assert.rejects(() => askOllama({ host: 'http://127.0.0.1:9', model: 'qwen2.5:3b', timeoutMs: 20, context: buildDiagnosticContext(record), question: 'Why?' , fetchImpl: async () => { throw new Error('offline'); } }), /offline/);
  const answer = deterministicAnswer(buildDiagnosticContext(record), 'Why?');
  assert.match(answer, /Left Knee Actuator/);
  assert.match(answer, /Mechanical actuator friction/);
  assert.match(answer, /Inspect actuator resistance/);
});

test('rejects malformed Ollama responses', async () => {
  await assert.rejects(() => askOllama({ host: 'http://ollama', model: 'qwen2.5:3b', timeoutMs: 100, context: buildDiagnosticContext(record), question: 'Why?', fetchImpl: async () => ({ ok: true, json: async () => ({ response: '' }) }) }), /invalid response/);
});

test('sends only grounded context to Ollama', async () => {
  let request;
  const answer = await askOllama({ host: 'http://ollama', model: 'qwen2.5:3b', timeoutMs: 100, context: buildDiagnosticContext(record), question: 'Why do you think this is friction?', fetchImpl: async (url, options) => { request = { url, body: JSON.parse(options.body) }; return { ok: true, json: async () => ({ response: 'The supplied evidence points to friction.' }) }; } });
  assert.equal(answer, 'The supplied evidence points to friction.');
  assert.equal(request.url, 'http://ollama/api/generate');
  assert.equal(request.body.model, 'qwen2.5:3b');
  assert.match(request.body.prompt, /left_knee/);
  assert.match(request.body.prompt, /0.94/);
  assert.doesNotMatch(request.body.prompt, /maintenance history/);
});

test('validates diagnostic question input', () => {
  assert.deepEqual(validateDiagnosticQuestion({ robotId: 'ULTRON-03', componentId: 'left_knee', question: ' Why? ' }), { robotId: 'ULTRON-03', componentId: 'left_knee', question: 'Why?' });
  assert.throws(() => validateDiagnosticQuestion({ robotId: 'ULTRON-03', componentId: 'left_knee', question: '' }), /required/);
  assert.throws(() => validateDiagnosticQuestion({ robotId: 'ULTRON-03', componentId: 'left_knee', question: 'x'.repeat(501) }), /required/);
});
