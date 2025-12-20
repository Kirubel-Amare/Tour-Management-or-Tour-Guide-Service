<?php
// Headers
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Access-Control-Allow-Headers,Content-Type,Access-Control-Allow-Methods, Authorization, X-Requested-With');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

include_once '../../config/Database.php';
include_once '../../models/Booking.php';

$database = new Database();
$db = $database->connect();
$booking = new Booking($db);

$data = json_decode(file_get_contents("php://input"));

if (
    !empty($data->tour_id) &&
    !empty($data->user_id)
) {
    $booking->tour_id = $data->tour_id;
    $booking->user_id = $data->user_id;

    // Allow clients (admin) to request a status; default is pending
    $valid_status = ['pending', 'confirmed', 'cancelled'];
    if (!empty($data->status) && in_array(strtolower($data->status), $valid_status, true)) {
        $booking->status = strtolower($data->status);
    }

    if ($booking->create()) {
        http_response_code(201);
        echo json_encode(['message' => 'Booking Created']);
    } else {
        http_response_code(503);
        echo json_encode(['message' => 'Booking Not Created']);
    }
} else {
    http_response_code(400);
    echo json_encode(['message' => 'Incomplete Data']);
}
