<?php
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

session_start();

require_once '../../../config/Database.php';
require_once '../../../api/middleware/AuthMiddleware.php';

AuthMiddleware::authorize(['admin']);

$database = new Database();
$db = $database->connect();

$data = json_decode(file_get_contents('php://input'), true);
if (!$data || empty($data['id']) || empty($data['role'])) {
    http_response_code(400);
    echo json_encode(['message' => 'Missing id or role']);
    exit;
}

$valid_roles = ['admin','manager','customer'];
if (!in_array($data['role'], $valid_roles)) {
    http_response_code(400);
    echo json_encode(['message' => 'Invalid role']);
    exit;
}

try {
    $stmt = $db->prepare('UPDATE users SET role = :role WHERE id = :id');
    $stmt->bindParam(':role', $data['role']);
    $stmt->bindParam(':id', $data['id']);
    $stmt->execute();
    echo json_encode(['message' => 'User role updated']);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['message' => 'Failed to update role', 'error' => $e->getMessage()]);
}
