import { API, getResults } from './api.js';

const state = { results: [] };
const $ = (id) => document.getElementById(id);
const componentToPart = { vision_stack: 'head', battery_pack: 'torso', core_compute: 'torso', left_knee: 'left-leg', balance_imu: 'torso', right_shoulder: 'right-arm' };
const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
const isAnomaly = (row) => row.is_anomaly === true || row.is_anomaly === 1 || row.is_anomaly === '1';
function selectIncident(row) {
  if (!row) return;
  $('detail-empty').hidden = true; $('detail').hidden = false;
  $('detail-title').textContent = row.fault_code || 'Anomaly'; $('detail-component').textContent = row.component_name || row.source;
  $('detail-score').textContent = Number(row.anomaly_score).toFixed(4); $('detail-severity').textContent = String(row.severity || 'info').toUpperCase();
  $('detail-diagnosis').textContent = row.diagnosis || 'Ultron Repair Advisor is collecting more evidence.';
  $('detail-action').textContent = row.recommended_action || 'Collect more telemetry before acting.'; $('detail-confidence').textContent = `${Math.round(Number(row.advisor_confidence || 0) * 100)}%`;
  document.querySelectorAll('[data-part]').forEach((part) => part.classList.toggle('selected', part.dataset.part === componentToPart[row.component_id]));
}
function render() {
  const anomalies = state.results.filter(isAnomaly); $('processed').textContent = state.results.length; $('anomalies').textContent = anomalies.length;
  $('health').textContent = anomalies.length ? 'ATTENTION REQUIRED' : 'NOMINAL'; $('health').className = anomalies.length ? 'critical' : 'healthy';
  document.querySelectorAll('[data-part]').forEach((part) => part.classList.remove('fault', 'warning'));
  anomalies.slice(0, 8).forEach((row) => document.querySelector(`[data-part="${componentToPart[row.component_id] || 'torso'}"]`)?.classList.add(row.severity === 'critical' ? 'fault' : 'warning'));
  $('incidents').innerHTML = anomalies.slice(0, 20).map((row) => `<button class="incident ${escapeHtml(row.severity)}" data-id="${row.id}"><span>${row.severity === 'critical' ? '◆' : '◇'}</span><span><b>${escapeHtml(row.fault_code || 'ANOMALY')}</b><small>${escapeHtml(row.component_name || row.source)} · score ${Number(row.anomaly_score).toFixed(3)}</small></span></button>`).join('') || '<div class="empty">No active incidents. Synthetic telemetry is nominal.</div>';
  document.querySelectorAll('.incident').forEach((button) => button.addEventListener('click', () => selectIncident(state.results.find((row) => String(row.id) === button.dataset.id))));
  $('event-log').innerHTML = state.results.slice(0, 12).map((row) => `<div class="log-line"><span class="dot ${isAnomaly(row) ? 'red' : 'green'}"></span><span>${escapeHtml(row.component_name || row.source)}</span><time>${new Date(row.detected_at || row.created_at).toLocaleTimeString()}</time><strong>${isAnomaly(row) ? escapeHtml(row.fault_code || 'ANOMALY') : 'NOMINAL'}</strong></div>`).join('');
}
async function boot() {
  try { state.results = await getResults(); render(); const latest = state.results.find(isAnomaly); if (latest) selectIncident(latest); } catch (error) { $('error').textContent = error.message; }
  const socket = window.io(API); socket.on('connect', () => $('connection').textContent = '● LIVE LINK'); socket.on('disconnect', () => $('connection').textContent = '○ RECONNECTING');
  socket.on('new_result', (row) => { state.results = [row, ...state.results].slice(0, 100); render(); if (isAnomaly(row)) selectIncident(row); });
}
boot();
