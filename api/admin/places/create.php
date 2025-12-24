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

if (!$data || empty($data['name']) || empty($data['type']) || empty($data['continent'])) {
    http_response_code(400);
    echo json_encode(['message' => 'name, type and continent are required']);
    exit;
}

// Normalize optional fields
$name = $data['name'];
$type = $data['type'];
$continent = $data['continent'];
$climate = isset($data['climate']) ? $data['climate'] : 'Temperate';
$description = isset($data['description']) ? $data['description'] : null;
$image = isset($data['image']) ? $data['image'] : null;
$rating = isset($data['rating']) ? floatval($data['rating']) : 4.5;
$reviews = isset($data['reviews']) ? intval($data['reviews']) : 0;
$features = null;
if (isset($data['features'])) {
    if (is_array($data['features'])) {
        $features = json_encode(array_values($data['features']));
    } elseif (is_string($data['features'])) {
        $features = $data['features'];
    }
}

try {
    $stmt = $db->prepare('INSERT INTO places (name, type, continent, climate, description, image, rating, reviews, features) VALUES (:name, :type, :continent, :climate, :description, :image, :rating, :reviews, :features)');
    $stmt->bindParam(':name', $name);
    $stmt->bindParam(':type', $type);
    $stmt->bindParam(':continent', $continent);
    $stmt->bindParam(':climate', $climate);
    $stmt->bindParam(':description', $description);
    $stmt->bindParam(':image', $image);
    $stmt->bindParam(':rating', $rating);
    $stmt->bindParam(':reviews', $reviews);
    $stmt->bindParam(':features', $features);
    $stmt->execute();

    echo json_encode(['message' => 'Place created', 'id' => $db->lastInsertId()]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['message' => 'Failed to create place', 'error' => $e->getMessage()]);
}
