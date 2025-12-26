<?php
// api/bookings/delete.php
require_once __DIR__ . '/../../config/Database.php';
require_once __DIR__ . '/../../models/Booking.php';
require_once __DIR__ . '/../middleware/AuthMiddleware.php';

// Only allow DELETE
if ($_SERVER['REQUEST_METHOD'] !== 'DELETE') {
    http_response_code(405);
    echo json_encode(['message' => 'Method Not Allowed']);
    exit;
}

AuthMiddleware::authorize(['customer', 'manager', 'admin']);
$userId = $_SESSION['user_id'];

$data = json_decode(file_get_contents('php://input'), true);
if (!$data || !isset($data['id'])) {
    http_response_code(400);
    echo json_encode(['message' => 'Missing required fields']);
    exit;
}

$db = (new Database())->connect();
$booking = new Booking($db);
$booking->id = $data['id'];
$booking->user_id = $userId;

if ($booking->deleteByUser()) {
    http_response_code(200);
    echo json_encode(['message' => 'Booking deleted successfully']);
} else {
    http_response_code(500);
    echo json_encode(['message' => 'Failed to delete booking']);
}
