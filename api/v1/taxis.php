<?php
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-API-KEY');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

require_once 'middleware/Auth.php';
require_once '../../config/ExternalService.php';

$baseUrl = rtrim(getenv('EXTERNAL_TAXI_API') ?: '', '/');
$taxiHeaders = [];
if ($token = getenv('EXTERNAL_TAXI_API_TOKEN')) {
    $taxiHeaders[] = 'Authorization: Bearer ' . $token;
}
if ($apiKey = getenv('EXTERNAL_TAXI_API_KEY')) {
    $taxiHeaders[] = 'X-API-Key: ' . $apiKey;
}
if ($rapidKey = getenv('EXTERNAL_TAXI_RAPIDAPI_KEY')) {
    $taxiHeaders[] = 'X-RapidAPI-Key: ' . $rapidKey;
}
if ($rapidHost = getenv('EXTERNAL_TAXI_RAPIDAPI_HOST')) {
    $taxiHeaders[] = 'X-RapidAPI-Host: ' . $rapidHost;
}

if (empty($baseUrl)) {
    http_response_code(500);
    echo json_encode(['message' => 'EXTERNAL_TAXI_API is required']);
    exit;
}

$payload = json_decode(file_get_contents('php://input'), true);
if (!$payload) {
    http_response_code(400);
    echo json_encode(['message' => 'Invalid JSON payload']);
    exit;
}

$pickup = trim($payload['pickup'] ?? '');
$destination = trim($payload['destination'] ?? '');
$vehicle = $payload['vehicleType'] ?? 'standard';
$schedule = $payload['schedule'] ?? 'now';
$customTime = $payload['customTime'] ?? null;

if ($pickup === '' || $destination === '') {
    http_response_code(400);
    echo json_encode(['message' => 'pickup and destination are required']);
    exit;
}

// Call external taxi/routing API
$response = ExternalService::requestJson($baseUrl, 'POST', [
    'pickup' => $pickup,
    'destination' => $destination,
    'vehicleType' => $vehicle,
    'schedule' => $schedule,
    'customTime' => $customTime
], $taxiHeaders);

if (!$response['ok'] || !is_array($response['data'])) {
    http_response_code(503);
    echo json_encode(['message' => 'External taxi service error', 'status' => $response['status'], 'error' => $response['error']]);
    exit;
}

$responseData = $response['data'];
$fare = $responseData['fare'] ?? null;

if ($fare === null) {
    http_response_code(503);
    echo json_encode(['message' => 'External taxi service unavailable (no fare returned)']);
    exit;
}

// Persist order logic REMOVED.

$confirmation = is_array($responseData) ? ($responseData['confirmation'] ?? null) : null;
$finalMessage = $confirmation ? 'Taxi dispatched successfully' : 'Taxi request submitted';

echo json_encode([
    'source' => $source,
    'data' => $responseData,
    'message' => $finalMessage,
    'confirmation' => $confirmation
]);
