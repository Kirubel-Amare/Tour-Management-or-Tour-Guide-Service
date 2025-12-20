<?php
$origin = $_SERVER['HTTP_ORIGIN'] ?? ($_SERVER['HTTP_HOST'] ? ('http://' . $_SERVER['HTTP_HOST']) : '*');
if ($origin === 'null') { $origin = 'null'; }
header('Access-Control-Allow-Origin: ' . $origin);
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
header('Vary: Origin');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

require_once '../../../config/Database.php';
require_once '../../../api/middleware/AuthMiddleware.php';

session_start();
AuthMiddleware::authorize(['admin']);

$database = new Database();
$db = $database->connect();

try {
    $stmt = $db->prepare('SELECT r.id, r.user_id, r.hotel_id, r.check_in, r.check_out, r.guests, r.room_type, r.status, r.created_at, u.name AS user_name, u.email AS user_email, h.name AS hotel_name FROM hotel_reservations r LEFT JOIN users u ON r.user_id = u.id LEFT JOIN hotels h ON r.hotel_id = h.id ORDER BY r.created_at DESC');
    $stmt->execute();
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode($rows);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['message' => 'Failed to load hotel reservations', 'error' => $e->getMessage()]);
}
