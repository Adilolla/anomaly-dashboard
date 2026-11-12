function deterministicAnswer(context, question) {
  if (!context) return 'There is not enough diagnostic evidence for that component yet.';
  const status = context.status === 'NOMINAL' ? 'currently within the learned operating envelope' : `flagged ${context.status.toLowerCase()}`;
  const diagnosis = context.deterministicDiagnosis || 'No deterministic fault signature is available.';
  const action = context.recommendedAction || 'Collect more telemetry before taking action.';
  return `${context.component} is ${status}. The deterministic diagnostic reports: ${diagnosis} ${action} The available evidence is limited to the current application telemetry; more diagnostic information is required to answer beyond that.`;
}
module.exports = { deterministicAnswer };
