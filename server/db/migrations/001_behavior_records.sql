-- =============================================================
-- 行为记录与活性证明数据库迁移
-- 专利编号: [待申请]
-- 迁移版本: v1.0
-- =============================================================
--
-- 本迁移为 time 表和新增的 behavior_records 表添加活性证明相关字段。
-- 所有变更均为 ADDITIVE（仅新增列和表），不影响现有功能。
--
-- 执行方式:
--   mysql -u root -p timer_plus < 001_behavior_records.sql

-- =============================================================
-- 第1部分: time 表扩展
-- 为已有的时长记录表添加活性证明列
-- =============================================================

ALTER TABLE time
  ADD COLUMN IF NOT EXISTS `effective_seconds` INT DEFAULT NULL
    COMMENT '服务端验证后的有效时长(秒)，NULL表示使用hourtime值',

  ADD COLUMN IF NOT EXISTS `activity_score` TINYINT DEFAULT NULL
    COMMENT '客户端计算的行为活性评分(0-100)，NULL表示未启用活性证明',

  ADD COLUMN IF NOT EXISTS `suspicious_flags` JSON DEFAULT NULL
    COMMENT '可疑行为标记列表JSON，如["script_like_mouse_trajectory"]，NULL表示无标记',

  ADD COLUMN IF NOT EXISTS `verified_at` DATETIME DEFAULT NULL
    COMMENT '服务端验证时间戳';

-- =============================================================
-- 第2部分: behavior_records 表 - 行为指纹明细记录
-- =============================================================
--
-- 每行记录一次上报中的行为指纹数据，用于：
-- 1. 跨用户行为基线计算（BehaviorAnalyzer）
-- 2. 单个用户行为演变趋势分析
-- 3. 异常行为审计追溯
-- 4. 机器学习模型训练数据

CREATE TABLE IF NOT EXISTS `behavior_records` (
  -- 主键
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY
    COMMENT '自增主键',

  -- 用户标识
  `user_id` INT NOT NULL
    COMMENT '用户ID，关联info.id',
  `date` DATE NOT NULL
    COMMENT '上报日期',
  `daytime` TINYINT UNSIGNED NOT NULL
    COMMENT '上报小时(0-23)',

  -- 会话标识
  `session_id` VARCHAR(64) DEFAULT NULL
    COMMENT '客户端会话唯一标识',
  `sequence_number` INT UNSIGNED DEFAULT 0
    COMMENT '会话内序列号，用于连续性校验',

  -- 时长数据
  `raw_seconds` INT UNSIGNED DEFAULT 0
    COMMENT '原始上报时长(秒)',
  `claim_seconds` INT UNSIGNED DEFAULT 0
    COMMENT '客户端声称的有效时长(秒)',

  -- 行为指纹数据
  `activity_score` TINYINT UNSIGNED DEFAULT NULL
    COMMENT '综合活性评分(0-100)',
  `mouse_fractal_dim` DECIMAL(5,3) DEFAULT NULL
    COMMENT '鼠标轨迹分形维度，人类典型值1.2-1.8',
  `mouse_entropy` DECIMAL(5,3) DEFAULT NULL
    COMMENT '鼠标运动熵值(0-1)',
  `mouse_naturalness` TINYINT UNSIGNED DEFAULT NULL
    COMMENT '鼠标自然度评分(0-100)',

  `keystroke_cv` DECIMAL(5,3) DEFAULT NULL
    COMMENT '击键间隔变异系数(CV)，人类典型值0.08-0.50',
  `focused_ratio` DECIMAL(5,3) DEFAULT NULL
    COMMENT '窗口在前台时间比例(0-1)',
  `visible_ratio` DECIMAL(5,3) DEFAULT NULL
    COMMENT '页面可见时间比例(0-1)',
  `regularity_score` TINYINT UNSIGNED DEFAULT NULL
    COMMENT '活动节律规律性评分(0-100)',

  -- 标记和状态
  `suspicious_flags` JSON DEFAULT NULL
    COMMENT '可疑标记列表JSON',
  `clock_healthy` TINYINT(1) DEFAULT 1
    COMMENT '客户端时钟是否健康(1=健康, 0=疑似篡改)',

  -- 服务端验证结果
  `validation_reasons` JSON DEFAULT NULL
    COMMENT '服务端验证结果标记',
  `effective_seconds` INT UNSIGNED DEFAULT NULL
    COMMENT '服务端最终确认的有效时长(秒)',
  `discount_ratio` DECIMAL(5,4) DEFAULT NULL
    COMMENT '折扣率(effective/raw)',

  -- 时间戳
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    COMMENT '记录创建时间',

  -- 索引
  INDEX `idx_user_date` (`user_id`, `date` DESC)
    COMMENT '按用户和日期查询的索引',
  INDEX `idx_date_daytime` (`date`, `daytime`)
    COMMENT '按小时查询群体基线的索引',
  INDEX `idx_session` (`session_id`)
    COMMENT '按会话查询的索引',
  INDEX `idx_created_at` (`created_at`)
    COMMENT '按创建时间查询的索引',

  -- 外键
  CONSTRAINT `fk_behavior_user`
    FOREIGN KEY (`user_id`) REFERENCES `info` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='行为指纹记录表 - 存储每次时长上报的活性证明数据';

-- =============================================================
-- 第3部分: activity_baselines 表 - 行为基线缓存
-- =============================================================
--
-- 每小时计算一次的群体行为基线，用于快速查询。
-- 由 BehaviorAnalyzer 服务定时更新。

CREATE TABLE IF NOT EXISTS `activity_baselines` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY
    COMMENT '自增主键',

  `date` DATE NOT NULL
    COMMENT '基线日期',
  `daytime` TINYINT UNSIGNED NOT NULL
    COMMENT '基线小时(0-23)',

  `avg_activity_score` DECIMAL(5,2) DEFAULT NULL
    COMMENT '群体平均活性评分',
  `stddev_activity_score` DECIMAL(5,2) DEFAULT NULL
    COMMENT '活性评分标准差',

  `avg_fractal_dim` DECIMAL(5,3) DEFAULT NULL
    COMMENT '群体平均分形维度',
  `stddev_fractal_dim` DECIMAL(5,3) DEFAULT NULL
    COMMENT '分形维度标准差',

  `avg_focus_ratio` DECIMAL(5,3) DEFAULT NULL
    COMMENT '群体平均焦点比',
  `sample_count` INT UNSIGNED DEFAULT 0
    COMMENT '基线样本数',

  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    COMMENT '基线计算时间',

  UNIQUE KEY `uk_date_daytime` (`date`, `daytime`)
    COMMENT '每天每小时仅一条基线',
  INDEX `idx_date` (`date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='群体行为基线缓存 - 每小时一条，用于3σ异常检测';

-- =============================================================
-- 第4部分: 为管理员提供的行为分析视图
-- =============================================================

-- 查询低活性用户（异常检测辅助）
-- SELECT
--   user_id,
--   COUNT(DISTINCT date) as active_days,
--   AVG(activity_score) as avg_score,
--   AVG(mouse_fractal_dim) as avg_fractal,
--   SUM(raw_seconds) as total_raw,
--   COALESCE(SUM(effective_seconds), SUM(raw_seconds)) as total_effective
-- FROM behavior_records
-- WHERE created_at > DATE_SUB(NOW(), INTERVAL 7 DAY)
-- GROUP BY user_id
-- HAVING avg_score < 50 OR (total_raw > 36000 AND avg_score < 30)
-- ORDER BY avg_score ASC;
