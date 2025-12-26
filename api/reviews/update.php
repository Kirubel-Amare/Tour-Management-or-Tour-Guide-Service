<?php
// api/reviews/update.php
require_once __DIR__ . '/../../config/Database.php';
require_once __DIR__ . '/../../models/Review.php';
require_once __DIR__ . '/../middleware/AuthMiddleware.php';

// Only allow PUT
if ($_SERVER['REQUEST_METHOD'] !== 'PUT') {
    http_response_code(405);
    echo json_encode(['message' => 'Method Not Allowed']);
    exit;
}

AuthMiddleware::authorize(['customer', 'manager', 'admin']);
$userId = $_SESSION['user_id'];

$data = json_decode(file_get_contents('php://input'), true);
if (!$data || !isset($data['id'], $data['content'], $data['rating'])) {
    http_response_code(400);
    echo json_encode(['message' => 'Missing required fields']);
    exit;
}

$db = (new Database())->connect();
$review = new Review($db);
$review->id = $data['id'];
$review->user_id = $userId;
$review->comment = $data['content'];
$review->rating = $data['rating'];

if ($review->updateByUser()) {
    http_response_code(200);
    echo json_encode(['message' => 'Review updated successfully']);
} else {
    http_response_code(500);
    echo json_encode(['message' => 'Failed to update review']);
}
