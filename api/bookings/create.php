<?php
// Headers
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Access-Control-Allow-Headers,Content-Type,Access-Control-Allow-Methods, Authorization, X-Requested-With');

include_once '../../config/Database.php';
include_once '../../models/Booking.php';

$database = new Database();
$db = $database->connect();
$booking = new Booking($db);

$data = json_decode(file_get_contents("php://input"));

if (!empty($data->tour_id) && !empty($data->tourist_id)) {
    $booking->tour_id = $data->tour_id;
    $booking->tourist_id = $data->tourist_id;

    if ($booking->create()) {
        http_response_code(201);
        echo json_encode(['message' => 'Booking Created']);
    } else {
        http_response_code(503);
        echo json_encode(['message' => 'Booking Failed']);
    }
} else {
    http_response_code(400);
    echo json_encode(['message' => 'Incomplete Data']);
}
