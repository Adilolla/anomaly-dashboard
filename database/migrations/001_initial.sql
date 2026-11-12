CREATE DATABASE IF NOT EXISTS anomaly_dashboard;
USE anomaly_dashboard;

CREATE TABLE IF NOT EXISTS model_versions (
  version VARCHAR(100) PRIMARY KEY,
  artifact_path VARCHAR(500) NOT NULL,
  input_features JSON NOT NULL,
  normalization JSON NULL,
  metrics JSON NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS events (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  idempotency_key VARCHAR(128) NULL,
  source VARCHAR(255) NOT NULL,
  cpu_usage DOUBLE NULL, memory_usage DOUBLE NULL, disk_io DOUBLE NULL,
  network_latency DOUBLE NULL, error_rate DOUBLE NULL, request_rate DOUBLE NULL,
  label BOOLEAN NULL,
  metadata JSON NOT NULL,
  publish_status ENUM('pending', 'published', 'failed') NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  UNIQUE KEY uq_events_idempotency_key (idempotency_key),
  INDEX idx_events_created_at (created_at), INDEX idx_events_source_created (source, created_at)
);

CREATE TABLE IF NOT EXISTS inference_runs (
  id CHAR(36) PRIMARY KEY,
  event_id BIGINT UNSIGNED NOT NULL,
  model_version VARCHAR(100) NOT NULL,
  status ENUM('running', 'succeeded', 'failed') NOT NULL,
  error_message TEXT NULL,
  started_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  finished_at TIMESTAMP(6) NULL,
  UNIQUE KEY uq_inference_event_model (event_id, model_version),
  FOREIGN KEY (event_id) REFERENCES events(id), FOREIGN KEY (model_version) REFERENCES model_versions(version),
  INDEX idx_runs_status (status)
);

CREATE TABLE IF NOT EXISTS anomaly_results (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  event_id BIGINT UNSIGNED NOT NULL,
  model_version VARCHAR(100) NOT NULL,
  anomaly_score DOUBLE NOT NULL,
  is_anomaly BOOLEAN NOT NULL,
  threshold_used DOUBLE NOT NULL,
  detected_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  UNIQUE KEY uq_result_event_model (event_id, model_version),
  FOREIGN KEY (event_id) REFERENCES events(id), FOREIGN KEY (model_version) REFERENCES model_versions(version),
  INDEX idx_results_detected_at (detected_at), INDEX idx_results_anomaly (is_anomaly, detected_at)
);
