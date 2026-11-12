const { SYSTEM_PROMPT, contextToPrompt } = require('./context');

async function askOllama({ host, model, timeoutMs, context, question, fetchImpl = fetch }) {
  if (!host || !model) throw new Error('Local AI is not configured');
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetchImpl(`${host.replace(/\/$/, '')}/api/generate`, {
      method: 'POST', headers: { 'content-type': 'application/json' }, signal: controller.signal,
      body: JSON.stringify({ model, system: SYSTEM_PROMPT, prompt: contextToPrompt(context, question), stream: false, options: { temperature: 0.1, num_predict: 220 } }),
    });
    if (!response.ok) throw new Error(`Ollama returned ${response.status}`);
    const body = await response.json();
    if (!body || typeof body.response !== 'string' || !body.response.trim()) throw new Error('Ollama returned an invalid response');
    return body.response.trim();
  } finally {
    clearTimeout(timeout);
  }
}

module.exports = { askOllama };
