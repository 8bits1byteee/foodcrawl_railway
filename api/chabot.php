<?php
require_once '../includes/config.php';
require_once '../includes/functions.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

$input = json_decode(file_get_contents('php://input'), true);
$message = strtolower(trim($input['message'] ?? ''));
$restaurants = $input['restaurants'] ?? [];

// Simple chatbot logic
function getChatbotResponse($message, $restaurants) {
    if (empty($message)) {
        return "Hello! I'm your Food Crawl assistant. How can I help you find restaurants in Estancia?";
    }
    
    if (strpos($message, 'hello') !== false || strpos($message, 'hi') !== false || strpos($message, 'hey') !== false) {
        return "Hello! I'm your Food Crawl assistant. I can help you find restaurants in Estancia, Iloilo. What are you looking for?";
    }
    elseif (strpos($message, 'adobo') !== false) {
        $adoboRestaurants = array_filter($restaurants, function($restaurant) {
            return stripos($restaurant['menu_items'] ?? '', 'adobo') !== false;
        });
        
        if (count($adoboRestaurants) > 0) {
            $response = "I found these restaurants serving adobo:\n";
            foreach (array_slice($adoboRestaurants, 0, 5) as $restaurant) {
                $response .= "• {$restaurant['name']} - {$restaurant['address']}\n";
            }
            return $response;
        } else {
            return "I couldn't find any restaurants serving adobo at the moment.";
        }
    }
    elseif (strpos($message, 'seafood') !== false || strpos($message, 'fish') !== false) {
        $seafoodRestaurants = array_filter($restaurants, function($restaurant) {
            return stripos($restaurant['description'] ?? '', 'seafood') !== false || 
                   stripos($restaurant['name'] ?? '', 'seafood') !== false ||
                   stripos($restaurant['menu_items'] ?? '', 'fish') !== false;
        });
        
        if (count($seafoodRestaurants) > 0) {
            $response = "Here are some seafood restaurants:\n";
            foreach (array_slice($seafoodRestaurants, 0, 5) as $restaurant) {
                $response .= "• {$restaurant['name']} - {$restaurant['address']}\n";
            }
            return $response;
        } else {
            return "I couldn't find any seafood restaurants at the moment.";
        }
    }
    elseif (strpos($message, 'recommend') !== false || strpos($message, 'popular') !== false) {
        // Get top visited restaurants
        usort($restaurants, function($a, $b) {
            return ($b['visit_count'] ?? 0) - ($a['visit_count'] ?? 0);
        });
        
        $topRestaurants = array_slice($restaurants, 0, 3);
        if (count($topRestaurants) > 0) {
            $response = "Based on popularity, I recommend:\n";
            foreach ($topRestaurants as $restaurant) {
                $visits = $restaurant['visit_count'] ?? 0;
                $response .= "• {$restaurant['name']} ({$visits} visits)\n";
            }
            return $response;
        } else {
            return "I don't have enough data to make recommendations yet.";
        }
    }
    else {
        return "I can help you find restaurants in Estancia. Try asking about specific foods like 'adobo', 'seafood', or ask for 'recommendations'. You can also search using the search bar above!";
    }
}

$response = getChatbotResponse($message, $restaurants);
echo json_encode(['response' => $response]);
?>