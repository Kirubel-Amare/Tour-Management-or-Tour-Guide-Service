<?php
// Headers
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json');

include_once '../../config/Database.php';
include_once '../../models/Booking.php';

$database = new Database();
$db = $database->connect();
$booking = new Booking($db);

$tourist_id = isset($_GET['tourist_id']) ? $_GET['tourist_id'] : die();

$booking->tourist_id = $tourist_id;
$result = $booking->read_by_tourist();

echo json_encode($result);
