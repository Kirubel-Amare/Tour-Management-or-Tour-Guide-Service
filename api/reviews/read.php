<?php
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json');

include_once '../../config/Database.php';
include_once '../../models/Review.php';

$database = new Database();
$db = $database->connect();
$review = new Review($db);

$tour_id = isset($_GET['tour_id']) ? $_GET['tour_id'] : null;
$guide_id = isset($_GET['guide_id']) ? $_GET['guide_id'] : null;

if ($tour_id) {
    $review->tour_id = $tour_id;
    $stmt = $review->readByTour();
    $num = $stmt->rowCount();
    $reviews = [];
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        $reviews[] = $row;
    }
    echo json_encode($reviews);
} else if ($guide_id) {
    $stmt = $review->readByGuide($guide_id);
    $reviews = [];
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) { $reviews[] = $row; }
    echo json_encode($reviews);
} else {
    http_response_code(400);
    echo json_encode(['message' => 'Provide tour_id or guide_id']);
}
