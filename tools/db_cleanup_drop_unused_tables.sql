-- FoodCrawl DB cleanup: drop confirmed-unused tables
-- Generated based on repo-wide search: these tables appear only in SQL dumps
-- and have no references in application code (PHP/JS) in this workspace.
--
-- BEFORE RUNNING:
-- 1) Backup/export your database (phpMyAdmin -> Export -> Quick)
-- 2) Run the checks below; if any table has data you care about, STOP.

-- --- Existence checks
SHOW TABLES LIKE 'restaurant_distances';
SHOW TABLES LIKE 'restaurant_tokens';
SHOW TABLES LIKE 'user_location_cache';

-- --- Row-count checks (optional)
-- If a table doesn't exist, these SELECTs will error; that's OK.
SELECT 'restaurant_distances' AS table_name, COUNT(*) AS rows_count FROM restaurant_distances;
SELECT 'restaurant_tokens'     AS table_name, COUNT(*) AS rows_count FROM restaurant_tokens;
SELECT 'user_location_cache'   AS table_name, COUNT(*) AS rows_count FROM user_location_cache;

-- --- Safety option (recommended if you're unsure): rename instead of drop
-- RENAME TABLE restaurant_distances TO _backup_restaurant_distances;
-- RENAME TABLE restaurant_tokens TO _backup_restaurant_tokens;
-- RENAME TABLE user_location_cache TO _backup_user_location_cache;

-- --- Drop tables
-- Note: DROP TABLE causes an implicit commit in MySQL.
SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS restaurant_distances;
DROP TABLE IF EXISTS restaurant_tokens;
DROP TABLE IF EXISTS user_location_cache;
SET FOREIGN_KEY_CHECKS = 1;
