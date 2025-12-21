<?php

 // local or production

header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-API-KEY');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

// Enable error reporting for local debugging
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// Load dependencies
require_once 'middleware/Auth.php';
require_once '../../config/ExternalService.php';
require_once '../../config/Database.php';
require_once '../../models/TaxiOrder.php';

// Enforce API key authentication for partner access
Auth::authenticate();

// Read environment variables
$baseUrl = rtrim(getenv('EXTERNAL_TAXI_API') ?: '', '/');
$apiKey = getenv('EXTERNAL_TAXI_API_KEY');
$appEnv = getenv('APP_ENV') ?: 'local';

// Only require external settings when not in local mode
if ($appEnv !== 'local' && (empty($baseUrl) || empty($apiKey))) {
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
// Extract user id from payload (supports { user: { id } } or direct user_id)
$userId = null;
if (isset($payload['user']) && is_array($payload['user']) && isset($payload['user']['id'])) {
    $userId = intval($payload['user']['id']);
} elseif (isset($payload['user_id'])) {
    $userId = intval($payload['user_id']);
}

if ($pickup === '' || $destination === '') {
    http_response_code(400);
    echo json_encode(['message' => 'pickup and destination are required']);
    exit;
}

if (!$userId) {
    http_response_code(400);
    echo json_encode(['message' => 'user_id is required']);
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

// Prepare default fallback values
$distanceMeters = 2000; // 2 km
$durationSeconds = 300; // 5 minutes

// Call ORS API only if not local or if you want real data
if ($appEnv !== 'local') {
    $url = $baseUrl . '?api_key=' . urlencode($apiKey);

    $response = ExternalService::requestJson($url, 'POST', [
        'coordinates' => [$start, $end]
    ], [
        'Content-Type: application/json'
    ]);

    // Safe logging
    @file_put_contents('/tmp/ors.log', date('Y-m-d H:i:s').' '.json_encode($response).PHP_EOL, FILE_APPEND);

    if ($response['ok'] && is_array($response['data']) && !empty($response['data']['features'])) {
        $data = $response['data'];
        $firstFeature = $data['features'][0];
        $properties = $firstFeature['properties'] ?? [];
        $summary = $properties['summary'] ?? null;

        if ($summary && isset($summary['distance'], $summary['duration'])) {
            $distanceMeters = $summary['distance'];
            $durationSeconds = $summary['duration'];
        } elseif (!empty($properties['segments'][0]) && isset($properties['segments'][0]['distance'], $properties['segments'][0]['duration'])) {
            $distanceMeters = $properties['segments'][0]['distance'];
            $durationSeconds = $properties['segments'][0]['duration'];
        }
    }
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

// Persist order to database
try {
    $database = new Database();
    $db = $database->connect();
    if (!$db) {
        throw new Exception('Database connection failed');
    }
    // Normalize custom time to a DATETIME string if provided as HH:mm and schedule is custom
    $customDateTime = null;
    if ($schedule === 'custom' && is_string($customTime) && preg_match('/^\d{2}:\d{2}$/', $customTime)) {
        $customDateTime = date('Y-m-d') . ' ' . $customTime . ':00';
    } elseif (!empty($customTime)) {
        // Attempt to use provided value directly if it looks like a datetime
        $customDateTime = $customTime;
    }

    $order = new TaxiOrder($db);
    $orderId = $order->create([
        'user_id' => $userId,
        'pickup' => $pickup,
        'destination' => $destination,
        'vehicle_type' => $vehicle,
        'schedule' => $schedule,
        'custom_time' => $customDateTime,
        'distance_km' => $distanceKm,
        'fare' => $fare,
        'eta_minutes' => $durationMinutes
    ]);
    $responseData['order_id'] = intval($orderId);
} catch (Throwable $e) {
    // If persistence fails, return a 503 with error message
    http_response_code(503);
    echo json_encode(['message' => 'Taxi order not saved', 'error' => $e->getMessage()]);
    exit;
}

echo json_encode([
    'data' => $responseData,
    'message' => 'Taxi request submitted',
    'confirmation' => $responseData['confirmation']
]);
