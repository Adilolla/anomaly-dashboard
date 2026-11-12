function notFound(req, res) { res.status(404).json({ error: { code: 'NOT_FOUND', message: `No route for ${req.method} ${req.path}` } }); }
function errorHandler(err, req, res, next) { console.error(JSON.stringify({ level: 'error', message: err.message, path: req.path, stack: err.stack })); const status = err.statusCode || (err.name === 'ValidationError' ? 400 : 500); res.status(status).json({ error: { code: err.code || 'INTERNAL_ERROR', message: status === 500 ? 'Internal server error' : err.message } }); }
module.exports = { notFound, errorHandler };
