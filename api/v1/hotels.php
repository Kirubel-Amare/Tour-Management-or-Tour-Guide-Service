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

$baseUrl = getenv('EXTERNAL_HOTEL_API');

// Public API: POST /api/v1/hotels.php (Book Hotel)
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $payload = json_decode(file_get_contents('php://input'), true);

    if (!$payload) {
        http_response_code(400);
        echo json_encode(['message' => 'Invalid JSON payload']);
        exit;
    }

    // Adapt payload to match internal structure if needed, or enforce schema
    $reservation = [
        'user' => $payload['user'] ?? ['id' => 0], // External users might not map to internal IDs easily
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

    $source = 'external';
    $data = null;

    if (!empty($baseUrl) || getenv('EXTERNAL_API_MODE') === 'mock') {
        $response = ExternalService::requestJson(rtrim($baseUrl ?: 'http://mock-service/hotels', '/'), 'POST', $reservation);
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
        echo json_encode(['message' => 'External hotel service unavailable']);
        exit;
    }

    $confirmation = is_array($data) ? ($data['confirmation'] ?? null) : null;
    $finalMessage = $confirmation ? 'Hotel booking confirmed' : 'Hotel booking submitted';

    echo json_encode([
        'source' => $source,
        'data' => $data,
        'message' => $finalMessage,
        'confirmation' => $confirmation
    ]);
    exit;
}

// Public API: GET /api/v1/hotels.php (Search Hotels)
$queryParams = [
    'q' => $_GET['q'] ?? '',
    'city' => $_GET['city'] ?? '',
    'roomType' => $_GET['room_type'] ?? '',
    'minRating' => $_GET['rating'] ?? ''
];

$source = 'db';
$data = [];

if (!empty($baseUrl) || getenv('EXTERNAL_API_MODE') === 'mock') {
    $url = rtrim($baseUrl ?: 'http://mock-service/hotels', '/');
    $url .= (strpos($url, '?') === false ? '?' : '&') . http_build_query(array_filter($queryParams));

    $response = ExternalService::requestJson($url);
    if ($response['ok'] && is_array($response['data'])) {
        $data = $response['data'];
        $source = 'external';
    }
}

// Local DB read removed.
// Data comes exclusively from external API.
if (!$data) {
    // Empty data if external failed or returned nothing
}

echo json_encode(['source' => $source, 'data' => $data]);
