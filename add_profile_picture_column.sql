-- Add profile_picture column to restaurant_ratings table
-- Run this SQL command in phpMyAdmin or your MySQL client

ALTER TABLE restaurant_ratings 
ADD COLUMN profile_picture VARCHAR(500) NULL AFTER comment;

-- Verify the column was added
DESCRIBE restaurant_ratings;
