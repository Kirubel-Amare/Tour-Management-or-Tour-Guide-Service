<?php
// Headers
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json');

require_once '../../config/Database.php';
require_once '../../models/Place.php';

$database = new Database();
$db = $database->connect();

$place = new Place($db);
$stmt = $place->read();
$num = $stmt->rowCount();

$places = [];
if ($num > 0) {
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        $row['features'] = $row['features'] ? json_decode($row['features'], true) : [];
        $places[] = $row;
    }
}

echo json_encode($places);
