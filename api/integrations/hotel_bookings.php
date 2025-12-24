<?php
// Proxy to Group 6 Hotel Management API - create booking (requires partner token)
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['ok' => false, 'status' => 405, 'error' => 'Method not allowed']);
    exit;
}

require_once __DIR__ . '/../../config/ExternalService.php';

$token = getenv('HOTEL_API_TOKEN');
if (!$token) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'status' => 400, 'error' => 'HOTEL_API_TOKEN not set. Provide partner token to create bookings.']);
    exit;
}

$base = getenv('HOTEL_API_BASE_URL') ?: 'http://hotelmanagemt.infinityfreeapp.com/api';
$endpoint = rtrim($base, '/') . '/bookings.php';

$raw = file_get_contents('php://input');
$payload = json_decode($raw, true);
if (!is_array($payload)) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'status' => 400, 'error' => 'Invalid JSON payload']);
    exit;
}

$response = ExternalService::requestJson(
    $endpoint,
    'POST',
    $payload,
    ['Authorization: Bearer ' . $token]
);

http_response_code($response['status'] ?: 500);
echo json_encode([
    'ok' => $response['ok'],
    'status' => $response['status'],
    'error' => $response['error'],
    'data' => $response['data']
]);
