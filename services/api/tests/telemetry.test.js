const test = require('node:test');
const assert = require('node:assert/strict');
const { validateTelemetry } = require('../src/services/telemetry');

test('accepts sparse telemetry and preserves metrics', () => {
  assert.equal(validateTelemetry({ source: 'host-1', cpu_usage: 42 }).cpu_usage, 42);
});

test('rejects telemetry without a source or metric', () => {
  assert.throws(() => validateTelemetry({ cpu_usage: 1 }), /source is required/);
  assert.throws(() => validateTelemetry({ source: 'host-1' }), /At least one metric/);
});

test('rejects negative and non-finite metric values', () => {
  assert.throws(() => validateTelemetry({ source: 'host-1', cpu_usage: -1 }), /finite non-negative/);
  assert.throws(() => validateTelemetry({ source: 'host-1', cpu_usage: Infinity }), /finite non-negative/);
});
