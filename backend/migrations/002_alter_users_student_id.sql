-- Upgrade older databases that don't have student_id yet (safe to run multiple times)
SET @col_exists := (
  SELECT COUNT(1) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'student_id'
);
SET @sql := IF(@col_exists = 0,
  'ALTER TABLE users ADD COLUMN student_id VARCHAR(20) NULL UNIQUE',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
