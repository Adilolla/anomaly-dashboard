FEATURES = ('cpu_usage', 'memory_usage', 'disk_io', 'network_latency', 'error_rate', 'request_rate')

def vectorize(event):
    values = [event.get(name) for name in FEATURES]
    if all(value is None for value in values):
        raise ValueError('event must contain at least one telemetry metric')
    return [float(value or 0.0) for value in values]

def normalize(values, means=None, scales=None):
    means = means or [0.0] * len(values); scales = scales or [1.0] * len(values)
    return [(value - mean) / (scale or 1.0) for value, mean, scale in zip(values, means, scales)]
