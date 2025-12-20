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
    $sql = 'SELECT r.id, r.tour_id, r.user_id, r.rating, r.comment, r.created_at,
                   u.name AS reviewer_name, u.email AS reviewer_email,
                   t.title AS tour_title
            FROM tour_reviews r
            LEFT JOIN users u ON r.user_id = u.id
            LEFT JOIN tours t ON r.tour_id = t.id
            ORDER BY r.created_at DESC';
    $stmt = $db->prepare($sql);
    $stmt->execute();
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode($rows);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['message' => 'Failed to load reviews', 'error' => $e->getMessage()]);
}
