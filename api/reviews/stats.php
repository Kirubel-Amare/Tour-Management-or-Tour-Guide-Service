<?php
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json');

include_once '../../config/Database.php';
include_once '../../models/Review.php';

$database = new Database();
$db = $database->connect();
$review = new Review($db);

$guide_id = isset($_GET['guide_id']) ? $_GET['guide_id'] : null;

if (!$guide_id) {
    http_response_code(400);
    echo json_encode(['message' => 'Provide guide_id']);
    exit;
}

$stats = $review->statsByGuide($guide_id);
if (!$stats || $stats['total_reviews'] === null) {
    $stats = ['avg_rating' => 0, 'total_reviews' => 0];
}

echo json_encode($stats);
