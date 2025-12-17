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
if (!$data || empty($data['id'])) {
    http_response_code(400);
    echo json_encode(['message' => 'Missing id']);
    exit;
}

try {
    $stmt = $db->prepare('DELETE FROM restaurants WHERE id = :id');
    $stmt->bindParam(':id', $data['id']);
    $stmt->execute();
    echo json_encode(['message' => 'Restaurant deleted']);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['message' => 'Failed to delete restaurant', 'error' => $e->getMessage()]);
}
