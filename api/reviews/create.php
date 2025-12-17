<?php
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Access-Control-Allow-Headers,Content-Type,Access-Control-Allow-Methods, Authorization, X-Requested-With');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }

include_once '../../config/Database.php';
include_once '../../models/Review.php';

$database = new Database();
$db = $database->connect();
$review = new Review($db);

$data = json_decode(file_get_contents("php://input"));

if (!empty($data->tour_id) && !empty($data->user_id) && !empty($data->rating)) {
    $review->tour_id = $data->tour_id;
    $review->user_id = $data->user_id;
    $review->rating = $data->rating;
    $review->comment = isset($data->comment) ? $data->comment : null;

    if ($review->create()) {
        http_response_code(201);
        echo json_encode(['message' => 'Review Created']);
    } else {
        http_response_code(503);
        echo json_encode(['message' => 'Review Not Created']);
    }
} else {
    http_response_code(400);
    echo json_encode(['message' => 'Incomplete Data']);
}
