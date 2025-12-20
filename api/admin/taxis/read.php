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
    $stmt = $db->prepare('SELECT t.id, t.user_id, t.pickup, t.destination, t.vehicle_type, t.schedule, t.custom_time, t.distance_km, t.fare, t.eta_minutes, t.status, t.created_at, u.name AS user_name, u.email AS user_email FROM taxi_orders t LEFT JOIN users u ON t.user_id = u.id ORDER BY t.created_at DESC');
    $stmt->execute();
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode($rows);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['message' => 'Failed to load taxi orders', 'error' => $e->getMessage()]);
}
