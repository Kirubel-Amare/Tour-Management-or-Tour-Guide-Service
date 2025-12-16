<?php
// Headers
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json');

include_once '../../config/Database.php';
include_once '../../models/Booking.php';

$database = new Database();
$db = $database->connect();
$booking = new Booking($db);

$booking->user_id = isset($_GET['user_id']) ? $_GET['user_id'] : die();

$stmt = $booking->readByUser();
$num = $stmt->rowCount();

if ($num > 0) {
    $bookings_arr = array();

    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        extract($row);

        $booking_item = array(
            'id' => $id,
            'tour_id' => $tour_id,
            'tour_title' => $tour_title,
            'location' => $location,
            'price' => $price,
            'schedule_date' => $schedule_date,
            'booking_date' => $booking_date,
            'status' => $status
        );

        array_push($bookings_arr, $booking_item);
    }

    echo json_encode($bookings_arr);
} else {
    echo json_encode(array());
}
