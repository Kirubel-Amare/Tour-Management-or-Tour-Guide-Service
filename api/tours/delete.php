<?php
// Headers
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json');
header('Access-Control-Allow-Methods: DELETE');
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

    if ($tour->delete()) {
        http_response_code(200);
        echo json_encode(['message' => 'Tour Deleted']);
    } else {
        http_response_code(503);
        echo json_encode(['message' => 'Tour Not Deleted (Check ID or Permission)']);
    }
} else {
    http_response_code(400);
    echo json_encode(['message' => 'Missing ID or Guide ID']);
}
