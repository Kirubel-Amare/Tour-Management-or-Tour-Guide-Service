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
if (!$data || empty($data['name']) || empty($data['location']) || !isset($data['price'])) {
    http_response_code(400);
    echo json_encode(['message' => 'name, location and price are required']);
    exit;
}

try {
    $stmt = $db->prepare('INSERT INTO hotels (name, location, image, price, rating, description, room_type, hotel_rating) VALUES (:name, :location, :image, :price, :rating, :description, :room_type, :hotel_rating)');
    $stmt->bindParam(':name', $data['name']);
    $stmt->bindParam(':location', $data['location']);
    $img = isset($data['image']) ? $data['image'] : null;
    $stmt->bindParam(':image', $img);
    $price = floatval($data['price']);
    $stmt->bindParam(':price', $price);
    $rating = isset($data['rating']) ? floatval($data['rating']) : null;
    $stmt->bindParam(':rating', $rating);
    $desc = isset($data['description']) ? $data['description'] : null;
    $stmt->bindParam(':description', $desc);
    $room = isset($data['room_type']) ? $data['room_type'] : null;
    $stmt->bindParam(':room_type', $room);
    $stars = isset($data['hotel_rating']) ? intval($data['hotel_rating']) : null;
    $stmt->bindParam(':hotel_rating', $stars);
    $stmt->execute();
    echo json_encode(['message' => 'Hotel created', 'id' => $db->lastInsertId()]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['message' => 'Failed to create hotel', 'error' => $e->getMessage()]);
}
