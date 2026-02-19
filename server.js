const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const mysql = require('mysql2/promise');

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

// MySQL connection pool
const pool = mysql.createPool({
    host: '127.0.0.1',
    user: 'root',
    password: 'Franklinpass123_',   // 👈 change this
    database: 'anomaly_dashboard'
});

// REST: Get last 50 results for initial dashboard load
app.get('/api/results', async (req, res) => {
    try {
        const [rows] = await pool.query(`
      SELECT e.id, e.value, e.label, e.created_at,
             ar.is_anomaly, ar.anomaly_score, ar.detected_at
      FROM events e
      JOIN anomaly_results ar ON ar.event_id = e.id
      ORDER BY e.created_at DESC LIMIT 50
    `);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// REST: Insert a new event
app.post('/api/events', async (req, res) => {
    try {
        const { value, label } = req.body;
        const [result] = await pool.query(
            'INSERT INTO events (value, label) VALUES (?, ?)', [value, label]
        );
        res.json({ id: result.insertId });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Real-time: Poll every 2s for new results and push via Socket.IO
let lastChecked = new Date(0);
setInterval(async () => {
    try {
        const [rows] = await pool.query(`
      SELECT e.id, e.value, e.label, e.created_at,
             ar.is_anomaly, ar.anomaly_score, ar.detected_at
      FROM events e
      JOIN anomaly_results ar ON ar.event_id = e.id
      WHERE ar.detected_at > ? AND ar.anomaly_score > 0
      ORDER BY ar.detected_at ASC
    `, [lastChecked]);

        if (rows.length > 0) {
            lastChecked = new Date();
            rows.forEach(row => io.emit('new_result', row));
        }
    } catch (err) {
        console.error('Polling error:', err.message);
    }
}, 2000);

io.on('connection', (socket) => {
    console.log('Dashboard connected:', socket.id);
});

server.listen(3000, () => console.log('✅ Server running on http://localhost:3000'));