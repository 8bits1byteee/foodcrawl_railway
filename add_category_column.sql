-- Migration: add category column to restaurants table
-- Run this in your MySQL environment (e.g. phpMyAdmin or mysql CLI)

ALTER TABLE `restaurants` 
ADD COLUMN `category` VARCHAR(128) DEFAULT '' AFTER `facebook_page`;
