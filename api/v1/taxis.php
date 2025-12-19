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

$baseUrl = getenv('EXTERNAL_TAXI_API');
$fare = null;
$responseData = null;
$source = 'external';

if (!empty($baseUrl) || getenv('EXTERNAL_API_MODE') === 'mock') {
    $url = rtrim($baseUrl ?: 'http://mock-service/taxis', '/');
    $response = ExternalService::requestJson($url, 'POST', [
        'pickup' => $pickup,
        'destination' => $destination,
        'vehicleType' => $vehicle,
        'schedule' => $schedule,
        'customTime' => $customTime
    ]);

    if ($response['ok'] && is_array($response['data'])) {
        $responseData = $response['data'];
        $fare = $responseData['fare'] ?? null;
    } else {
        http_response_code(503);
        echo json_encode(['message' => 'External service error', 'status' => $response['status'], 'error' => $response['error']]);
        exit;
    }
}

if ($fare === null) {
    http_response_code(503);
    echo json_encode(['message' => 'External taxi service unavailable']);
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
