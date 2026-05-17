<?php
session_start();

require_once '../includes/config.php';
require_once '../includes/auth.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
	exit(0);
}

if (!isLoggedIn()) {
	http_response_code(401);
	echo json_encode(['success' => false, 'error' => 'Please log in first to change account credentials.']);
	exit;
}

$action = $_GET['action'] ?? '';

if ($action !== 'change_admin_credentials') {
	http_response_code(400);
	echo json_encode(['success' => false, 'error' => 'Invalid action']);
	exit;
}

try {
	$input = json_decode(file_get_contents('php://input'), true);
	if (!is_array($input)) {
		$input = $_POST;
	}

	$currentPassword = (string)($input['current_password'] ?? '');
	$newUsername = trim((string)($input['new_username'] ?? ''));
	$newPassword = (string)($input['new_password'] ?? '');
	$confirmPassword = (string)($input['confirm_password'] ?? '');

	if ($currentPassword === '' || $newUsername === '') {
		http_response_code(400);
		echo json_encode(['success' => false, 'error' => 'Current password and new username are required.']);
		exit;
	}

	if (strlen($newUsername) < 3) {
		http_response_code(400);
		echo json_encode(['success' => false, 'error' => 'Username must be at least 3 characters.']);
		exit;
	}

	if ($newPassword !== '') {
		if (strlen($newPassword) < 6) {
			http_response_code(400);
			echo json_encode(['success' => false, 'error' => 'New password must be at least 6 characters.']);
			exit;
		}
		if ($newPassword !== $confirmPassword) {
			http_response_code(400);
			echo json_encode(['success' => false, 'error' => 'New password and confirmation do not match.']);
			exit;
		}
	}

	$adminId = (int)($_SESSION['admin_id'] ?? 0);
	if ($adminId <= 0) {
		http_response_code(401);
		echo json_encode(['success' => false, 'error' => 'Session expired. Please log in again.']);
		exit;
	}

	$pdo = getDB();
	$stmt = $pdo->prepare('SELECT id, username, password_hash FROM admin_users WHERE id = ?');
	$stmt->execute([$adminId]);
	$admin = $stmt->fetch(PDO::FETCH_ASSOC);

	if (!$admin) {
		http_response_code(404);
		echo json_encode(['success' => false, 'error' => 'Admin account not found.']);
		exit;
	}

	if (!password_verify($currentPassword, $admin['password_hash'])) {
		http_response_code(403);
		echo json_encode(['success' => false, 'error' => 'Current password is incorrect.']);
		exit;
	}

	$usernameCheck = $pdo->prepare('SELECT id FROM admin_users WHERE username = ? AND id <> ? LIMIT 1');
	$usernameCheck->execute([$newUsername, $adminId]);
	if ($usernameCheck->fetch(PDO::FETCH_ASSOC)) {
		http_response_code(409);
		echo json_encode(['success' => false, 'error' => 'Username is already taken.']);
		exit;
	}

	if ($newPassword !== '') {
		$newPasswordHash = password_hash($newPassword, PASSWORD_DEFAULT);
		$update = $pdo->prepare('UPDATE admin_users SET username = ?, password_hash = ? WHERE id = ?');
		$update->execute([$newUsername, $newPasswordHash, $adminId]);
	} else {
		$update = $pdo->prepare('UPDATE admin_users SET username = ? WHERE id = ?');
		$update->execute([$newUsername, $adminId]);
	}

	$_SESSION['admin_username'] = $newUsername;

	echo json_encode([
		'success' => true,
		'message' => $newPassword !== '' ? 'Username and password updated successfully.' : 'Username updated successfully.',
		'username' => $newUsername
	]);
} catch (Exception $e) {
	error_log('Admin auth API error: ' . $e->getMessage());
	http_response_code(500);
	echo json_encode(['success' => false, 'error' => 'Server error occurred']);
}

