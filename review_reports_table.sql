-- Create review_reports table
CREATE TABLE IF NOT EXISTS `review_reports` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `review_id` int(11) NOT NULL,
  `restaurant_id` int(11) NOT NULL,
  `reason` varchar(255) DEFAULT 'No reason provided',
  `reporter_name` varchar(100) DEFAULT 'Anonymous',
  `reporter_ip` varchar(45) DEFAULT NULL,
  `status` enum('pending','reviewed','dismissed','removed') DEFAULT 'pending',
  `admin_notes` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `review_id` (`review_id`),
  KEY `restaurant_id` (`restaurant_id`),
  KEY `status` (`status`),
  CONSTRAINT `fk_reports_review` FOREIGN KEY (`review_id`) REFERENCES `restaurant_ratings` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_reports_restaurant` FOREIGN KEY (`restaurant_id`) REFERENCES `restaurants` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Add index for faster queries
CREATE INDEX idx_created_at ON review_reports(created_at DESC);
CREATE INDEX idx_status_created ON review_reports(status, created_at DESC);
