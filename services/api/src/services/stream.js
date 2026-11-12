const EVENT_STREAM = 'anomaly:events';
async function publishEvent(redis, eventId) { await redis.xAdd(EVENT_STREAM, '*', { event_id: String(eventId) }); }
module.exports = { EVENT_STREAM, publishEvent };
