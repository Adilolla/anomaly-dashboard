import os

def settings():
    required = ('DB_HOST', 'DB_PORT', 'DB_USER', 'DB_NAME', 'REDIS_URL', 'ANOMALY_THRESHOLD', 'MODEL_VERSION')
    missing = [key for key in required if not os.getenv(key)]
    if missing: raise RuntimeError('Missing required configuration: ' + ', '.join(missing))
    return {key: os.environ[key] for key in required} | {'DB_PASSWORD': os.getenv('DB_PASSWORD', ''), 'MODEL_PATH': os.getenv('MODEL_PATH', '/models/current.pt'), 'ALLOW_BASELINE_MODEL': os.getenv('ALLOW_BASELINE_MODEL', 'false').lower() == 'true'}
