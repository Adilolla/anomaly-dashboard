function validateDiagnosticQuestion(body) {
  const robotId = typeof body?.robotId === 'string' ? body.robotId.trim() : '';
  const componentId = typeof body?.componentId === 'string' ? body.componentId.trim() : '';
  const question = typeof body?.question === 'string' ? body.question.trim() : '';
  const diagnosticId = body?.diagnosticId == null || body.diagnosticId === '' ? null : Number(body.diagnosticId);
  if (!robotId || !componentId || !question || question.length > 500 || (diagnosticId != null && (!Number.isInteger(diagnosticId) || diagnosticId < 1))) {
    const error = new Error('robotId, componentId, and a question up to 500 characters are required'); error.name = 'ValidationError'; error.statusCode = 400; error.code = 'INVALID_DIAGNOSTIC_QUESTION'; throw error;
  }
  return { robotId, componentId, question, diagnosticId };
}
module.exports = { validateDiagnosticQuestion };
