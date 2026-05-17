<?php
session_start();
require_once '../includes/config.php';
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

$method = $_SERVER['REQUEST_METHOD'];
$pdo = getDB();

if ($method === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    $message = $input['message'] ?? '';
    $sender = $input['sender'] ?? '';
    $session_id = session_id();

    if ($message && $sender) {
        try {
            $stmt = $pdo->prepare('INSERT INTO chat_history (session_id, message, sender) VALUES (?, ?, ?)');
            $stmt->execute([$session_id, $message, $sender]);
            echo json_encode(['success' => true]);
        } catch (PDOException $e) {
            error_log('Chat history insert error: ' . $e->getMessage());
            echo json_encode(['success' => false, 'error' => 'Database error']);
        }
    } else {
        echo json_encode(['success' => false, 'error' => 'Missing message or sender']);
    }
    exit;
}

if ($method === 'GET') {
    $session_id = session_id();
    try {
        $stmt = $pdo->prepare("SELECT message, sender FROM chat_history WHERE session_id = ? ORDER BY id ASC");
        $stmt->execute([$session_id]);
        $history = $stmt->fetchAll(PDO::FETCH_ASSOC);
        echo json_encode(['history' => $history]);
    } catch (PDOException $e) {
        error_log('Chat history query error: ' . $e->getMessage());
        echo json_encode(['success' => false, 'error' => 'Database error']);
    }
    exit;
}

echo json_encode(['success' => false, 'error' => 'Invalid request']);
?>