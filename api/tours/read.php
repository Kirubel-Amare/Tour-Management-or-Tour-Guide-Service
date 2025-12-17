<?php
// Headers
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json');

include_once '../../config/Database.php';
include_once '../../models/Tour.php';

$database = new Database();
$db = $database->connect();
$tour = new Tour($db);

$stmt = $tour->read();
$num = $stmt->rowCount();

if ($num > 0) {
    $tours_arr = array();

    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        extract($row);

        $tour_item = array(
            'id' => $id,
            'title' => $title,
            'description' => html_entity_decode($description),
            'location' => $location,
            'image' => $image,
            'price' => $price,
            'schedule_date' => $schedule_date,
            'guide_id' => $guide_id,
            'guide_name' => $guide_name,
            'created_at' => $created_at
        );

        array_push($tours_arr, $tour_item);
    }

    echo json_encode($tours_arr);
} else {
    echo json_encode(array());
}
