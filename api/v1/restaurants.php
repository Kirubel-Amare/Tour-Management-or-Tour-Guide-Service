<?php
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-API-KEY');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

require_once 'middleware/Auth.php';
require_once '../../config/ExternalService.php';

$baseUrl = getenv('EXTERNAL_RESTAURANT_API');

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $payload = json_decode(file_get_contents('php://input'), true);

    if (!$payload) {
        http_response_code(400);
        echo json_encode(['message' => 'Invalid JSON payload']);
        exit;
    }

    $reservation = [
        'user' => $payload['user'] ?? ['id' => 0],
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

    $source = 'external';
    $data = null;

    if (!empty($baseUrl) || getenv('EXTERNAL_API_MODE') === 'mock') {
        $response = ExternalService::requestJson(rtrim($baseUrl ?: 'http://mock-service/restaurants', '/'), 'POST', $reservation);
        if ($response['ok']) {
            $data = $response['data'];
        } else {
            http_response_code(503);
            echo json_encode(['message' => 'External service error', 'status' => $response['status'], 'error' => $response['error']]);
            exit;
        }
    }

    if ($data === null) {
        http_response_code(503);
        echo json_encode(['message' => 'External restaurant service unavailable']);
        exit;
    }

    $confirmation = is_array($data) ? ($data['confirmation'] ?? null) : null;
    $finalMessage = $confirmation ? 'Restaurant reservation confirmed' : 'Restaurant reservation submitted';

    echo json_encode([
        'source' => $source,
        'data' => $data,
        'message' => $finalMessage,
        'confirmation' => $confirmation
    ]);
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

if (!empty($baseUrl) || getenv('EXTERNAL_API_MODE') === 'mock') {
    $url = rtrim($baseUrl ?: 'http://mock-service/restaurants', '/');
    $url .= (strpos($url, '?') === false ? '?' : '&') . http_build_query(array_filter($queryParams));

    $response = ExternalService::requestJson($url);
    if ($response['ok'] && is_array($response['data'])) {
        $data = $response['data'];
        $source = 'external';
    }
}

// Local DB read removed.
if (!$data) {
    // Empty data
}

echo json_encode(['source' => $source, 'data' => $data]);
