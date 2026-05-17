-- Add menu_image column to restaurants
ALTER TABLE `restaurants`
ADD COLUMN `menu_image` VARCHAR(255) DEFAULT '' AFTER `image_paths`;
    