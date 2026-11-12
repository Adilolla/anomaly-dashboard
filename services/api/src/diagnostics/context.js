const SYSTEM_PROMPT = `You are the ULTRON Diagnostics Agent, an engineering assistant for a simulated humanoid robotics diagnostic platform.

Use the supplied telemetry and deterministic diagnostic result as the source of truth. Explain faults clearly and concisely. Never invent telemetry values, hardware specifications, maintenance history, or test results. Distinguish measured evidence from possible explanations. If evidence is insufficient, say that more diagnostic information is required. Do not claim a repair succeeded unless validation telemetry confirms it. Prefer practical engineering explanations over generic advice.`;

function buildDiagnosticContext(record) {
  if (!record) return null;
  const metadata = typeof record.metadata === 'string' ? JSON.parse(record.metadata) : (record.metadata || {});
  return {
    robotId: metadata.robot_id || 'ULTRON-01',
    robotName: metadata.robot_name || 'Ultron Humanoid',
    componentId: record.component_id,
    component: record.component_name || record.component_id,
    status: record.is_anomaly ? String(record.severity || 'warning').toUpperCase() : 'NOMINAL',
    anomalyScore: Number(record.anomaly_score),
    confidence: record.advisor_confidence == null ? null : Number(record.advisor_confidence),
    currentTelemetry: {
      cpuUsage: record.cpu_usage == null ? null : Number(record.cpu_usage),
      memoryUsage: record.memory_usage == null ? null : Number(record.memory_usage),
      networkLatency: record.network_latency == null ? null : Number(record.network_latency),
      errorRate: record.error_rate == null ? null : Number(record.error_rate),
      requestRate: record.request_rate == null ? null : Number(record.request_rate),
    },
    deterministicDiagnosis: record.diagnosis || null,
    likelyFault: record.fault_code || null,
    recommendedAction: record.recommended_action || null,
    evidence: {
      faultCode: record.fault_code || null,
      severity: record.severity || 'info',
      telemetryProfile: metadata.telemetry_profile || null,
    },
    detectedAt: record.detected_at || record.created_at || null,
  };
}

function contextToPrompt(context, question) {
  return `Diagnostic context (authoritative application data):\n${JSON.stringify(context, null, 2)}\n\nTechnician question: ${question}\n\nAnswer in 3-6 concise sentences. Refer only to this context and general engineering explanation.`;
}

module.exports = { SYSTEM_PROMPT, buildDiagnosticContext, contextToPrompt };
