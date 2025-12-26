<?php
// api/user/update_profile.php
require_once __DIR__ . '/../../config/Database.php';
require_once __DIR__ . '/../../models/User.php';
require_once __DIR__ . '/../middleware/AuthMiddleware.php';

// Only allow PUT
if ($_SERVER['REQUEST_METHOD'] !== 'PUT') {
    http_response_code(405);
    echo json_encode(['message' => 'Method Not Allowed']);
    exit;
}

AuthMiddleware::authorize(['customer', 'manager', 'admin']);
$userId = $_SESSION['user_id'];

$data = json_decode(file_get_contents('php://input'), true);
if (!$data || !isset($data['name'], $data['email'])) {
    http_response_code(400);
    echo json_encode(['message' => 'Missing required fields']);
    exit;
}

$db = (new Database())->connect();
$user = new User($db);
$user->id = $userId;
$user->name = $data['name'];
$user->email = $data['email'];
if (!empty($data['password'])) {
    $user->password = $data['password'];
}

if ($user->update()) {
    http_response_code(200);
    echo json_encode(['message' => 'Profile updated successfully']);
} else {
    http_response_code(500);
    echo json_encode(['message' => 'Failed to update profile']);
}
