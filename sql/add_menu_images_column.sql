-- Add menu_images column to store multiple menu images (JSON array or TEXT)
-- Run this migration if menu_image doesn't exist or needs to be converted

-- If menu_image column exists as VARCHAR, we can reuse it to store JSON
-- Otherwise add a new TEXT column for menu_images

-- Option 1: If menu_image exists, convert it to TEXT to store JSON array
ALTER TABLE restaurants MODIFY COLUMN menu_image TEXT;

-- Option 2: If you want a separate column for clarity, add menu_images
-- ALTER TABLE restaurants ADD COLUMN menu_images TEXT AFTER menu_image;

-- Note: We'll store menu image paths as JSON array, e.g., ["path1.jpg", "path2.jpg", ...]
