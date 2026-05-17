-- Migration: add_facebook_name column to restaurants
-- Safe to run on MySQL 8+: uses IF NOT EXISTS for ALTER TABLE
-- Run in phpMyAdmin (SQL tab) or via mysql CLI:
-- mysql -u youruser -p your_database < add_facebook_name_column.sql

START TRANSACTION;

ALTER TABLE `restaurants`
  ADD COLUMN IF NOT EXISTS `facebook_name` VARCHAR(255) DEFAULT NULL AFTER `facebook_page`;

COMMIT;

-- Rollback (if you need to remove the column):
-- ALTER TABLE `restaurants` DROP COLUMN IF EXISTS `facebook_name`;

-- Example: set facebook_name for an existing row (replace id and values):
-- UPDATE restaurants SET facebook_name = 'My Restaurant Page', facebook_page = 'https://facebook.com/myrestaurant' WHERE id = 1;

-- Verify:
-- SHOW COLUMNS FROM restaurants LIKE 'facebook_name';
-- SELECT id, name, facebook_name, facebook_page FROM restaurants LIMIT 10;