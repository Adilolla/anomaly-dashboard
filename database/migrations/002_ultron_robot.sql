USE anomaly_dashboard;

ALTER TABLE anomaly_results
  ADD COLUMN IF NOT EXISTS component_id VARCHAR(100) NULL,
  ADD COLUMN IF NOT EXISTS component_name VARCHAR(255) NULL,
  ADD COLUMN IF NOT EXISTS fault_code VARCHAR(100) NULL,
  ADD COLUMN IF NOT EXISTS severity ENUM('info', 'warning', 'critical') NOT NULL DEFAULT 'info',
  ADD COLUMN IF NOT EXISTS diagnosis TEXT NULL,
  ADD COLUMN IF NOT EXISTS recommended_action TEXT NULL,
  ADD COLUMN IF NOT EXISTS advisor_confidence DOUBLE NULL;
