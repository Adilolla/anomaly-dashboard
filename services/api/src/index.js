const express = require('express');
const http = require('http');
const cors = require('cors');
const mysql = require('mysql2/promise');
const { Server } = require('socket.io');
const { createClient } = require('redis');
const { loadEnv } = require('./config/env');
const { eventRepository } = require('./repositories/eventRepository');
const { resultRepository } = require('./repositories/resultRepository');
const { validateTelemetry } = require('./services/telemetry');
const { publishEvent } = require('./services/stream');
const { startResultRelay } = require('./websocket/realtime');
const { notFound, errorHandler } = require('./middleware/errors');

function createApp({ pool, redis, config }) {
  const events = eventRepository(pool); const results = resultRepository(pool); const app = express();
  app.use(cors({ origin: config.webOrigin })); app.use(express.json({ limit: '64kb' }));
  const pagination = (req) => ({ limit: Math.min(Math.max(Number(req.query.limit) || 50, 1), 200), offset: Math.max(Number(req.query.offset) || 0, 0), from: req.query.from, to: req.query.to });
  app.get('/api/health', async (req, res) => { let db = 'ok'; let queue = 'ok'; try { await pool.query('SELECT 1'); } catch { db = 'error'; } try { await redis.ping(); } catch { queue = 'error'; } const healthy = db === 'ok' && queue === 'ok'; res.status(healthy ? 200 : 503).json({ status: healthy ? 'ok' : 'degraded', db, queue }); });
  app.get('/api/events', async (req, res, next) => { try { const page = pagination(req); res.json({ data: await events.list(page), limit: page.limit, offset: page.offset }); } catch (e) { next(e); } });
  app.get('/api/events/:id', async (req, res, next) => { try { const row = await events.getById(Number(req.params.id)); if (!row) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Event not found' } }); res.json(row); } catch (e) { next(e); } });
  app.post('/api/events', async (req, res, next) => { try { const key = req.get('Idempotency-Key'); if (key && key.length > 128) return res.status(400).json({ error: { code: 'INVALID_IDEMPOTENCY_KEY', message: 'Idempotency-Key must be at most 128 characters' } }); const prior = await events.findByIdempotencyKey(key); if (prior) return res.status(200).json(prior); const event = await events.create({ ...validateTelemetry(req.body), idempotency_key: key || null }); try { await publishEvent(redis, event.id); } catch (publishError) { await pool.execute("UPDATE events SET publish_status = 'failed' WHERE id = ?", [event.id]); publishError.code = 'EVENT_PUBLISH_FAILED'; return next(publishError); } await pool.execute("UPDATE events SET publish_status = 'published' WHERE id = ?", [event.id]); res.status(202).json(event); } catch (e) { next(e); } });
  app.get('/api/results', async (req, res, next) => { try { const page = pagination(req); res.json({ data: await results.list(page), limit: page.limit, offset: page.offset }); } catch (e) { next(e); } });
  app.get('/api/results/:id', async (req, res, next) => { try { const row = await results.getById(Number(req.params.id)); if (!row) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Result not found' } }); res.json(row); } catch (e) { next(e); } });
  app.get('/api/models', async (req, res, next) => { try { const [rows] = await pool.query('SELECT * FROM model_versions ORDER BY created_at DESC'); res.json(rows); } catch (e) { next(e); } });
  app.use(notFound); app.use(errorHandler); return app;
}

async function main() { const config = loadEnv(); const pool = mysql.createPool({ ...config.db, connectionLimit: 10 }); const redis = createClient({ url: config.redisUrl }); redis.on('error', (err) => console.error(JSON.stringify({ level: 'error', component: 'redis', message: err.message }))); await redis.connect(); const io = new Server({ cors: { origin: config.webOrigin } }); const app = createApp({ pool, redis, config }); const server = http.createServer(app); io.attach(server); await startResultRelay(redis, io); server.listen(config.port, () => console.log(JSON.stringify({ level: 'info', port: config.port, message: 'API started' }))); return { server, pool, redis }; }
if (require.main === module) main().catch((err) => { console.error(err.message); process.exit(1); });
module.exports = { createApp, main };
