function eventRepository(pool) {
  return {
    async create(event) {
      const [result] = await pool.execute(`INSERT INTO events (idempotency_key, source, cpu_usage, memory_usage, disk_io, network_latency, error_rate, request_rate, label, metadata) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [event.idempotency_key ?? null, event.source, event.cpu_usage, event.memory_usage, event.disk_io, event.network_latency, event.error_rate, event.request_rate, event.label ?? null, JSON.stringify(event.metadata || {})]);
      return { id: result.insertId, ...event };
    },
    async findByIdempotencyKey(key) {
      if (!key) return null;
      const [rows] = await pool.execute('SELECT * FROM events WHERE idempotency_key = ?', [key]);
      return rows[0] || null;
    },
    async list({ limit, offset, from, to }) {
      const where = []; const params = [];
      if (from) { where.push('created_at >= ?'); params.push(from); }
      if (to) { where.push('created_at <= ?'); params.push(to); }
      const clause = where.length ? `WHERE ${where.join(' AND ')}` : '';
      const [rows] = await pool.execute(`SELECT * FROM events ${clause} ORDER BY created_at DESC LIMIT ? OFFSET ?`, [...params, limit, offset]);
      return rows;
    },
    async getById(id) { const [rows] = await pool.execute('SELECT * FROM events WHERE id = ?', [id]); return rows[0] || null; }
  };
}
module.exports = { eventRepository };
