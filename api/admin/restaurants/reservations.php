<?php
$origin = $_SERVER['HTTP_ORIGIN'] ?? '*';
header('Access-Control-Allow-Origin: ' . $origin);
header('Access-Control-Allow-Credentials: true');
header('Vary: Origin');
header('Content-Type: application/json');

require_once '../../../config/Database.php';
require_once '../../../api/middleware/AuthMiddleware.php';

session_start();
AuthMiddleware::authorize(['admin']);

$database = new Database();
$db = $database->connect();

try {
    $stmt = $db->prepare('SELECT r.id, r.user_id, r.restaurant_id, r.date, r.time, r.guests, r.notes, r.status, r.created_at, u.name AS user_name, u.email AS user_email, res.name AS restaurant_name FROM restaurant_reservations r LEFT JOIN users u ON r.user_id = u.id LEFT JOIN restaurants res ON r.restaurant_id = res.id ORDER BY r.created_at DESC');
    $stmt->execute();
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode($rows);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['message' => 'Failed to load restaurant reservations', 'error' => $e->getMessage()]);
}
