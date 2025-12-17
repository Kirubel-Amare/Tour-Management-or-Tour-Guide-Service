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
require_once '../../models/Restaurant.php';

$database = new Database();
$db = $database->connect();
$restaurantModel = new Restaurant($db);

$baseUrl = getenv('EXTERNAL_RESTAURANT_API');

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $payload = json_decode(file_get_contents('php://input'), true);

    if (!$payload) {
        http_response_code(400);
        echo json_encode(['message' => 'Invalid JSON payload']);
        exit;
    }

    $reservation = [
        'user' => $payload['user'] ?? null,
        'restaurant_id' => $payload['restaurant_id'] ?? null,
        'date' => $payload['date'] ?? null,
        'time' => $payload['time'] ?? null,
        'guests' => $payload['guests'] ?? 2,
        'notes' => $payload['notes'] ?? ''
    ];

    if (!$reservation['restaurant_id'] || !$reservation['date'] || !$reservation['time']) {
        http_response_code(400);
        echo json_encode(['message' => 'restaurant_id, date, and time are required']);
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
        $insertId = $restaurantModel->reserve($reservation);
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
    'cuisine' => $_GET['cuisine'] ?? '',
    'priceRange' => $_GET['price'] ?? ''
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
    $stmt = $restaurantModel->read();
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        $row['features'] = $row['features'] ? json_decode($row['features'], true) : [];
        $row['priceRange'] = $row['price_range'];
        $data[] = $row;
    }
}

echo json_encode(['source' => $source, 'data' => $data]);
