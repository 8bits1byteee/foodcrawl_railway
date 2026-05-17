-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Mar 09, 2026 at 05:26 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `food_crawl`
--

-- --------------------------------------------------------

--
-- Table structure for table `admin_users`
--

CREATE TABLE `admin_users` (
  `id` int(11) NOT NULL,
  `username` varchar(50) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `email` varchar(100) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `admin_users`
--

INSERT INTO `admin_users` (`id`, `username`, `password_hash`, `email`, `created_at`) VALUES
(1, 'admin', '$2y$10$kh9EpY49lZkDyUIKASdS3OjpFcFPq3/At7UpMUi6qcPOyW1ZFfsrK', 'admin@estanciafoodcrawl.com', '2025-09-29 14:08:53');

-- --------------------------------------------------------

--
-- Table structure for table `chat_history`
--

CREATE TABLE `chat_history` (
  `id` int(11) NOT NULL,
  `session_id` varchar(128) NOT NULL,
  `message` text NOT NULL,
  `sender` varchar(16) NOT NULL,
  `timestamp` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `owners`
--

CREATE TABLE `owners` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `owners`
--

INSERT INTO `owners` (`id`, `name`, `email`, `password_hash`, `created_at`) VALUES
(1, 'Restaurant Owner', 'owner@estanciafoodcrawl.com', '$2y$10$XOVr5ETIE7Mmogh5WBr8i.Tjg2OSeSWpd6FOwa3nytOubvbpBYImm', '2026-02-16 02:33:22'),
(2, 'Domingo\'s Grill and Resto Bar Owner', 'domingosgrillandrestobar@owner.foodcrawl.com', '$2y$10$MlHPnuHU/ixVPnYKdobmzOiatzbPEUKTY2WjKk0/uIxTsApXpSiPm', '2026-02-16 02:46:13'),
(3, 'Paon Beach Club Owner', 'paonbeachclub@owner.foodcrawl.com', '$2y$10$MlHPnuHU/ixVPnYKdobmzOiatzbPEUKTY2WjKk0/uIxTsApXpSiPm', '2026-02-16 02:46:13'),
(4, 'RC Woodland Resort Inc. Owner', 'rcwoodlandresortinc@owner.foodcrawl.com', '$2y$10$MlHPnuHU/ixVPnYKdobmzOiatzbPEUKTY2WjKk0/uIxTsApXpSiPm', '2026-02-16 02:46:13'),
(5, 'Endielina’s  Inland Resot Corporation Owner', 'endielinasinlandresotcorporation@owner.foodcrawl.com', '$2y$10$MlHPnuHU/ixVPnYKdobmzOiatzbPEUKTY2WjKk0/uIxTsApXpSiPm', '2026-02-16 02:46:13'),
(6, 'Ken\'s Café Owner', 'kenscaf@owner.foodcrawl.com', '$2y$10$MlHPnuHU/ixVPnYKdobmzOiatzbPEUKTY2WjKk0/uIxTsApXpSiPm', '2026-02-16 02:46:13'),
(7, 'Wawa Kape & Heritage Restaurant Owner', 'wawakapeheritagerestaurant@owner.foodcrawl.com', '$2y$10$MlHPnuHU/ixVPnYKdobmzOiatzbPEUKTY2WjKk0/uIxTsApXpSiPm', '2026-02-16 02:46:13'),
(8, 'Toledo\'s Eatery Owner', 'toledoseatery@owner.foodcrawl.com', '$2y$10$MlHPnuHU/ixVPnYKdobmzOiatzbPEUKTY2WjKk0/uIxTsApXpSiPm', '2026-02-16 02:46:13'),
(9, 'Amara\'s Chicken Inasal House Owner', 'amaraschickeninasalhouse@owner.foodcrawl.com', '$2y$10$MlHPnuHU/ixVPnYKdobmzOiatzbPEUKTY2WjKk0/uIxTsApXpSiPm', '2026-02-16 02:46:13'),
(10, 'Taklad Resto Bar Owner', 'takladrestobar@owner.foodcrawl.com', '$2y$10$MlHPnuHU/ixVPnYKdobmzOiatzbPEUKTY2WjKk0/uIxTsApXpSiPm', '2026-02-16 02:46:13'),
(11, 'Stop Over Restaurant Owner', 'stopoverrestaurant@owner.foodcrawl.com', '$2y$10$MlHPnuHU/ixVPnYKdobmzOiatzbPEUKTY2WjKk0/uIxTsApXpSiPm', '2026-02-16 02:46:13'),
(12, 'Letty\'s Seafood and Grill Owner', 'lettysseafoodandgrill@owner.foodcrawl.com', '$2y$10$MlHPnuHU/ixVPnYKdobmzOiatzbPEUKTY2WjKk0/uIxTsApXpSiPm', '2026-02-16 02:46:13'),
(13, 'Marinas Grill Owner', 'marinasgrill@owner.foodcrawl.com', '$2y$10$MlHPnuHU/ixVPnYKdobmzOiatzbPEUKTY2WjKk0/uIxTsApXpSiPm', '2026-02-16 02:46:13'),
(14, 'Milagros Kitchenette Owner', 'milagroskitchenette@owner.foodcrawl.com', '$2y$10$MlHPnuHU/ixVPnYKdobmzOiatzbPEUKTY2WjKk0/uIxTsApXpSiPm', '2026-02-16 02:46:13'),
(15, 'Cuddle\'s N Tea Owner', 'cuddlesntea@owner.foodcrawl.com', '$2y$10$MlHPnuHU/ixVPnYKdobmzOiatzbPEUKTY2WjKk0/uIxTsApXpSiPm', '2026-02-16 02:46:13'),
(16, 'Brew & Go Owner', 'brewgo@owner.foodcrawl.com', '$2y$10$MlHPnuHU/ixVPnYKdobmzOiatzbPEUKTY2WjKk0/uIxTsApXpSiPm', '2026-02-16 02:46:13'),
(17, 'Papol\'s Seafood Grill and Restaurant Owner', 'papolsseafoodgrillandrestaurant@owner.foodcrawl.com', '$2y$10$MlHPnuHU/ixVPnYKdobmzOiatzbPEUKTY2WjKk0/uIxTsApXpSiPm', '2026-02-16 02:46:13'),
(18, 'Pizza Ocho Owner', 'pizzaocho@owner.foodcrawl.com', '$2y$10$MlHPnuHU/ixVPnYKdobmzOiatzbPEUKTY2WjKk0/uIxTsApXpSiPm', '2026-02-16 02:46:13'),
(19, 'Timplahan Espresso Bar Owner', 'timplahanespressobar@owner.foodcrawl.com', '$2y$10$MlHPnuHU/ixVPnYKdobmzOiatzbPEUKTY2WjKk0/uIxTsApXpSiPm', '2026-02-16 02:46:13'),
(20, 'Dak\'sside café Owner', 'dakssidecaf@owner.foodcrawl.com', '$2y$10$MlHPnuHU/ixVPnYKdobmzOiatzbPEUKTY2WjKk0/uIxTsApXpSiPm', '2026-02-16 02:46:13'),
(21, 'kent Owner', 'kent@gmail.com', '$2y$10$hwVGINfyaKWKD37WGNkVreFRi328Ppcud0hWwpu9zm/1wojnPXz7e', '2026-02-16 07:58:27');

-- --------------------------------------------------------

--
-- Table structure for table `owner_notifications`
--

CREATE TABLE `owner_notifications` (
  `id` int(11) NOT NULL,
  `owner_id` int(11) NOT NULL,
  `change_id` int(11) DEFAULT NULL,
  `message` text NOT NULL,
  `type` enum('approved','rejected','info') DEFAULT 'info',
  `is_read` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `owner_notifications`
--

INSERT INTO `owner_notifications` (`id`, `owner_id`, `change_id`, `message`, `type`, `is_read`, `created_at`) VALUES
(1, 2, 2, 'Your changes to \"Domingo\'s Grill and Resto Bar \" have been rejected. Fields: name, hours', 'rejected', 0, '2026-02-16 03:03:10'),
(2, 2, 3, 'Your changes to \"Domingo\'s Grill and Resto Bar \" have been rejected. Fields: hours', 'rejected', 0, '2026-02-16 04:37:44'),
(4, 11, 5, 'Your changes to \"Stop Over Restaurant \" have been approved! Fields updated: name. Admin notes: oki', 'approved', 0, '2026-02-16 07:09:00'),
(5, 11, 6, 'Your changes to \"Stop Over Restaurantt\" have been rejected. Fields: name', 'rejected', 0, '2026-02-16 07:32:13'),
(6, 11, 7, 'Your changes to \"Stop Over Restaurantt\" have been rejected. Fields: menu_image', 'rejected', 0, '2026-02-16 07:36:47'),
(10, 11, 8, 'Your changes to \"Stop Over Restaurantt\" have been rejected. Fields: name, description, address, facebook_name, facebook_page, menu_items, price_range, seating_capacity, category, reservation_needed, parking_availability, wifi_availability, payment_methods, delivery_options, accessibility, hours, image_paths, menu_image, logo', 'rejected', 0, '2026-02-16 08:21:29'),
(21, 20, 28, 'Your changes to \"Dak\'sside café \" have been rejected. Fields: address, latitude, longitude, attachments', 'rejected', 0, '2026-03-09 08:52:04'),
(22, 20, 29, 'Your changes to \"Dak\'sside café \" have been rejected. Fields: category, attachments', 'rejected', 0, '2026-03-09 09:06:17'),
(23, 20, 30, 'Your changes to \"Dak\'sside café \" have been rejected. Fields: latitude, longitude, attachments', 'rejected', 0, '2026-03-09 09:10:36'),
(24, 20, 31, 'Your changes to \"Dak\'sside café \" have been rejected. Fields: name, description, address, phone, email, facebook_name, facebook_page, menu_items, price_range, seating_capacity, latitude, longitude, reservation_needed, parking_availability, wifi_availability, payment_methods, delivery_options, accessibility, hours, full_menu, image_paths, logo, attachments', 'rejected', 0, '2026-03-09 09:14:00');

-- --------------------------------------------------------

--
-- Table structure for table `restaurants`
--

CREATE TABLE `restaurants` (
  `id` int(11) NOT NULL,
  `owner_id` int(11) DEFAULT NULL,
  `name` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `address` text DEFAULT NULL,
  `latitude` decimal(10,8) NOT NULL,
  `longitude` decimal(11,8) NOT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `hours` text DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `facebook_page` varchar(255) DEFAULT NULL,
  `category` varchar(128) DEFAULT '',
  `category_color` varchar(7) NOT NULL DEFAULT '#E85634',
  `facebook_name` varchar(255) DEFAULT NULL,
  `image_path` varchar(500) DEFAULT NULL,
  `logo` varchar(500) DEFAULT NULL,
  `menu_items` text DEFAULT NULL,
  `full_menu` text DEFAULT NULL,
  `visit_count` int(11) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `image_paths` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT '[]' CHECK (json_valid(`image_paths`)),
  `menu_image` text DEFAULT NULL,
  `seating_capacity` varchar(100) DEFAULT NULL,
  `reservation_needed` enum('Yes','No') DEFAULT NULL,
  `parking_availability` enum('Yes','Limited','None') DEFAULT NULL,
  `delivery_options` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT 'JSON array: ["Dine-in","Take-out","Delivery"]' CHECK (json_valid(`delivery_options`)),
  `wifi_availability` enum('Yes','No') DEFAULT NULL,
  `accessibility` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT 'JSON array of accessibility features' CHECK (json_valid(`accessibility`)),
  `price_range` varchar(100) DEFAULT NULL,
  `payment_methods` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`payment_methods`))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `restaurants`
--

INSERT INTO `restaurants` (`id`, `owner_id`, `name`, `description`, `address`, `latitude`, `longitude`, `phone`, `hours`, `email`, `facebook_page`, `category`, `category_color`, `facebook_name`, `image_path`, `logo`, `menu_items`, `full_menu`, `visit_count`, `created_at`, `image_paths`, `menu_image`, `seating_capacity`, `reservation_needed`, `parking_availability`, `delivery_options`, `wifi_availability`, `accessibility`, `price_range`, `payment_methods`) VALUES
(41, 2, 'Domingo\'s Grill and Resto Bar ', '', 'F563+84W Gogo, Pabahay Road, Estancia, 5017 Iloilo', 11.46089329, 123.15284419, '', '{\"Monday\":{\"open\":\"09:00\",\"close\":\"18:00\",\"closed\":false},\"Tuesday\":{\"open\":\"09:00\",\"close\":\"18:00\",\"closed\":false},\"Wednesday\":{\"open\":\"09:00\",\"close\":\"18:00\",\"closed\":false},\"Thursday\":{\"open\":\"09:00\",\"close\":\"18:00\",\"closed\":false},\"Friday\":{\"open\":\"09:00\",\"close\":\"18:00\",\"closed\":false},\"Saturday\":{\"open\":\"09:00\",\"close\":\"18:00\",\"closed\":false},\"Sunday\":{\"open\":\"09:00\",\"close\":\"18:00\",\"closed\":false}}', '', '', 'Casual Dining', '#E85634', '', '', '', 'adobo, sinigang, inasal', NULL, 156, '2025-11-23 12:17:59', '[]', '[\"images\\/restaurants\\/69aef3bd6a12d_menu.png\"]', '', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(43, 3, 'Paon Beach Club', '', 'Pa-On – Daculan Road Pa-On, Estancia, Iloilo, Philippines', 11.46135998, 123.15723185, '', '{\"Monday\":{\"closed\":true},\"Tuesday\":{\"closed\":true},\"Wednesday\":{\"closed\":true},\"Thursday\":{\"closed\":true},\"Friday\":{\"closed\":true},\"Saturday\":{\"closed\":true},\"Sunday\":{\"closed\":true}}', '', '', 'Casual Dining', '#E85634', '', '', '', '', NULL, 3, '2025-11-23 12:25:30', '[]', '', '', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(44, 4, 'RC Woodland Resort Inc.', '', 'Bulaqueña, Estancia, Iloilo, Philippines', 11.46656102, 123.15297221, '09948778456', '{\"Monday\":{\"open\":\"09:00\",\"close\":\"18:00\",\"closed\":false},\"Tuesday\":{\"open\":\"09:00\",\"close\":\"18:00\",\"closed\":false},\"Wednesday\":{\"open\":\"09:00\",\"close\":\"18:00\",\"closed\":false},\"Thursday\":{\"open\":\"09:00\",\"close\":\"18:00\",\"closed\":false},\"Friday\":{\"open\":\"09:00\",\"close\":\"18:00\",\"closed\":false},\"Saturday\":{\"open\":\"09:00\",\"close\":\"18:00\",\"closed\":false},\"Sunday\":{\"open\":\"09:00\",\"close\":\"18:00\",\"closed\":false}}', 'rcwoodlandresort@gmail.com', 'https://web.facebook.com/estancia.rc.woodland.2025', 'Casual Dining', '#E85634', 'Estancia RC Woodland', 'images/restaurants/6977820d875ac_486360187_1098790192261732_6046351191032195401_n.jpg', 'images/restaurants/6977820d88cac_logo.jpg', 'Buttered Chicken, Native Chicken Tinola, Salt and Peppper Spare ribs', NULL, 12, '2025-11-23 12:28:03', '[\"images\\/restaurants\\/6977820d875ac_486360187_1098790192261732_6046351191032195401_n.jpg\",\"images\\/restaurants\\/6977820d8799b_486641120_1097432632397488_721565336945281389_n.jpg\",\"images\\/restaurants\\/6977820d87d90_480534048_2702367790152331_6560275779199373490_n.jpg\",\"images\\/restaurants\\/6977820d88211_486673980_1099162932224458_4295830547238266219_n.jpg\",\"images\\/restaurants\\/6977820d8862c_488794650_2744547815934328_3792703378140277793_n.jpg\"]', '[\"images\\/restaurants\\/6977820d8960f_menu.jpg\"]', '100', 'No', 'Yes', '[\"Dine-in\",\"Take-out\",\"Delivery\"]', 'Yes', '[\"Wheelchair accessible restroom\",\"Parking for persons with disabilities\",\"Staff assistance available\",\"Drop-off area near entrance\",\"Non-slip flooring\"]', '105-500 Pesos', '[\"Cash\",\"GCash\",\"Bank Transfer\"]'),
(45, 5, 'Endielina’s  Inland Resot Corporation', '', 'Bayuyan, Estancia, Iloilo, Philippines', 11.45810706, 123.14156862, '09339704332', '{\"Monday\":{\"open\":\"07:00\",\"close\":\"23:00\",\"closed\":false},\"Tuesday\":{\"open\":\"07:00\",\"close\":\"23:00\",\"closed\":false},\"Wednesday\":{\"open\":\"07:00\",\"close\":\"23:00\",\"closed\":false},\"Thursday\":{\"open\":\"07:00\",\"close\":\"23:00\",\"closed\":false},\"Friday\":{\"open\":\"07:00\",\"close\":\"23:00\",\"closed\":false},\"Saturday\":{\"open\":\"07:00\",\"close\":\"23:00\",\"closed\":false},\"Sunday\":{\"open\":\"07:00\",\"close\":\"23:00\",\"closed\":false}}', 'endielinasinland2021@gmail.com', 'https://web.facebook.com/endielina.delarosa.79', 'Fine Dining', '#E85634', 'Endielinas InlandResort', 'images/restaurants/69777233132e5_95610470_101222621598730_7630998356218609664_n.jpg', '', '', NULL, 29, '2025-11-23 12:29:53', '[\"images\\/restaurants\\/69777233132e5_95610470_101222621598730_7630998356218609664_n.jpg\",\"images\\/restaurants\\/6977723313498_101311909_121915656196093_639455656109146112_n.jpg\",\"images\\/restaurants\\/6977723313692_101126334_121915772862748_4817658467961536512_n.jpg\",\"images\\/restaurants\\/69777233139f8_101114327_121915692862756_483109135613689856_n.jpg\",\"images\\/restaurants\\/6977723313c26_78991611_121915839529408_8481143521363886080_n.jpg\"]', '', '', 'No', 'Yes', '[\"Dine-in\",\"Take-out\"]', 'Yes', '[\"Staff assistance available\",\"High chair or child seat available\",\"Near public transport\",\"Drop-off area near entrance\",\"Non-slip flooring\"]', '100-650 Pesos', '[\"Cash\",\"GCash\"]'),
(46, 1, 'Cafe Anteiku', 'Cool and Ambient Cafe designed to start your day, right? Because we brew happiness', 'Poblacion Zone II, Estancia, Iloilo, Philippines', 11.45715682, 123.14825103, '09202819577', '{\"Monday\":{\"open\":\"09:00\",\"close\":\"18:00\",\"closed\":false},\"Tuesday\":{\"open\":\"09:00\",\"close\":\"18:00\",\"closed\":false},\"Wednesday\":{\"open\":\"09:00\",\"close\":\"18:00\",\"closed\":false},\"Thursday\":{\"open\":\"09:00\",\"close\":\"18:00\",\"closed\":false},\"Friday\":{\"open\":\"09:00\",\"close\":\"18:00\",\"closed\":false},\"Saturday\":{\"open\":\"09:00\",\"close\":\"18:00\",\"closed\":false},\"Sunday\":{\"open\":\"09:00\",\"close\":\"18:00\",\"closed\":false}}', 'cafeanteiku28@gmail.com', 'https://web.facebook.com/CafeAnteiku28', 'Café / Coffee Shop', '#E85634', 'Cafe Anteiku', 'images/restaurants/692303c5742e6_4d04cd86-95f5-44ea-b1cf-723c8fb31a22.jpg', 'images/restaurants/692303c575970_logo.jpg', 'Red Velvet Cake, Caramel Machiato, Spanish Latte, Anteiku Fries', NULL, 444, '2025-11-23 12:31:24', '[\"images\\/restaurants\\/692303c5742e6_4d04cd86-95f5-44ea-b1cf-723c8fb31a22.jpg\",\"images\\/restaurants\\/692303c5747fb_2d60190e-7124-4c2e-acff-be93b1448959.jpg\",\"images\\/restaurants\\/692303c574b71_e367ec7f-6c1e-4bd9-92b0-6e54b7b68845.jpg\",\"images\\/restaurants\\/692303c574f48_ab10acea-457e-4c71-9855-491159df2795.jpg\",\"images\\/restaurants\\/692303c57531a_217708f2-04f2-400f-aa6a-93fd009dafdd.jpg\"]', '[\"images\\/restaurants\\/692303d6cc2fe_menu.jpg\"]', '', 'No', 'Limited', '[\"Dine-in\",\"Take-out\",\"Delivery\"]', 'Yes', '[\"Braille menu or signage\",\"Staff assistance available\",\"Drop-off area near entrance\",\"Non-slip flooring\"]', '150', '[\"Cash\",\"Credit\\/Debit Card\",\"GCash\",\"Maya\",\"Bank Transfer\"]'),
(47, 6, 'Ken\'s Café ', 'Friendly and accomodating staff, nice sea view, good affordable prices.', 'Poblacion Zone II, Estancia, Iloilo, Philippines', 11.45591387, 123.15445728, '09308887280', '{\"Monday\":{\"open\":\"08:00\",\"close\":\"20:00\",\"closed\":false},\"Tuesday\":{\"open\":\"08:00\",\"close\":\"20:00\",\"closed\":false},\"Wednesday\":{\"open\":\"08:00\",\"close\":\"20:00\",\"closed\":false},\"Thursday\":{\"open\":\"08:00\",\"close\":\"20:00\",\"closed\":false},\"Friday\":{\"open\":\"08:00\",\"close\":\"20:00\",\"closed\":false},\"Saturday\":{\"open\":\"08:00\",\"close\":\"20:00\",\"closed\":false},\"Sunday\":{\"open\":\"08:00\",\"close\":\"20:00\",\"closed\":false}}', '', 'https://web.facebook.com/profile.php?id=61551922642639', 'Café / Coffee Shop', '#E85634', 'Ken\'s Cafe by: Ralph Elle ', 'images/restaurants/69776f3099bf8_598588123_122220383870064088_8654668428782333359_n.jpg', 'images/restaurants/69776f309b233_logo.jpg', 'Chicken Inasal', NULL, 41, '2025-11-23 12:32:36', '[\"images\\/restaurants\\/69776f3099bf8_598588123_122220383870064088_8654668428782333359_n.jpg\",\"images\\/restaurants\\/69776f3099ff4_589502706_122218536974064088_2295017184896306446_n.jpg\",\"images\\/restaurants\\/69776f309a4d7_536285066_122204343464064088_335518981837324015_n.jpg\",\"images\\/restaurants\\/69776f309a864_613592348_122222983778064088_7541630303649695527_n.jpg\",\"images\\/restaurants\\/69776f309ac86_505169793_122195318216064088_3178910413429598768_n.jpg\"]', '[\"images\\/restaurants\\/69776f309ec12_menu.jpg\",\"images\\/restaurants\\/69776f309f17e_menu.jpg\"]', '30', 'No', 'Yes', '[\"Dine-in\",\"Take-out\",\"Delivery\"]', 'Yes', NULL, '20-200 Pesos', '[\"Cash\",\"GCash\"]'),
(48, 7, 'Wawa Kape & Heritage Restaurant', '', 'Botongon, Estancia, Iloilo, Philippines', 11.44980346, 123.14942793, '09189097362', '{\"Monday\":{\"open\":\"11:00\",\"close\":\"19:00\",\"closed\":false},\"Tuesday\":{\"open\":\"11:00\",\"close\":\"19:00\",\"closed\":false},\"Wednesday\":{\"open\":\"11:00\",\"close\":\"19:00\",\"closed\":false},\"Thursday\":{\"open\":\"11:00\",\"close\":\"19:00\",\"closed\":false},\"Friday\":{\"open\":\"11:00\",\"close\":\"19:00\",\"closed\":false},\"Saturday\":{\"open\":\"11:00\",\"close\":\"19:00\",\"closed\":false},\"Sunday\":{\"open\":\"11:00\",\"close\":\"19:00\",\"closed\":false}}', 'pjaranador@yahoo.com', 'https://web.facebook.com/profile.php?id=61571764050967', 'Café / Coffee Shop', '#E85634', 'Wawa Kape Little Baguio', 'images/restaurants/69776acc42fde_614811643_122148923354725468_2666986943461440683_n.jpg', '', '', NULL, 15, '2025-11-23 12:33:54', '[\"images\\/restaurants\\/69776acc42fde_614811643_122148923354725468_2666986943461440683_n.jpg\",\"images\\/restaurants\\/69776acc432c4_615793708_122148923120725468_7132662538209705340_n.jpg\",\"images\\/restaurants\\/69776acc43789_615352471_122148923426725468_3199638770282636018_n.jpg\",\"images\\/restaurants\\/69776acc43965_616088893_122149349108725468_149487914674253869_n.jpg\",\"images\\/restaurants\\/69776b06626d9_616016978_122149339526725468_1015841382111385835_n.jpg\"]', '', '40-50', 'No', 'Limited', '[\"Dine-in\",\"Take-out\",\"Delivery\"]', 'No', '[\"Staff assistance available\",\"Non-slip flooring\"]', '35-600 Pesos', '[\"Cash\",\"GCash\"]'),
(49, 8, 'Toledo\'s Eatery ', '', 'Bayuyan, Estancia, Iloilo, Philippines', 11.45835380, 123.14131477, '09928759419', '{\"Monday\":{\"open\":\"08:00\",\"close\":\"22:00\",\"closed\":false},\"Tuesday\":{\"open\":\"08:00\",\"close\":\"22:00\",\"closed\":false},\"Wednesday\":{\"open\":\"08:00\",\"close\":\"22:00\",\"closed\":false},\"Thursday\":{\"open\":\"08:00\",\"close\":\"22:00\",\"closed\":false},\"Friday\":{\"open\":\"08:00\",\"close\":\"22:00\",\"closed\":false},\"Saturday\":{\"open\":\"08:00\",\"close\":\"22:00\",\"closed\":false},\"Sunday\":{\"open\":\"08:00\",\"close\":\"22:00\",\"closed\":false}}', 'toledosrestobar@gmail.com', '', 'Fast Food', '#E85634', '', 'images/restaurants/69777f27b4422_539753863_761444896637351_2863400559203802685_n.jpg', 'images/restaurants/69777f27b5062_logo.jpg', '', NULL, 25, '2025-11-23 12:35:28', '[\"images\\/restaurants\\/69777f27b4422_539753863_761444896637351_2863400559203802685_n.jpg\",\"images\\/restaurants\\/69777f27b45ee_537750896_761445006637340_1746117865253738582_n.jpg\",\"images\\/restaurants\\/69777f27b47fd_535616024_758250913623416_8370310800413870407_n.jpg\",\"images\\/restaurants\\/69777f27b4a0c_535550218_758254690289705_4790065333858983313_n.jpg\"]', '[\"images\\/restaurants\\/69777f27b55c4_menu.jpg\",\"images\\/restaurants\\/69777f27b5943_menu.jpg\",\"images\\/restaurants\\/69777f27b5cc3_menu.jpg\"]', '', 'No', 'Yes', '[\"Dine-in\",\"Take-out\"]', 'No', '[\"Wheelchair accessible entrance\",\"Wheelchair accessible seating\",\"Staff assistance available\",\"Near public transport\",\"Drop-off area near entrance\"]', NULL, '[\"Cash\",\"Maya\"]'),
(50, 9, 'Amara\'s Chicken Inasal House', 'Amara\'s chicken Inasal House cooked foods that made with love. Affordable and quality foods will be serve to you.\r\n\r\n', 'Poblacion Zone II, Estancia, Iloilo, Philippines', 11.45692027, 123.15179131, '09565279639', '{\"Monday\":{\"open\":\"08:00\",\"close\":\"21:00\",\"closed\":false},\"Tuesday\":{\"open\":\"08:00\",\"close\":\"21:00\",\"closed\":false},\"Wednesday\":{\"open\":\"08:00\",\"close\":\"21:00\",\"closed\":false},\"Thursday\":{\"open\":\"08:00\",\"close\":\"21:00\",\"closed\":false},\"Friday\":{\"open\":\"08:00\",\"close\":\"21:00\",\"closed\":false},\"Saturday\":{\"open\":\"08:00\",\"close\":\"21:00\",\"closed\":false},\"Sunday\":{\"open\":\"08:00\",\"close\":\"21:00\",\"closed\":false}}', 'reyshendeangel@yahoo.com', 'https://web.facebook.com/profile.php?id=100070700810044', 'Fast Food', '#E85634', 'Amara\'s Chicken Inasal', 'images/restaurants/6985680d518bd_482254233_668226142210740_1768458360478605555_n.jpg', 'images/restaurants/6985680d524aa_logo.jpg', 'Inasal, Sisig', NULL, 134, '2025-11-23 12:36:12', '[\"images\\/restaurants\\/6985680d518bd_482254233_668226142210740_1768458360478605555_n.jpg\",\"images\\/restaurants\\/6985680d51b31_481074781_668226145544073_7587009801211528986_n.jpg\",\"images\\/restaurants\\/6985680d51dbf_476611551_653611960338825_5241544559868169026_n.jpg\",\"images\\/restaurants\\/6985680d52005_481058105_665895979110423_3414941362912768344_n.jpg\"]', '[\"images\\/restaurants\\/6985680d53e2c_menu.jpg\",\"images\\/restaurants\\/6985680d54279_menu.jpg\",\"images\\/restaurants\\/6985680d54677_menu.jpg\",\"images\\/restaurants\\/6985680d54a17_menu.jpg\"]', '70 people', 'No', 'None', '[\"Dine-in\",\"Take-out\",\"Delivery\"]', 'No', '[\"Braille menu or signage\",\"Staff assistance available\",\"Near public transport\",\"Drop-off area near entrance\",\"Non-slip flooring\"]', '80-120 Pesos', '[\"Cash\",\"GCash\",\"Maya\"]'),
(51, 10, 'Taklad Resto Bar ', '', 'F42W+PP8 Daan Banua, Estancia, Iloilo', 11.45184587, 123.14693918, '', '', '', '', 'Pub / Bar & Grill', '#E85634', '', '', '', '', NULL, 8, '2025-11-23 12:37:47', '[]', '', '', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(52, 11, 'Stop Over Restaurant', 'Stop over restaurant and delicious food', 'Botongon, Estancia, Iloilo, Philippines', 11.44594649, 123.15282894, '09640877564', '{\"Monday\":{\"open\":\"08:00\",\"close\":\"00:00\",\"closed\":false},\"Tuesday\":{\"open\":\"08:00\",\"close\":\"00:00\",\"closed\":false},\"Wednesday\":{\"open\":\"08:00\",\"close\":\"00:00\",\"closed\":false},\"Thursday\":{\"open\":\"08:00\",\"close\":\"00:00\",\"closed\":false},\"Friday\":{\"open\":\"08:00\",\"close\":\"00:00\",\"closed\":false},\"Saturday\":{\"open\":\"08:00\",\"close\":\"00:00\",\"closed\":false},\"Sunday\":{\"open\":\"08:00\",\"close\":\"00:00\",\"closed\":false}}', '', 'https://web.facebook.com/profile.php?id=61575750282409', 'Family Style', '#E85634', 'Estancia Branch - Stopover Restaurant', 'images/restaurants/6977750a7acfb_617592913_122166290108858342_125984196519604831_n.jpg', 'images/restaurants/6977750a7c0a6_logo.jpg', 'Fish Fillet, Inasal, Binakol Native', NULL, 10, '2025-11-23 12:40:31', '[\"images\\/restaurants\\/6977750a7acfb_617592913_122166290108858342_125984196519604831_n.jpg\",\"images\\/restaurants\\/6977750a7b0ca_616841914_122166290714858342_6195133843616278033_n.jpg\",\"images\\/restaurants\\/6977750a7b43f_616941219_122166290846858342_551719206710717410_n.jpg\",\"images\\/restaurants\\/6977750a7b7d8_617599917_122166290624858342_2417569665843643147_n.jpg\",\"images\\/restaurants\\/6977750a7bb7e_617439639_122166290516858342_9054426954783108086_n.jpg\"]', '', '150', 'No', 'Yes', '[\"Dine-in\",\"Take-out\",\"Delivery\"]', 'Yes', '[\"Wheelchair accessible restroom\",\"Parking for persons with disabilities\",\"Drop-off area near entrance\"]', '215-600 Pesos', '[\"Cash\",\"GCash\"]'),
(53, 12, 'Letty\'s Seafood and Grill', 'Letty\'s Seafood and Grill is a local dining destination offering seafood Filipiino Favorite, and a welcoming venue for everyday dining ahd special ocassions', 'Bayuyan, Estancia, Iloilo, Philippines', 11.45831749, 123.14120156, '09815642518', '{\"Monday\":{\"open\":\"08:00\",\"close\":\"21:00\",\"closed\":false},\"Tuesday\":{\"open\":\"08:00\",\"close\":\"21:00\",\"closed\":false},\"Wednesday\":{\"open\":\"08:00\",\"close\":\"21:00\",\"closed\":false},\"Thursday\":{\"open\":\"08:00\",\"close\":\"21:00\",\"closed\":false},\"Friday\":{\"open\":\"08:00\",\"close\":\"21:00\",\"closed\":false},\"Saturday\":{\"open\":\"08:00\",\"close\":\"21:00\",\"closed\":false},\"Sunday\":{\"open\":\"08:00\",\"close\":\"21:00\",\"closed\":false}}', 'clynadones@gmail.com', 'https://web.facebook.com/lettysseafoodandgrill', 'Casual Dining', '#E85634', 'Letty’s seafood and grill. ', 'images/restaurants/6977781515781_472236939_1537507800287434_4626100562113329086_n.jpg', 'images/restaurants/69777815170ed_logo.jpg', 'Caldereta Kambing, , Native Chicken Binakol, Sanigang Isa (Lapu-Lapu, Tangigue)', NULL, 23, '2025-11-23 12:41:58', '[\"images\\/restaurants\\/6977781515781_472236939_1537507800287434_4626100562113329086_n.jpg\",\"images\\/restaurants\\/6977781515a6f_593481026_1381919620395177_5627059523614737147_n.jpg\",\"images\\/restaurants\\/6977781515dae_569514557_1348133143773825_5363576287029836218_n.jpg\",\"images\\/restaurants\\/6977781516133_571182686_1348133010440505_7681335640435216120_n.jpg\",\"images\\/restaurants\\/69777815166b0_587298013_1374634094457063_1413194961266359815_n.jpg\"]', '', '90-100', 'No', 'Limited', '[\"Dine-in\",\"Take-out\",\"Delivery\"]', 'No', '[\"Parking for persons with disabilities\",\"Staff assistance available\",\"Near public transport\",\"Drop-off area near entrance\"]', '200-500', '[\"Cash\",\"GCash\",\"Maya\",\"Bank Transfer\"]'),
(54, 13, 'Marinas Grill ', '', 'F44X+RF8, Estancia-Balasan Rd, Estancia, Iloilo', 11.45723017, 123.14860281, '', '', '', '', 'Casual Dining', '#E85634', '', '', '', '', NULL, 35, '2025-11-23 12:42:57', '[]', '', '', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(55, 14, 'Milagros Kitchenette ', '', 'F44X+RF8, Estancia-Balasan Rd, Estancia, Iloilo', 11.45885326, 123.15492295, '', '', '', '', 'Family Style', '#E85634', '', '', '', '', NULL, 5, '2025-11-23 12:44:01', '[]', '', '', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(56, 15, 'Cuddle\'s N Tea', '', 'Poblacion Zone II, Estancia, Iloilo, Philippines', 11.45661750, 123.14890661, '', '{\"Monday\":{\"closed\":true},\"Tuesday\":{\"closed\":true},\"Wednesday\":{\"closed\":true},\"Thursday\":{\"closed\":true},\"Friday\":{\"closed\":true},\"Saturday\":{\"closed\":true},\"Sunday\":{\"closed\":true}}', '', '', 'Café / Coffee Shop', '#E85634', '', '', '', '', NULL, 53, '2025-11-23 12:44:49', '[]', '', '', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(57, 16, 'Brew & Go ', '', 'Estancia, Iloilo', 11.44297087, 123.15105638, '09123456788', '', '', '', 'Café / Coffee Shop', '#E85634', '', '', '', '', NULL, 5, '2025-11-23 12:45:36', '[]', '', '', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(58, 17, 'Papol\'s Seafood Grill and Restaurant', '', 'Tacbuyan, Estancia, Iloilo, Philippines', 11.46509467, 123.14583080, '', '{\"Monday\":{\"open\":\"08:00\",\"close\":\"21:00\",\"closed\":false},\"Tuesday\":{\"open\":\"08:00\",\"close\":\"21:00\",\"closed\":false},\"Wednesday\":{\"open\":\"08:00\",\"close\":\"21:00\",\"closed\":false},\"Thursday\":{\"open\":\"08:00\",\"close\":\"21:00\",\"closed\":false},\"Friday\":{\"open\":\"08:00\",\"close\":\"21:00\",\"closed\":false},\"Saturday\":{\"open\":\"08:00\",\"close\":\"21:00\",\"closed\":false},\"Sunday\":{\"open\":\"08:00\",\"close\":\"21:00\",\"closed\":false}}', '', '', 'Café / Coffee Shop', '#E85634', '', '', '', '', NULL, 74, '2025-11-23 12:47:42', '[]', '', '', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(59, 18, 'Pizza Ocho', '', 'Bulaqueña, Estancia, Iloilo, Philippines', 11.45863456, 123.15385116, '', '{\"Monday\":{\"closed\":true},\"Tuesday\":{\"closed\":true},\"Wednesday\":{\"closed\":true},\"Thursday\":{\"closed\":true},\"Friday\":{\"closed\":true},\"Saturday\":{\"closed\":true},\"Sunday\":{\"closed\":true}}', '', '', 'Fast Food', '#E85634', '', '', '', '', NULL, 61, '2025-11-23 12:48:42', '[]', '', '', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(68, 19, 'Timplahan Espresso Bar', 'Coffee shop offering variety of lattes and classic coffe blends, designed for to-go orders for it is situated along national road.', 'Somes Street Poblacion Zone II, Estancia, Iloilo, Philippines', 11.45573803, 123.15140303, '09995307377', '{\"Monday\":{\"open\":\"09:00\",\"close\":\"20:00\",\"closed\":false},\"Tuesday\":{\"open\":\"09:00\",\"close\":\"20:00\",\"closed\":false},\"Wednesday\":{\"open\":\"09:00\",\"close\":\"20:00\",\"closed\":false},\"Thursday\":{\"open\":\"09:00\",\"close\":\"20:00\",\"closed\":false},\"Friday\":{\"open\":\"09:00\",\"close\":\"20:00\",\"closed\":false},\"Saturday\":{\"open\":\"09:00\",\"close\":\"20:00\",\"closed\":false},\"Sunday\":{\"open\":\"09:00\",\"close\":\"20:00\",\"closed\":false}}', 'capsd2095@gmail.com', 'https://web.facebook.com/profile.php?id=61582094433626&sk=photos', 'Café / Coffee Shop', '#E85634', 'timplahan.est ', 'images/restaurants/69777c704eb6b_587307175_122109739227069814_2567130534777514811_n.jpg', '', 'Matcha Latte, Spanish Latte, Cappuccino', NULL, 46, '2026-01-26 14:38:40', '[\"images\\/restaurants\\/69777c704eb6b_587307175_122109739227069814_2567130534777514811_n.jpg\",\"images\\/restaurants\\/69777c704ee08_586250078_122109739299069814_3844133460964589021_n.jpg\",\"images\\/restaurants\\/69777c70536fc_588019729_122109739377069814_2326275201154323513_n.jpg\",\"images\\/restaurants\\/69777c7053a0b_588581099_122109739239069814_6688374899760345361_n.jpg\",\"images\\/restaurants\\/69777c7053d7a_588557144_122109739389069814_1878536257899951783_n.jpg\"]', '', '8', 'No', 'Yes', '[\"Dine-in\",\"Take-out\"]', 'Yes', '[\"Near public transport\",\"Drop-off area near entrance\"]', NULL, '[\"Cash\",\"GCash\"]'),
(79, 20, 'Dak\'sside café ', '', 'Poblacion Zone II, Estancia, Iloilo, Philippines', 11.45687034, 123.14954653, '09123456788', '{\"Monday\":{\"open\":\"09:00\",\"close\":\"18:00\",\"closed\":false},\"Tuesday\":{\"open\":\"09:00\",\"close\":\"18:00\",\"closed\":false},\"Wednesday\":{\"open\":\"09:00\",\"close\":\"18:00\",\"closed\":false},\"Thursday\":{\"open\":\"09:00\",\"close\":\"18:00\",\"closed\":false},\"Friday\":{\"open\":\"09:00\",\"close\":\"18:00\",\"closed\":false},\"Saturday\":{\"open\":\"09:00\",\"close\":\"18:00\",\"closed\":false},\"Sunday\":{\"open\":\"09:00\",\"close\":\"18:00\",\"closed\":false}}', '', 'https://www.facebook.com/profile.php?id=61579929621695&sk=photos', 'Café / Coffee Shop', '#E85634', 'Dak\'sside café ', 'images/restaurants/69856af52850b_550224909_122109365792997654_7037933339502005836_n.jpg', '', '', NULL, 27, '2026-02-06 04:07:55', '[\"images\\/restaurants\\/69856af52850b_550224909_122109365792997654_7037933339502005836_n.jpg\",\"images\\/restaurants\\/69856af528987_549476654_122109365906997654_4114313973537362664_n.jpg\",\"images\\/restaurants\\/69856af528ce5_549789481_122109365948997654_4148329110318780637_n.jpg\",\"images\\/restaurants\\/69856af529033_601918893_122123365730997654_521451301579317187_n.jpg\",\"images\\/restaurants\\/69856af529359_605292735_122123365610997654_7258190296379417862_n.jpg\"]', '', '40', 'No', 'None', '[\"Dine-in\",\"Take-out\"]', 'No', '[\"Near public transport\",\"Drop-off area near entrance\",\"Non-slip flooring\"]', '40-155 Pesos', '[\"Cash\",\"GCash\",\"Bank Transfer\"]'),
(80, 21, 'kentts', '', 'Bayuyan, Estancia, Iloilo, Philippines', 11.45937200, 123.14430419, '', '{\"Monday\":{\"closed\":true},\"Tuesday\":{\"closed\":true},\"Wednesday\":{\"closed\":true},\"Thursday\":{\"closed\":true},\"Friday\":{\"closed\":true},\"Saturday\":{\"closed\":true},\"Sunday\":{\"closed\":true}}', '', '', 'Fast Food', '#E85634', '', '', '', '', '[{\"category\":\"Appetizers\",\"name\":\"erwerwe\",\"price\":\"34\"},{\"category\":\"Salads\",\"name\":\"adobo\",\"price\":\"23\"}]', 30, '2026-02-16 07:58:27', '[]', '[\"images\\/restaurants\\/69ad062912896_menu.webp\",\"images\\/restaurants\\/69ad062912f22_menu.webp\",\"images\\/restaurants\\/69ad06291347b_menu.jpg\",\"images\\/restaurants\\/69ad0629138b7_menu.png\"]', '', NULL, NULL, NULL, NULL, NULL, NULL, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `restaurant_changes`
--

CREATE TABLE `restaurant_changes` (
  `id` int(11) NOT NULL,
  `restaurant_id` int(11) NOT NULL,
  `owner_id` int(11) NOT NULL,
  `changes_json` longtext NOT NULL COMMENT 'JSON object with field=>new_value pairs',
  `status` enum('pending','approved','rejected') DEFAULT 'pending',
  `admin_notes` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `reviewed_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `restaurant_changes`
--

INSERT INTO `restaurant_changes` (`id`, `restaurant_id`, `owner_id`, `changes_json`, `status`, `admin_notes`, `created_at`, `reviewed_at`) VALUES
(2, 41, 2, '{\"name\":\"Domingo\'s Grill and Resto Barrr\",\"hours\":\"{\\\"Monday\\\":{\\\"open\\\":\\\"\\\",\\\"close\\\":\\\"\\\",\\\"closed\\\":false},\\\"Tuesday\\\":{\\\"open\\\":\\\"\\\",\\\"close\\\":\\\"\\\",\\\"closed\\\":false},\\\"Wednesday\\\":{\\\"open\\\":\\\"\\\",\\\"close\\\":\\\"\\\",\\\"closed\\\":false},\\\"Thursday\\\":{\\\"open\\\":\\\"\\\",\\\"close\\\":\\\"\\\",\\\"closed\\\":false},\\\"Friday\\\":{\\\"open\\\":\\\"\\\",\\\"close\\\":\\\"\\\",\\\"closed\\\":false},\\\"Saturday\\\":{\\\"open\\\":\\\"\\\",\\\"close\\\":\\\"\\\",\\\"closed\\\":false},\\\"Sunday\\\":{\\\"open\\\":\\\"\\\",\\\"close\\\":\\\"\\\",\\\"closed\\\":false}}\"}', 'rejected', '', '2026-02-16 03:02:16', '2026-02-16 03:03:10'),
(3, 41, 2, '{\"hours\":\"{\\\"Monday\\\":{\\\"open\\\":\\\"\\\",\\\"close\\\":\\\"\\\",\\\"closed\\\":false},\\\"Tuesday\\\":{\\\"open\\\":\\\"\\\",\\\"close\\\":\\\"\\\",\\\"closed\\\":false},\\\"Wednesday\\\":{\\\"open\\\":\\\"\\\",\\\"close\\\":\\\"\\\",\\\"closed\\\":false},\\\"Thursday\\\":{\\\"open\\\":\\\"\\\",\\\"close\\\":\\\"\\\",\\\"closed\\\":false},\\\"Friday\\\":{\\\"open\\\":\\\"\\\",\\\"close\\\":\\\"\\\",\\\"closed\\\":false},\\\"Saturday\\\":{\\\"open\\\":\\\"\\\",\\\"close\\\":\\\"\\\",\\\"closed\\\":false},\\\"Sunday\\\":{\\\"open\\\":\\\"\\\",\\\"close\\\":\\\"\\\",\\\"closed\\\":false}}\"}', 'rejected', '', '2026-02-16 04:37:26', '2026-02-16 04:37:44'),
(4, 52, 11, '{\"name\":\"Stop Over Restaurantt\"}', 'rejected', 'skffkskfjshdsdf', '2026-02-16 07:05:55', '2026-02-16 07:06:48'),
(5, 52, 11, '{\"name\":\"Stop Over Restaurantt\"}', 'approved', 'oki', '2026-02-16 07:08:07', '2026-02-16 07:09:00'),
(6, 52, 11, '{\"name\":\"Stop Over Restaurant\"}', 'rejected', '', '2026-02-16 07:10:15', '2026-02-16 07:32:13'),
(7, 52, 11, '{\"menu_image\":\"[\\\"images\\\\\\/restaurants\\\\\\/owner_menu_6992c82711b519.20213584.png\\\"]\",\"__new_menu_images\":[\"images\\/restaurants\\/owner_menu_6992c82711b519.20213584.png\"]}', 'rejected', '', '2026-02-16 07:32:55', '2026-02-16 07:36:47'),
(8, 52, 11, '{\"name\":\"Stop Over Restaurantt2\",\"description\":\"Stop over restaurant and delicious food22\",\"address\":\"Botongon, Estancia, Iloilo, Philippines`11\",\"facebook_name\":\"Estancia Branch - Stopover Restaurant1\",\"facebook_page\":\"https:\\/\\/web.facebook.com\\/profile.php?id=615757502824091\",\"menu_items\":\"Fish Fillet, Inasal, Binakol Native11\",\"price_range\":\"215-600 Pesos11\",\"seating_capacity\":\"1501\",\"category\":\"Casual Dining\",\"reservation_needed\":\"Yes\",\"parking_availability\":\"Limited\",\"wifi_availability\":\"No\",\"payment_methods\":\"[\\\"Cash\\\",\\\"Credit\\/Debit Card\\\",\\\"GCash\\\",\\\"Maya\\\"]\",\"delivery_options\":\"[\\\"Dine-in\\\",\\\"Delivery\\\"]\",\"accessibility\":\"[\\\"Wheelchair accessible entrance\\\",\\\"Wheelchair accessible seating\\\",\\\"Wheelchair accessible restroom\\\",\\\"Ramp available\\\",\\\"Parking for persons with disabilities\\\",\\\"Braille menu or signage\\\",\\\"Staff assistance available\\\",\\\"High chair or child seat available\\\",\\\"Near public transport\\\",\\\"Drop-off area near entrance\\\",\\\"Non-slip flooring\\\"]\",\"hours\":\"{\\\"Monday\\\":{\\\"open\\\":\\\"08:00\\\",\\\"close\\\":\\\"00:00\\\",\\\"closed\\\":true},\\\"Tuesday\\\":{\\\"open\\\":\\\"08:00\\\",\\\"close\\\":\\\"00:00\\\",\\\"closed\\\":false},\\\"Wednesday\\\":{\\\"open\\\":\\\"08:00\\\",\\\"close\\\":\\\"00:00\\\",\\\"closed\\\":true},\\\"Thursday\\\":{\\\"open\\\":\\\"08:00\\\",\\\"close\\\":\\\"00:00\\\",\\\"closed\\\":false},\\\"Friday\\\":{\\\"open\\\":\\\"08:00\\\",\\\"close\\\":\\\"00:00\\\",\\\"closed\\\":false},\\\"Saturday\\\":{\\\"open\\\":\\\"08:00\\\",\\\"close\\\":\\\"00:00\\\",\\\"closed\\\":true},\\\"Sunday\\\":{\\\"open\\\":\\\"08:00\\\",\\\"close\\\":\\\"00:00\\\",\\\"closed\\\":false}}\",\"image_paths\":[\"images\\/restaurants\\/owner_img_6992c98031a4f7.82797815.png\",\"images\\/restaurants\\/owner_img_6992c980323d11.42288699.png\",\"images\\/restaurants\\/owner_img_6992c980329c11.64495539.jpg\",\"images\\/restaurants\\/owner_img_6992c98032ec75.27112297.jpg\",\"images\\/restaurants\\/owner_img_6992c980331382.74737416.jpg\"],\"menu_image\":\"[\\\"images\\\\\\/restaurants\\\\\\/owner_menu_6992c980333342.34499132.png\\\"]\",\"logo\":\"images\\/restaurants\\/owner_logo_6992c980336201.11214930.jpg\",\"__new_image_paths\":[\"images\\/restaurants\\/owner_img_6992c98031a4f7.82797815.png\",\"images\\/restaurants\\/owner_img_6992c980323d11.42288699.png\",\"images\\/restaurants\\/owner_img_6992c980329c11.64495539.jpg\",\"images\\/restaurants\\/owner_img_6992c98032ec75.27112297.jpg\",\"images\\/restaurants\\/owner_img_6992c980331382.74737416.jpg\"],\"__removed_image_paths\":[\"images\\/restaurants\\/6977750a7acfb_617592913_122166290108858342_125984196519604831_n.jpg\",\"images\\/restaurants\\/6977750a7b0ca_616841914_122166290714858342_6195133843616278033_n.jpg\",\"images\\/restaurants\\/6977750a7b43f_616941219_122166290846858342_551719206710717410_n.jpg\",\"images\\/restaurants\\/6977750a7b7d8_617599917_122166290624858342_2417569665843643147_n.jpg\",\"images\\/restaurants\\/6977750a7bb7e_617439639_122166290516858342_9054426954783108086_n.jpg\"],\"__new_menu_images\":[\"images\\/restaurants\\/owner_menu_6992c980333342.34499132.png\"],\"__new_logo\":\"images\\/restaurants\\/owner_logo_6992c980336201.11214930.jpg\"}', 'rejected', '', '2026-02-16 07:38:40', '2026-02-16 08:21:29'),
(14, 80, 21, '{\"name\":\"kent\"}', 'approved', '', '2026-02-17 05:44:25', '2026-02-17 05:44:43'),
(15, 80, 21, '{\"name\":\"kentts\"}', 'approved', '', '2026-02-17 05:50:20', '2026-02-17 05:52:23'),
(16, 80, 21, '{\"name\":\"kent5\"}', 'rejected', '', '2026-02-17 05:53:46', '2026-02-17 05:53:59'),
(28, 79, 20, '{\"address\":\"Pa-On, Estancia, Iloilo, Philippines\",\"latitude\":\"11.463382080440155\",\"longitude\":\"123.15290689592223\",\"attachments\":\"[\\\"images\\\\\\/attachments\\\\\\/owner_attach_69ae8924f35827.04834914.jpg\\\"]\"}', 'rejected', '', '2026-03-09 08:47:32', '2026-03-09 08:52:04'),
(29, 79, 20, '{\"category\":\"Casual Dining\",\"attachments\":\"[\\\"images\\\\\\/attachments\\\\\\/owner_attach_69ae8a3f6284e3.88849236.docx\\\"]\"}', 'rejected', '', '2026-03-09 08:52:15', '2026-03-09 09:06:17'),
(30, 79, 20, '{\"latitude\":\"11.457036778289904\",\"longitude\":\"123.14792352976065\",\"attachments\":\"[\\\"images\\\\\\/attachments\\\\\\/owner_attach_69ae8d9cce7d74.26478726.docx\\\",\\\"images\\\\\\/attachments\\\\\\/owner_attach_69ae8d9ccea882.39213381.jpg\\\"]\"}', 'rejected', '', '2026-03-09 09:06:36', '2026-03-09 09:10:36'),
(31, 79, 20, '{\"name\":\"Dak\'sside caf\\u00e9 1\",\"description\":\"11\",\"address\":\"Iloilo, Philippines\",\"phone\":\"09123456781\",\"email\":\"kentargie.belga16@gmail.com\",\"facebook_name\":\"Dak\'sside caf\\u00e9 1\",\"facebook_page\":\"https:\\/\\/www.facebook.com\\/profile.php?id=615799296211695&sk=photos\",\"menu_items\":\"12121121\",\"price_range\":\"40-155 Pesos2121212\",\"seating_capacity\":\"40121\",\"latitude\":\"11.438003668489173\",\"longitude\":\"123.17097345660454\",\"reservation_needed\":\"Yes\",\"parking_availability\":\"Limited\",\"wifi_availability\":\"Yes\",\"payment_methods\":\"[\\\"Cash\\\",\\\"Credit\\/Debit Card\\\",\\\"GCash\\\",\\\"Maya\\\",\\\"Bank Transfer\\\"]\",\"delivery_options\":\"[\\\"Dine-in\\\",\\\"Take-out\\\",\\\"Delivery\\\"]\",\"accessibility\":\"[\\\"Wheelchair accessible entrance\\\",\\\"Wheelchair accessible seating\\\",\\\"Wheelchair accessible restroom\\\",\\\"Ramp available\\\",\\\"Parking for persons with disabilities\\\",\\\"Braille menu or signage\\\",\\\"Staff assistance available\\\",\\\"High chair or child seat available\\\",\\\"Near public transport\\\",\\\"Drop-off area near entrance\\\",\\\"Non-slip flooring\\\"]\",\"hours\":\"{\\\"Monday\\\":{\\\"open\\\":\\\"02:00\\\",\\\"close\\\":\\\"14:01\\\",\\\"closed\\\":false},\\\"Tuesday\\\":{\\\"open\\\":\\\"00:00\\\",\\\"close\\\":\\\"12:01\\\",\\\"closed\\\":false},\\\"Wednesday\\\":{\\\"open\\\":\\\"00:01\\\",\\\"close\\\":\\\"14:01\\\",\\\"closed\\\":false},\\\"Thursday\\\":{\\\"open\\\":\\\"02:01\\\",\\\"close\\\":\\\"12:01\\\",\\\"closed\\\":false},\\\"Friday\\\":{\\\"open\\\":\\\"02:01\\\",\\\"close\\\":\\\"14:01\\\",\\\"closed\\\":false},\\\"Saturday\\\":{\\\"open\\\":\\\"00:00\\\",\\\"close\\\":\\\"14:01\\\",\\\"closed\\\":false},\\\"Sunday\\\":{\\\"open\\\":\\\"09:00\\\",\\\"close\\\":\\\"18:00\\\",\\\"closed\\\":false}}\",\"full_menu\":\"[{\\\"category\\\":\\\"Soups\\\",\\\"name\\\":\\\"2121212\\\",\\\"price\\\":\\\"212121\\\"}]\",\"image_paths\":[\"images\\/restaurants\\/69856af52850b_550224909_122109365792997654_7037933339502005836_n.jpg\",\"images\\/restaurants\\/69856af528ce5_549789481_122109365948997654_4148329110318780637_n.jpg\",\"images\\/restaurants\\/69856af529033_601918893_122123365730997654_521451301579317187_n.jpg\",\"images\\/restaurants\\/69856af529359_605292735_122123365610997654_7258190296379417862_n.jpg\",\"images\\/restaurants\\/owner_img_69ae8ef66c0a45.62010589.webp\"],\"logo\":\"images\\/restaurants\\/owner_logo_69ae8ef66c4677.82015167.webp\",\"__new_image_paths\":[\"images\\/restaurants\\/owner_img_69ae8ef66c0a45.62010589.webp\"],\"__removed_image_paths\":[\"images\\/restaurants\\/69856af528987_549476654_122109365906997654_4114313973537362664_n.jpg\"],\"__new_logo\":\"images\\/restaurants\\/owner_logo_69ae8ef66c4677.82015167.webp\",\"attachments\":\"[\\\"images\\\\\\/attachments\\\\\\/owner_attach_69ae8ef66c7ae5.39020569.jpg\\\",\\\"images\\\\\\/attachments\\\\\\/owner_attach_69ae8ef66c9c42.57817979.docx\\\",\\\"images\\\\\\/attachments\\\\\\/owner_attach_69ae8ef66f8e60.51959655.sql\\\",\\\"images\\\\\\/attachments\\\\\\/owner_attach_69ae8ef6708090.53488701.csv\\\",\\\"images\\\\\\/attachments\\\\\\/owner_attach_69ae8ef670b060.49903525.pptx\\\"]\"}', 'rejected', '', '2026-03-09 09:12:22', '2026-03-09 09:14:00');

-- --------------------------------------------------------

--
-- Table structure for table `restaurant_distances`
--

CREATE TABLE `restaurant_distances` (
  `id` int(11) NOT NULL,
  `session_id` varchar(100) NOT NULL,
  `restaurant_id` int(11) NOT NULL,
  `distance_km` decimal(10,2) NOT NULL,
  `duration_minutes` decimal(10,1) DEFAULT NULL,
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `restaurant_ratings`
--

CREATE TABLE `restaurant_ratings` (
  `id` int(11) NOT NULL,
  `restaurant_id` int(11) NOT NULL,
  `rating` int(1) NOT NULL,
  `reviewer_name` varchar(100) NOT NULL,
  `comment` text NOT NULL,
  `profile_picture` varchar(500) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `restaurant_ratings`
--

INSERT INTO `restaurant_ratings` (`id`, `restaurant_id`, `rating`, `reviewer_name`, `comment`, `profile_picture`, `created_at`) VALUES
(42, 46, 5, 'Kent Argie Belga', 'I love the red velvet cake', 'https://lh3.googleusercontent.com/a/ACg8ocI8FvJiJh094JdfK5_TFoZXPLIGjFHjbIRmWN0yNELaYN-ecA=s96-c', '2025-11-25 23:48:43'),
(43, 46, 4, 'Kent Argie Belga', 'i like the food', 'https://lh3.googleusercontent.com/a/ACg8ocI8FvJiJh094JdfK5_TFoZXPLIGjFHjbIRmWN0yNELaYN-ecA=s96-c', '2025-11-26 16:27:26'),
(44, 46, 3, 'Kent Argie Belga', 'hdfgfhfghfghhfgfgh', 'https://lh3.googleusercontent.com/a/ACg8ocI8FvJiJh094JdfK5_TFoZXPLIGjFHjbIRmWN0yNELaYN-ecA=s96-c', '2025-12-24 10:13:01'),
(45, 46, 5, 'Kent Argie Belga', 'llmnmk', 'https://lh3.googleusercontent.com/a/ACg8ocI8FvJiJh094JdfK5_TFoZXPLIGjFHjbIRmWN0yNELaYN-ecA=s96-c', '2025-12-31 13:22:21'),
(46, 46, 5, 'Kent Argie Belga', 'asdsdadsad', 'https://lh3.googleusercontent.com/a/ACg8ocI8FvJiJh094JdfK5_TFoZXPLIGjFHjbIRmWN0yNELaYN-ecA=s96-c', '2026-01-15 10:49:36'),
(47, 46, 5, 'Kent Argie Belga', 'adadasdasdasd', 'https://lh3.googleusercontent.com/a/ACg8ocI8FvJiJh094JdfK5_TFoZXPLIGjFHjbIRmWN0yNELaYN-ecA=s96-c', '2026-01-15 10:49:44'),
(48, 46, 1, 'Kent Argie Belga', 'adasd', 'https://lh3.googleusercontent.com/a/ACg8ocI8FvJiJh094JdfK5_TFoZXPLIGjFHjbIRmWN0yNELaYN-ecA=s96-c', '2026-01-15 10:50:00'),
(49, 46, 1, 'Kent Argie Belga', 'sadsadasd', 'https://lh3.googleusercontent.com/a/ACg8ocI8FvJiJh094JdfK5_TFoZXPLIGjFHjbIRmWN0yNELaYN-ecA=s96-c', '2026-01-15 10:50:06'),
(50, 46, 1, 'Kent Argie Belga', 'asdadasd', 'https://lh3.googleusercontent.com/a/ACg8ocI8FvJiJh094JdfK5_TFoZXPLIGjFHjbIRmWN0yNELaYN-ecA=s96-c', '2026-01-15 10:50:16'),
(52, 56, 4, 'Kent Argie Belga', 'oe4u5onweriwnehkuet', 'https://lh3.googleusercontent.com/a/ACg8ocI8FvJiJh094JdfK5_TFoZXPLIGjFHjbIRmWN0yNELaYN-ecA=s96-c', '2026-01-27 13:48:15'),
(53, 56, 5, 'Kent Bachiller', 'ey yo', 'https://lh3.googleusercontent.com/a/ACg8ocJ5ONFeuhwLCS_2TpOoSifqXebqT37cZitlFnZeyCqAsWGSsAo=s96-c', '2026-03-06 07:52:12');

-- --------------------------------------------------------

--
-- Table structure for table `restaurant_tokens`
--

CREATE TABLE `restaurant_tokens` (
  `id` int(11) NOT NULL,
  `restaurant_id` int(11) NOT NULL,
  `token` varchar(255) NOT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `expires_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `review_reports`
--

CREATE TABLE `review_reports` (
  `id` int(11) NOT NULL,
  `review_id` int(11) NOT NULL,
  `restaurant_id` int(11) NOT NULL,
  `reporter_name` varchar(255) DEFAULT 'Anonymous',
  `reporter_email` varchar(255) DEFAULT NULL,
  `reporter_ip` varchar(50) DEFAULT NULL,
  `reason` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `status` enum('pending','reviewed','resolved','dismissed') DEFAULT 'pending'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `review_reports`
--

INSERT INTO `review_reports` (`id`, `review_id`, `restaurant_id`, `reporter_name`, `reporter_email`, `reporter_ip`, `reason`, `description`, `created_at`, `updated_at`, `status`) VALUES
(23, 42, 46, 'Anonymous', NULL, '192.168.1.14', 'asfsfsdfsfsfsdf', NULL, '2025-12-24 10:31:07', '2025-12-24 02:48:14', 'dismissed'),
(25, 50, 46, 'Anonymous', NULL, '::1', 'lala', NULL, '2026-01-29 21:06:15', '2026-01-29 13:06:15', 'pending'),
(26, 49, 46, 'Anonymous', NULL, '::1', 'troll', NULL, '2026-01-29 21:06:56', '2026-01-29 13:06:56', 'pending'),
(27, 48, 46, 'Anonymous', NULL, '::1', 'irrelevant', NULL, '2026-01-29 21:07:05', '2026-01-29 13:07:05', 'pending'),
(28, 50, 46, 'Anonymous', NULL, '::1', 'laeihf ksdngjdgakjfgsjdfgdhj', NULL, '2026-02-11 20:24:10', '2026-02-11 12:24:10', 'pending'),
(29, 52, 56, 'Anonymous', NULL, '::1', '1212', NULL, '2026-03-06 07:52:19', '2026-03-05 23:52:19', 'pending');

-- --------------------------------------------------------

--
-- Table structure for table `searches`
--

CREATE TABLE `searches` (
  `id` int(11) NOT NULL,
  `search_term` varchar(255) DEFAULT NULL,
  `search_count` int(11) DEFAULT 1,
  `searched_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `searches`
--

INSERT INTO `searches` (`id`, `search_term`, `search_count`, `searched_at`) VALUES
(1, 'adobo', 370, '2025-09-29 14:11:17'),
(2, 'for baby', 8, '2025-10-03 13:21:17'),
(3, 'batchoy', 8, '2025-10-03 13:21:22'),
(4, 'tinola', 4, '2025-10-03 13:21:31'),
(5, 'fried chicken', 2, '2025-10-03 13:21:41'),
(6, 'Fried chicken a', 2, '2025-10-03 13:23:57'),
(7, 'Mechado', 4, '2025-10-03 13:24:07'),
(8, 'Adovo', 8, '2025-10-03 13:24:11'),
(9, 'loha', 6, '2025-10-03 14:45:53'),
(10, 'lansang', 12, '2025-10-04 05:40:25'),
(11, 'ba', 2, '2025-10-04 06:52:36'),
(12, 'binagoongan', 4, '2025-10-04 07:07:19'),
(13, 'kent', 62, '2025-10-04 07:07:32'),
(14, 'bagooongan', 6, '2025-10-04 07:08:36'),
(15, 'lugaw', 2, '2025-10-04 07:56:53'),
(16, 'uy ewvwer', 2, '2025-10-04 09:25:11'),
(17, 'NIGER', 12, '2025-10-05 03:29:41'),
(18, 'cafe', 126, '2025-10-05 10:29:54'),
(19, 'lettys', 2, '2025-10-06 02:06:06'),
(20, 'letty\'s', 2, '2025-10-06 02:06:13'),
(21, 'kantunan', 4, '2025-10-06 02:34:33'),
(22, 'ke', 6, '2025-10-06 04:28:13'),
(23, 'kekeke', 78, '2025-10-06 07:07:42'),
(24, 'keke', 54, '2025-10-06 07:16:14'),
(25, 'KEKKE', 2, '2025-10-07 03:04:43'),
(26, 'ekke', 2, '2025-10-07 04:38:28'),
(27, 'ekekek', 2, '2025-10-07 12:02:35'),
(28, 'kke', 2, '2025-10-07 12:13:12'),
(29, 'Niga', 30, '2025-10-07 15:45:24'),
(30, 'dinosaur', 4, '2025-10-13 11:23:55'),
(31, 'krldg', 2, '2025-10-13 11:24:08'),
(32, 'alsdkjfsdhlf', 2, '2025-10-18 02:15:55'),
(33, 'kentt]', 2, '2025-10-19 04:57:03'),
(34, 'Niggwr', 2, '2025-10-19 06:13:36'),
(35, 'Nigger', 8, '2025-10-19 06:14:05'),
(36, 'ken', 6, '2025-10-19 15:20:57'),
(37, 'wwerwrwer', 2, '2025-10-19 16:26:33'),
(38, 'afdobo', 2, '2025-10-22 14:35:03'),
(39, 'Adob', 2, '2025-10-22 16:40:13'),
(40, 'Adobk', 2, '2025-10-23 13:02:50'),
(41, 'Adoco', 2, '2025-10-23 13:15:38'),
(42, 'letty', 8, '2025-10-26 14:21:51'),
(43, 'Kent Bachiller', 2, '2025-10-29 15:45:26'),
(44, 'Mama Litas Adobo House', 4, '2025-10-29 16:48:26'),
(45, '@kent', 2, '2025-11-01 01:10:34'),
(46, 'Bakal', 2, '2025-11-01 02:20:35'),
(47, 'cantonan', 4, '2025-11-01 14:19:45'),
(48, 'kents', 6, '2025-11-03 08:44:38'),
(49, 'bachiller', 4, '2025-11-09 04:54:10'),
(50, 'ers', 6, '2025-11-09 05:54:12'),
(51, 'APRIL', 6, '2025-11-09 08:20:38'),
(52, 'Kent Bachiller3', 2, '2025-11-09 08:28:30'),
(53, '3', 6, '2025-11-09 08:39:40'),
(54, '4', 2, '2025-11-09 09:22:19'),
(55, 'fine dining', 6, '2025-11-09 09:28:47'),
(56, 'lala', 12, '2025-11-10 01:51:21'),
(57, 'sese', 2, '2025-11-10 01:53:28'),
(58, 'MEME', 4, '2025-11-10 03:53:21'),
(59, 'mama', 10, '2025-11-10 04:50:04'),
(60, 'AdobonsjdjjjddjsjsjsjdjdjdjdjddjdjdjdjdjdjdjFamous', 2, '2025-11-10 05:48:01'),
(61, 'Adobo, siniganf', 2, '2025-11-10 07:07:57'),
(62, 'Adobo, sinigang', 2, '2025-11-10 07:08:01'),
(63, 'Sinigang', 2, '2025-11-10 07:08:07'),
(64, 'fine', 2, '2025-11-10 07:34:54'),
(65, 'wrwerwerrr', 4, '2025-11-16 13:30:48'),
(66, 'manay', 6, '2025-11-16 14:30:28'),
(67, 'BREW', 2, '2025-11-23 12:46:09'),
(68, 'CUDDL\'A', 4, '2025-11-23 12:46:37'),
(69, 'CUDDL\'S', 2, '2025-11-23 12:46:40'),
(70, 'CUDLES', 2, '2025-11-23 12:46:44'),
(71, 'CUDDLE\'S', 2, '2025-11-23 12:46:59'),
(72, 'AMARAS', 16, '2025-11-23 12:49:09'),
(73, 'coffe', 2, '2025-11-23 12:53:56'),
(74, 'anteku', 2, '2025-11-23 12:56:48'),
(75, 'anteiku', 8, '2025-11-23 12:56:52'),
(76, 'wawa', 4, '2025-11-23 13:01:47'),
(77, 'ende', 2, '2025-11-23 13:02:05'),
(78, 'endie', 2, '2025-11-23 13:02:07'),
(79, 'ant', 2, '2025-11-24 03:14:32'),
(80, 'coffee', 4, '2025-11-25 15:47:04'),
(81, 'toledos', 14, '2025-12-24 01:45:17'),
(82, 'ADASDASDA', 2, '2025-12-24 06:07:59'),
(83, 'REWEWRWER', 2, '2025-12-24 06:09:26'),
(84, 'anteiky', 2, '2025-12-24 06:12:12'),
(85, 'cafe anteiku', 4, '2026-01-22 12:54:39'),
(86, 'yey', 2, '2026-01-22 15:50:18'),
(87, 'amara', 6, '2026-01-23 03:07:52'),
(88, 'popol', 2, '2026-01-23 11:36:07'),
(89, 'papols', 4, '2026-01-23 11:36:15'),
(90, 'papol\'s', 8, '2026-01-23 11:36:21'),
(91, 'papol', 2, '2026-01-24 02:43:40'),
(92, 'adasdsda', 2, '2026-01-26 12:02:23'),
(93, 'adasdsdaasdasdasd', 2, '2026-01-26 12:02:26'),
(94, 'adasdsdaasdasdasdasdas', 10, '2026-01-26 12:02:27'),
(95, 'endielinas', 2, '2026-01-26 15:05:32'),
(96, 'endielina', 6, '2026-01-26 15:05:35'),
(97, 'toledos\'s', 8, '2026-01-27 04:20:13'),
(98, 'toledo', 2, '2026-01-27 04:20:22'),
(99, 'insal', 2, '2026-01-27 04:20:37'),
(100, 'inasal', 14, '2026-01-27 04:20:43'),
(101, 'inasa', 4, '2026-01-27 05:41:29'),
(102, 'adobo\'', 2, '2026-01-28 06:11:40'),
(103, 'stop over', 2, '2026-01-31 14:27:50'),
(104, 'casual dining', 2, '2026-02-17 12:15:54'),
(105, 'Nznsnxnxnxnnndnxnxndn', 4, '2026-03-04 06:11:15'),
(106, 'resfsdf', 10, '2026-03-08 05:18:14'),
(107, 'fast food', 2, '2026-03-08 06:22:53'),
(108, 'erwerwe', 2, '2026-03-08 06:37:28'),
(109, 'domingo', 2, '2026-03-09 14:00:59');

-- --------------------------------------------------------

--
-- Table structure for table `user_location_cache`
--

CREATE TABLE `user_location_cache` (
  `id` int(11) NOT NULL,
  `session_id` varchar(100) NOT NULL,
  `latitude` decimal(10,8) NOT NULL,
  `longitude` decimal(11,8) NOT NULL,
  `address` varchar(500) DEFAULT NULL,
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `admin_users`
--
ALTER TABLE `admin_users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `username` (`username`);

--
-- Indexes for table `chat_history`
--
ALTER TABLE `chat_history`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `owners`
--
ALTER TABLE `owners`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`);

--
-- Indexes for table `owner_notifications`
--
ALTER TABLE `owner_notifications`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_owner_id` (`owner_id`),
  ADD KEY `idx_is_read` (`is_read`);

--
-- Indexes for table `restaurants`
--
ALTER TABLE `restaurants`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_restaurants_owner` (`owner_id`);

--
-- Indexes for table `restaurant_changes`
--
ALTER TABLE `restaurant_changes`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_restaurant_id` (`restaurant_id`),
  ADD KEY `idx_owner_id` (`owner_id`),
  ADD KEY `idx_status` (`status`);

--
-- Indexes for table `restaurant_distances`
--
ALTER TABLE `restaurant_distances`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `session_restaurant` (`session_id`,`restaurant_id`),
  ADD KEY `fk_dist_restaurant` (`restaurant_id`);

--
-- Indexes for table `restaurant_ratings`
--
ALTER TABLE `restaurant_ratings`
  ADD PRIMARY KEY (`id`),
  ADD KEY `restaurant_id` (`restaurant_id`);

--
-- Indexes for table `restaurant_tokens`
--
ALTER TABLE `restaurant_tokens`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `token_unique` (`token`),
  ADD KEY `restaurant_id_idx` (`restaurant_id`);

--
-- Indexes for table `review_reports`
--
ALTER TABLE `review_reports`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_status` (`status`),
  ADD KEY `idx_review_id` (`review_id`),
  ADD KEY `idx_restaurant_id` (`restaurant_id`),
  ADD KEY `idx_created_at` (`created_at`);

--
-- Indexes for table `searches`
--
ALTER TABLE `searches`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `user_location_cache`
--
ALTER TABLE `user_location_cache`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `session_id` (`session_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `admin_users`
--
ALTER TABLE `admin_users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `chat_history`
--
ALTER TABLE `chat_history`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `owners`
--
ALTER TABLE `owners`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=23;

--
-- AUTO_INCREMENT for table `owner_notifications`
--
ALTER TABLE `owner_notifications`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=25;

--
-- AUTO_INCREMENT for table `restaurants`
--
ALTER TABLE `restaurants`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=81;

--
-- AUTO_INCREMENT for table `restaurant_changes`
--
ALTER TABLE `restaurant_changes`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=32;

--
-- AUTO_INCREMENT for table `restaurant_distances`
--
ALTER TABLE `restaurant_distances`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `restaurant_ratings`
--
ALTER TABLE `restaurant_ratings`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=54;

--
-- AUTO_INCREMENT for table `restaurant_tokens`
--
ALTER TABLE `restaurant_tokens`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `review_reports`
--
ALTER TABLE `review_reports`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=30;

--
-- AUTO_INCREMENT for table `searches`
--
ALTER TABLE `searches`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=110;

--
-- AUTO_INCREMENT for table `user_location_cache`
--
ALTER TABLE `user_location_cache`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `owner_notifications`
--
ALTER TABLE `owner_notifications`
  ADD CONSTRAINT `fk_notif_owner` FOREIGN KEY (`owner_id`) REFERENCES `owners` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `restaurants`
--
ALTER TABLE `restaurants`
  ADD CONSTRAINT `fk_restaurants_owner` FOREIGN KEY (`owner_id`) REFERENCES `owners` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `restaurant_changes`
--
ALTER TABLE `restaurant_changes`
  ADD CONSTRAINT `fk_changes_owner` FOREIGN KEY (`owner_id`) REFERENCES `owners` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_changes_restaurant` FOREIGN KEY (`restaurant_id`) REFERENCES `restaurants` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `restaurant_distances`
--
ALTER TABLE `restaurant_distances`
  ADD CONSTRAINT `fk_dist_restaurant` FOREIGN KEY (`restaurant_id`) REFERENCES `restaurants` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `restaurant_ratings`
--
ALTER TABLE `restaurant_ratings`
  ADD CONSTRAINT `fk_ratings_restaurant` FOREIGN KEY (`restaurant_id`) REFERENCES `restaurants` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `restaurant_tokens`
--
ALTER TABLE `restaurant_tokens`
  ADD CONSTRAINT `fk_tokens_restaurant` FOREIGN KEY (`restaurant_id`) REFERENCES `restaurants` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `review_reports`
--
ALTER TABLE `review_reports`
  ADD CONSTRAINT `review_reports_ibfk_1` FOREIGN KEY (`review_id`) REFERENCES `restaurant_ratings` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `review_reports_ibfk_2` FOREIGN KEY (`restaurant_id`) REFERENCES `restaurants` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
