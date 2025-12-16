<?php
// Headers
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Access-Control-Allow-Headers,Content-Type,Access-Control-Allow-Methods, Authorization, X-Requested-With');

include_once '../../config/Database.php';
include_once '../../models/Tour.php';

$database = new Database();
$db = $database->connect();
$tour = new Tour($db);

$data = json_decode(file_get_contents("php://input"));

if (
    !empty($data->guide_id) &&
    !empty($data->title) &&
    !empty($data->location) &&
    !empty($data->price)
) {
    $tour->guide_id = $data->guide_id;
    $tour->title = $data->title;
    $tour->description = $data->description ?? '';
    $tour->location = $data->location;
    $tour->price = $data->price;
    $tour->schedule_date = $data->schedule_date ?? date('Y-m-d');

    if ($tour->create()) {
        http_response_code(201);
        echo json_encode(['message' => 'Tour Created']);
    } else {
        http_response_code(503);
        echo json_encode(['message' => 'Tour Not Created']);
    }
} else {
    http_response_code(400);
    echo json_encode(['message' => 'Incomplete Data']);
}
