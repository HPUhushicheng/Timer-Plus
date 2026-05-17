-- 兼容低版本 MySQL 的迁移脚本 (v1.0 compat)

-- === time 表扩展 ===
ALTER TABLE time ADD COLUMN effective_seconds INT DEFAULT NULL COMMENT '有效时长';
ALTER TABLE time ADD COLUMN activity_score TINYINT DEFAULT NULL COMMENT '活性评分';
ALTER TABLE time ADD COLUMN suspicious_flags JSON DEFAULT NULL COMMENT '可疑标记';
ALTER TABLE time ADD COLUMN verified_at DATETIME DEFAULT NULL COMMENT '验证时间';

-- === behavior_records 表 ===
CREATE TABLE IF NOT EXISTS `behavior_records` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `date` DATE NOT NULL,
  `daytime` TINYINT UNSIGNED NOT NULL,
  `session_id` VARCHAR(64) DEFAULT NULL,
  `sequence_number` INT UNSIGNED DEFAULT 0,
  `raw_seconds` INT UNSIGNED DEFAULT 0,
  `claim_seconds` INT UNSIGNED DEFAULT 0,
  `activity_score` TINYINT UNSIGNED DEFAULT NULL,
  `mouse_fractal_dim` DECIMAL(5,3) DEFAULT NULL,
  `mouse_entropy` DECIMAL(5,3) DEFAULT NULL,
  `mouse_naturalness` TINYINT UNSIGNED DEFAULT NULL,
  `keystroke_cv` DECIMAL(5,3) DEFAULT NULL,
  `focused_ratio` DECIMAL(5,3) DEFAULT NULL,
  `visible_ratio` DECIMAL(5,3) DEFAULT NULL,
  `regularity_score` TINYINT UNSIGNED DEFAULT NULL,
  `suspicious_flags` JSON DEFAULT NULL,
  `clock_healthy` TINYINT(1) DEFAULT 1,
  `validation_reasons` JSON DEFAULT NULL,
  `effective_seconds` INT UNSIGNED DEFAULT NULL,
  `discount_ratio` DECIMAL(5,4) DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_user_date` (`user_id`, `date` DESC),
  INDEX `idx_date_daytime` (`date`, `daytime`),
  INDEX `idx_session` (`session_id`),
  INDEX `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- === activity_baselines 表 ===
CREATE TABLE IF NOT EXISTS `activity_baselines` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `date` DATE NOT NULL,
  `daytime` TINYINT UNSIGNED NOT NULL,
  `avg_activity_score` DECIMAL(5,2) DEFAULT NULL,
  `stddev_activity_score` DECIMAL(5,2) DEFAULT NULL,
  `avg_fractal_dim` DECIMAL(5,3) DEFAULT NULL,
  `stddev_fractal_dim` DECIMAL(5,3) DEFAULT NULL,
  `avg_focus_ratio` DECIMAL(5,3) DEFAULT NULL,
  `sample_count` INT UNSIGNED DEFAULT 0,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `uk_date_daytime` (`date`, `daytime`),
  INDEX `idx_date` (`date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
