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

$id = intval($data['id']);

// Build update columns dynamically
$fields = [
    'name' => isset($data['name']) ? $data['name'] : null,
    'type' => isset($data['type']) ? $data['type'] : null,
    'continent' => isset($data['continent']) ? $data['continent'] : null,
    'climate' => array_key_exists('climate', $data) ? $data['climate'] : null,
    'description' => array_key_exists('description', $data) ? $data['description'] : null,
    'image' => array_key_exists('image', $data) ? $data['image'] : null,
    'rating' => array_key_exists('rating', $data) ? (float)$data['rating'] : null,
    'reviews' => array_key_exists('reviews', $data) ? (int)$data['reviews'] : null,
];

if (isset($data['features'])) {
    if (is_array($data['features'])) {
        $fields['features'] = json_encode(array_values($data['features']));
    } elseif (is_string($data['features'])) {
        $fields['features'] = $data['features'];
    } else {
        $fields['features'] = null;
    }
}

// Remove null-only fields so we do not overwrite unintentionally
$setParts = [];
$params = [':id' => $id];
foreach ($fields as $col => $val) {
    if ($val === null) continue;
    $setParts[] = "$col = :$col";
    $params[":$col"] = $val;
}

if (empty($setParts)) {
    http_response_code(400);
    echo json_encode(['message' => 'No fields to update']);
    exit;
}

$sql = 'UPDATE places SET ' . implode(', ', $setParts) . ' WHERE id = :id';

try {
    $stmt = $db->prepare($sql);
    foreach ($params as $key => $val) {
        $stmt->bindValue($key, $val);
    }
    $stmt->execute();
    echo json_encode(['message' => 'Place updated']);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['message' => 'Failed to update place', 'error' => $e->getMessage()]);
}
