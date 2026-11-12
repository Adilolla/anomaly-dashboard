USE anomaly_dashboard;
INSERT INTO model_versions (version, artifact_path, input_features, normalization, metrics)
VALUES ('baseline-v1', 'baseline', '["cpu_usage","memory_usage","disk_io","network_latency","error_rate","request_rate"]', NULL, NULL)
ON DUPLICATE KEY UPDATE version = VALUES(version);
