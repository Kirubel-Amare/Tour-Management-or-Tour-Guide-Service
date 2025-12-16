<?php
// Headers
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json');
header('Access-Control-Allow-Methods: PUT');
header('Access-Control-Allow-Headers: Access-Control-Allow-Headers,Content-Type,Access-Control-Allow-Methods, Authorization, X-Requested-With');

include_once '../../config/Database.php';
include_once '../../models/Tour.php';

$database = new Database();
$db = $database->connect();
$tour = new Tour($db);

$data = json_decode(file_get_contents("php://input"));

if (!empty($data->id) && !empty($data->guide_id)) {
    $tour->id = $data->id;
    $tour->guide_id = $data->guide_id;
    $tour->title = $data->title;
    $tour->description = $data->description;
    $tour->location = $data->location;
    $tour->price = $data->price;
    $tour->schedule_date = $data->schedule_date;

    if ($tour->update()) {
        http_response_code(200);
        echo json_encode(['message' => 'Tour Updated']);
    } else {
        http_response_code(503);
        echo json_encode(['message' => 'Tour Not Updated']);
    }
} else {
    http_response_code(400);
    echo json_encode(['message' => 'Missing Data']);
}
