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
    $stmt = $db->prepare('UPDATE restaurants SET name = :name, location = :location, cuisine = :cuisine, image = :image, price_range = :price_range, rating = :rating, description = :description WHERE id = :id');
    $stmt->bindParam(':id', $data['id']);
    $name = isset($data['name']) ? $data['name'] : null;
    $loc = isset($data['location']) ? $data['location'] : null;
    $cuisine = isset($data['cuisine']) ? $data['cuisine'] : null;
    $img = isset($data['image']) ? $data['image'] : null;
    $price = isset($data['price_range']) ? $data['price_range'] : null;
    $rating = isset($data['rating']) ? floatval($data['rating']) : null;
    $desc = isset($data['description']) ? $data['description'] : null;
    $stmt->bindParam(':name', $name);
    $stmt->bindParam(':location', $loc);
    $stmt->bindParam(':cuisine', $cuisine);
    $stmt->bindParam(':image', $img);
    $stmt->bindParam(':price_range', $price);
    $stmt->bindParam(':rating', $rating);
    $stmt->bindParam(':description', $desc);
    $stmt->execute();
    echo json_encode(['message' => 'Restaurant updated']);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['message' => 'Failed to update restaurant', 'error' => $e->getMessage()]);
}
