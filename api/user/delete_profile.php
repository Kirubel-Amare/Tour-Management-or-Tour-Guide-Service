<?php
// api/user/delete_profile.php
require_once __DIR__ . '/../../config/Database.php';
require_once __DIR__ . '/../../models/User.php';
require_once __DIR__ . '/../middleware/AuthMiddleware.php';

// Only allow DELETE
if ($_SERVER['REQUEST_METHOD'] !== 'DELETE') {
    http_response_code(405);
    echo json_encode(['message' => 'Method Not Allowed']);
    exit;
}

AuthMiddleware::authorize(['customer', 'manager', 'admin']);
$userId = $_SESSION['user_id'];

$db = (new Database())->connect();
$stmt = $db->prepare('DELETE FROM users WHERE id = :id');
$stmt->bindParam(':id', $userId);

if ($stmt->execute()) {
    session_destroy();
    http_response_code(200);
    echo json_encode(['message' => 'Profile deleted successfully']);
} else {
    http_response_code(500);
    echo json_encode(['message' => 'Failed to delete profile']);
}
