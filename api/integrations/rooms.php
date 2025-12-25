<?php
// Proxy to Group 6 Hotel Management API - room availability
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

require_once __DIR__ . '/../../config/ExternalService.php';

$base = getenv('HOTEL_API_BASE_URL') ?: 'http://hotelmanagemt.infinityfreeapp.com/api';
$endpoint = rtrim($base, '/') . '/rooms.php';
$query = $_SERVER['QUERY_STRING'] ?? '';

// Basic validation
parse_str($query, $params);
if (empty($params['hotel_id']) || empty($params['check_in']) || empty($params['check_out'])) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'status' => 400, 'error' => 'hotel_id, check_in, check_out are required']);
    exit;
}

$url = $endpoint . ($query ? '?' . $query : '');

$apiKey = getenv('HOTEL_GROUP6_API_KEY') ?: 'HOTEL_GROUP6_API_KEY_2024';
$headers = [
    'X-API-Key: ' . $apiKey
];
$response = ExternalService::requestJson($url, 'GET', null, $headers);

http_response_code($response['status'] ?: 500);
echo json_encode([
    'ok' => $response['ok'],
    'status' => $response['status'],
    'error' => $response['error'],
    'data' => $response['data']
]);
