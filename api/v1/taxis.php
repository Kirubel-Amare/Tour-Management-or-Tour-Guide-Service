<?php
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-API-KEY');


if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

// Enable error reporting for debugging (remove in production)
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// Load dependencies
require_once 'middleware/Auth.php';
require_once '../../config/ExternalService.php';

// Read environment variables
$baseUrl = rtrim(getenv('EXTERNAL_TAXI_API') ?: '', '/');
$apiKey = getenv('EXTERNAL_TAXI_API_KEY');

if (empty($baseUrl) || empty($apiKey)) {
    http_response_code(500);
    echo json_encode(['message' => 'EXTERNAL_TAXI_API and EXTERNAL_TAXI_API_KEY are required']);
    exit;
}

// Read JSON payload
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

// Parse coordinates
function parseCoords($value) {
    $parts = array_map('trim', explode(',', $value));
    if (count($parts) !== 2 || !is_numeric($parts[0]) || !is_numeric($parts[1])) {
        return null;
    }
    return [floatval($parts[0]), floatval($parts[1])]; // [lon, lat]
}

$start = parseCoords($pickup);
$end = parseCoords($destination);

if (!$start || !$end) {
    http_response_code(400);
    echo json_encode(['message' => 'Coordinates must be in "lon,lat" format, e.g., "-73.9857,40.7484"']);
    exit;
}

// Build ORS request URL
$url = $baseUrl . '?api_key=' . urlencode($apiKey);

// Call ORS API
$response = ExternalService::requestJson($url, 'POST', [
    'coordinates' => [$start, $end]
], [
    'Content-Type: application/json'
]);

// Log raw ORS response for debugging
file_put_contents('ors.log', date('Y-m-d H:i:s') . ' ' . json_encode($response) . PHP_EOL, FILE_APPEND);

// Handle failed request
if (!$response['ok'] || !is_array($response['data'])) {
    echo json_encode([
        'message' => 'External taxi service unavailable',
        'provider' => 'openrouteservice',
        'details' => $response
    ]);
    exit;
}

$data = $response['data'];
$firstFeature = $data['features'][0] ?? null;
$properties = $firstFeature['properties'] ?? [];
$summary = $properties['summary'] ?? null;

// Extract distance and duration
$distanceMeters = null;
$durationSeconds = null;

if ($summary && isset($summary['distance'], $summary['duration'])) {
    $distanceMeters = $summary['distance'];
    $durationSeconds = $summary['duration'];
} elseif (!empty($properties['segments'][0]) && isset($properties['segments'][0]['distance'], $properties['segments'][0]['duration'])) {
    $distanceMeters = $properties['segments'][0]['distance'];
    $durationSeconds = $properties['segments'][0]['duration'];
}

// If still null, return friendly message
if ($distanceMeters === null) {
    echo json_encode([
        'message' => 'External taxi service unavailable (no distance returned)',
        'provider' => 'openrouteservice',
        'details' => $data
    ]);
    exit;
}

// Compute fare
$distanceKm = $distanceMeters / 1000;
$durationMinutes = ceil(($durationSeconds ?? 0) / 60);

$rates = [
    'standard' => 2.5,
    'premium' => 3.5,
    'van' => 4.5,
    'luxury' => 6.0
];
$rate = $rates[$vehicle] ?? $rates['standard'];
$fare = round($distanceKm * $rate, 2);

// Prepare response
$responseData = [
    'ride_id' => uniqid('ride_', true),
    'confirmation' => 'TAXI-' . strtoupper(substr(md5(uniqid()), 0, 6)),
    'pickup' => $pickup,
    'destination' => $destination,
    'vehicleType' => $vehicle,
    'schedule' => $schedule,
    'customTime' => $customTime,
    'distance_km' => $distanceKm,
    'eta_minutes' => $durationMinutes,
    'fare' => $fare,
    'provider' => 'openrouteservice'
];

echo json_encode([
    'data' => $responseData,
    'message' => 'Taxi request submitted',
    'confirmation' => $responseData['confirmation']
]);
