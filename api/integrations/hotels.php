<?php
// Proxy to Group 6 Hotel Management API - list hotels or get by id
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
$endpoint = rtrim($base, '/') . '/hotels.php';
$query = $_SERVER['QUERY_STRING'] ?? '';
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
