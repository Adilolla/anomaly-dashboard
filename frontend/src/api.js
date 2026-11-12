const API = window.API_URL || 'http://localhost:3000';
export async function getResults() { const response = await fetch(`${API}/api/results?limit=100`); if (!response.ok) throw new Error('Unable to load results'); return (await response.json()).data; }
export { API };
