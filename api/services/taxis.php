<?php
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

require_once '../../config/ExternalService.php';
require_once '../../config/Database.php';
require_once '../../models/TaxiOrder.php';

$database = new Database();
$db = $database->connect();
$taxiModel = new TaxiOrder($db);

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
$source = 'fallback';

if (!empty($baseUrl)) {
    $url = rtrim($baseUrl, '/');
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
        $source = 'external';
    }
}

if ($fare === null) {
    $distanceKm = 10 + rand(0, 10);
    $rates = [
        'standard' => 2.5,
        'premium' => 3.5,
        'van' => 4.5,
        'luxury' => 6.0
    ];
    $rate = $rates[$vehicle] ?? $rates['standard'];
    $fare = round($distanceKm * $rate, 2);

    $responseData = [
        'ride_id' => uniqid('ride_', true),
        'pickup' => $pickup,
        'destination' => $destination,
        'vehicleType' => $vehicle,
        'schedule' => $schedule === 'custom' ? $customTime : $schedule,
        'distance_km' => $distanceKm,
        'eta_minutes' => max(5, (int)($distanceKm * 2)),
        'fare' => $fare
    ];
}

// persist taxi order to DB
$responseData['user_id'] = $payload['user']['id'] ?? 0;
$taxiModel->create([
    'user_id' => $responseData['user_id'],
    'pickup' => $pickup,
    'destination' => $destination,
    'vehicle_type' => $vehicle,
    'schedule' => $schedule,
    'custom_time' => $customTime,
    'distance_km' => $responseData['distance_km'],
    'fare' => $responseData['fare'],
    'eta_minutes' => $responseData['eta_minutes']
]);

echo json_encode(['source' => $source, 'data' => $responseData]);
