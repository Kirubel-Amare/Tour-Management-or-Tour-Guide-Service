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
// OpenRouteService expects `Authorization: <api-key>` (no Bearer). Preserve Bearer if a token is provided.
if ($token = getenv('EXTERNAL_TAXI_API_TOKEN')) {
    $taxiHeaders[] = 'Authorization: Bearer ' . $token;
}
if ($apiKey = getenv('EXTERNAL_TAXI_API_KEY')) {
    $taxiHeaders[] = 'Authorization: ' . $apiKey; // ORS supports header auth
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

// OpenRouteService requires coordinates: "lon,lat". Parse and validate.
function parseCoords($value)
{
    $parts = array_map('trim', explode(',', $value));
    if (count($parts) !== 2) {
        return null;
    }
    if (!is_numeric($parts[0]) || !is_numeric($parts[1])) {
        return null;
    }
    return [floatval($parts[0]), floatval($parts[1])]; // [lon, lat]
}

$start = parseCoords($pickup);
$end = parseCoords($destination);
if (!$start || !$end) {
    http_response_code(400);
    echo json_encode(['message' => 'For OpenRouteService set pickup and destination as "lon,lat" (e.g., "-73.9857,40.7484").']);
    exit;
}

// Build URL with api_key query param as a fallback (ORS supports both header and query)
$url = $baseUrl;
if (!empty($apiKey)) {
    $url .= (strpos($baseUrl, '?') === false ? '?' : '&') . 'api_key=' . urlencode($apiKey);
}

// Call external routing API (OpenRouteService directions)
$response = ExternalService::requestJson($url, 'POST', [
    'coordinates' => [$start, $end]
], $taxiHeaders);

if (!$response['ok'] || !is_array($response['data'])) {
    http_response_code(503);
    echo json_encode([
        'message' => 'External taxi service error',
        'provider' => 'openrouteservice',
        'status' => $response['status'],
        'error' => $response['error'],
        'details' => $response['data']
    ]);
    exit;
}

$data = $response['data'];
$firstFeature = $data['features'][0] ?? null;
$properties = $firstFeature['properties'] ?? [];
$summary = $properties['summary'] ?? null;

// Prefer summary; fallback to first segment if summary missing
$distanceMeters = null;
$durationSeconds = null;
if ($summary && isset($summary['distance'], $summary['duration'])) {
    $distanceMeters = $summary['distance'];
    $durationSeconds = $summary['duration'];
} elseif (!empty($properties['segments']) && isset($properties['segments'][0]['distance'], $properties['segments'][0]['duration'])) {
    $distanceMeters = $properties['segments'][0]['distance'];
    $durationSeconds = $properties['segments'][0]['duration'];
}

if ($distanceMeters === null) {
    http_response_code(503);
    echo json_encode(['message' => 'External taxi service unavailable (no distance returned)', 'provider' => 'openrouteservice']);
    exit;
}

$distanceKm = $distanceMeters / 1000; // meters -> km
$durationMinutes = ceil(($durationSeconds ?? 0) / 60); // seconds -> minutes

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
    'confirmation' => 'TAXI-' . strtoupper(substr(md5(uniqid()), 0, 6)),
    'pickup' => $pickup,
    'destination' => $destination,
    'vehicleType' => $vehicle,
    'schedule' => $schedule,
    'customTime' => $customTime,
    'distance_km' => $distanceKm,
    'eta_minutes' => $durationMinutes ?? 10,
    'fare' => $fare,
    'provider' => 'openrouteservice'
];

$finalMessage = 'Taxi request submitted';

echo json_encode([
    'source' => $source,
    'data' => $responseData,
    'message' => $finalMessage,
    'confirmation' => $responseData['confirmation']
]);
