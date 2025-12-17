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
if (!$data || empty($data['name']) || empty($data['location']) || empty($data['cuisine'])) {
    http_response_code(400);
    echo json_encode(['message' => 'name, location and cuisine are required']);
    exit;
}

try {
    $stmt = $db->prepare('INSERT INTO restaurants (name, location, cuisine, image, price_range, rating, description) VALUES (:name, :location, :cuisine, :image, :price_range, :rating, :description)');
    $stmt->bindParam(':name', $data['name']);
    $stmt->bindParam(':location', $data['location']);
    $stmt->bindParam(':cuisine', $data['cuisine']);
    $img = isset($data['image']) ? $data['image'] : null;
    $stmt->bindParam(':image', $img);
    $price_range = isset($data['price_range']) ? $data['price_range'] : null;
    $stmt->bindParam(':price_range', $price_range);
    $rating = isset($data['rating']) ? floatval($data['rating']) : null;
    $stmt->bindParam(':rating', $rating);
    $desc = isset($data['description']) ? $data['description'] : null;
    $stmt->bindParam(':description', $desc);
    $stmt->execute();
    echo json_encode(['message' => 'Restaurant created', 'id' => $db->lastInsertId()]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['message' => 'Failed to create restaurant', 'error' => $e->getMessage()]);
}
