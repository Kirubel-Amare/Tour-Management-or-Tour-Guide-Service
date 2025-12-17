<?php
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

require_once '../../config/Database.php';
require_once '../../config/ExternalService.php';
require_once '../../models/Hotel.php';

$database = new Database();
$db = $database->connect();
$hotelModel = new Hotel($db);

$baseUrl = getenv('EXTERNAL_HOTEL_API');

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $payload = json_decode(file_get_contents('php://input'), true);

    if (!$payload) {
        http_response_code(400);
        echo json_encode(['message' => 'Invalid JSON payload']);
        exit;
    }

    $reservation = [
        'user' => $payload['user'] ?? null,
        'hotel_id' => $payload['hotel_id'] ?? null,
        'check_in' => $payload['check_in'] ?? null,
        'check_out' => $payload['check_out'] ?? null,
        'guests' => $payload['guests'] ?? 1,
        'roomType' => $payload['roomType'] ?? 'Standard'
    ];

    if (!$reservation['hotel_id'] || !$reservation['check_in'] || !$reservation['check_out']) {
        http_response_code(400);
        echo json_encode(['message' => 'hotel_id, check_in, and check_out are required']);
        exit;
    }

    $source = 'db';
    $data = null;

    if (!empty($baseUrl)) {
        $response = ExternalService::requestJson(rtrim($baseUrl, '/'), 'POST', $reservation);
        if ($response['ok']) {
            $data = $response['data'];
            $source = 'external';
        }
    }

    if ($data === null) {
        $reservation['user_id'] = $reservation['user']['id'] ?? 0;
        $reservation['room_type'] = $reservation['roomType'];
        $insertId = $hotelModel->book($reservation);
        $data = array_merge($reservation, [
            'reservation_id' => $insertId,
            'confirmation' => 'db-' . $insertId,
            'status' => 'confirmed'
        ]);
    }

    echo json_encode(['source' => $source, 'data' => $data]);
    exit;
}

$queryParams = [
    'q' => $_GET['q'] ?? '',
    'city' => $_GET['city'] ?? '',
    'roomType' => $_GET['room_type'] ?? '',
    'minRating' => $_GET['rating'] ?? ''
];

$source = 'db';
$data = [];

if (!empty($baseUrl)) {
    $url = rtrim($baseUrl, '/');
    $url .= (strpos($url, '?') === false ? '?' : '&') . http_build_query(array_filter($queryParams));

    $response = ExternalService::requestJson($url);
    if ($response['ok'] && is_array($response['data'])) {
        $data = $response['data'];
        $source = 'external';
    }
}

if (!$data) {
    $stmt = $hotelModel->read();
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        $row['amenities'] = $row['amenities'] ? json_decode($row['amenities'], true) : [];
        // normalize key names to match frontend expectations
        $row['roomType'] = $row['room_type'];
        $row['hotelRating'] = $row['hotel_rating'];
        $data[] = $row;
    }
}

echo json_encode(['source' => $source, 'data' => $data]);
