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
if (!$data || empty($data['id']) || empty($data['status'])) {
    http_response_code(400);
    echo json_encode(['message' => 'Missing id or status']);
    exit;
}

$valid_status = ['pending','confirmed','cancelled'];
if (!in_array(strtolower($data['status']), $valid_status)) {
    http_response_code(400);
    echo json_encode(['message' => 'Invalid status']);
    exit;
}

try {
    $stmt = $db->prepare('UPDATE bookings SET status = :status WHERE id = :id');
    $status = strtolower($data['status']);
    $stmt->bindParam(':status', $status);
    $stmt->bindParam(':id', $data['id']);
    $stmt->execute();
    echo json_encode(['message' => 'Booking status updated']);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['message' => 'Failed to update booking', 'error' => $e->getMessage()]);
}
