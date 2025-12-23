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
require_once '../../config/Database.php';
require_once '../../models/TaxiOrder.php';

// Enforce API Key
Auth::authenticate();
// Debug flag to help inspect upstream behavior
$DEBUG = (isset($_GET['debug']) && $_GET['debug'] === '1');


$TAXI_BASE_URL = getenv('EXTERNAL_TAXI_BASE_URL') ?: 'https://taxi-system.infinityfreeapp.com/api';
$TAXI_API_KEY  = getenv('EXTERNAL_TAXI_API_KEY') ?: 'TAXI_GROUP_SECURE_KEY_2024';

$TAXI_SERVICES_PATH = getenv('EXTERNAL_TAXI_SERVICES_PATH') ?: '/services.php';
$TAXI_BOOKINGS_PATH = getenv('EXTERNAL_TAXI_BOOKINGS_PATH') ?: '/bookings.php';

$taxiHeaders = [
    'Content-Type: application/json',
    
    // Try common auth header variants used by external providers
    'X-API-KEY: ' . $TAXI_API_KEY,
    'Api-Key: ' . $TAXI_API_KEY,
    'Authorization: Bearer ' . $TAXI_API_KEY
];

// --- Helper: parse "lon,lat" or "lat,lon" into numeric coords
function parseCoords($value)
{
    if (!is_string($value)) return null;
    $v = trim($value);
    // Accept common separators
    $v = str_replace([';',' '], ',', $v);
    $parts = array_values(array_filter(array_map('trim', explode(',', $v)), fn($p) => $p !== ''));
    if (count($parts) !== 2) return null;
    if (!is_numeric($parts[0]) || !is_numeric($parts[1])) return null;
    $a = (float)$parts[0];
    $b = (float)$parts[1];
    // Heuristic: latitude is between -90..90, longitude -180..180
    $lat = null; $lon = null;
    if (abs($a) <= 90 && abs($b) <= 180) { // assume lat,lon
        $lat = $a; $lon = $b;
    } elseif (abs($a) <= 180 && abs($b) <= 90) { // assume lon,lat
        $lon = $a; $lat = $b;
    } else {
        return null;
    }
    return ['lat' => $lat, 'lon' => $lon];
}

// --- Helper: reverse geocode to human-readable name
function reverseGeocodeName($lat, $lon)
{
    $base = getenv('GEOCODER_BASE_URL') ?: 'https://nominatim.openstreetmap.org/reverse';
    $url = $base . '?format=jsonv2&lat=' . urlencode($lat) . '&lon=' . urlencode($lon);
    $resp = ExternalService::requestJson($url, 'GET');
    if (!$resp['ok'] || !is_array($resp['data'])) return null;
    $data = $resp['data'];
    // Prefer display_name; fallback to composed short name
    if (!empty($data['display_name'])) return $data['display_name'];
    $addr = $data['address'] ?? [];
    $parts = [];
    foreach (['road','neighbourhood','suburb','city','town','state','country'] as $k) {
        if (!empty($addr[$k])) $parts[] = $addr[$k];
    }
    return $parts ? implode(', ', $parts) : null;
}

/* ================================
   POST /api/v1/taxis.php
   -> Book Taxi
================================ */
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $payload = json_decode(file_get_contents('php://input'), true);

    if (!$payload) {
        http_response_code(400);
        echo json_encode(['message' => 'Invalid JSON payload']);
        exit;
    }

    $booking = [
        'user_id'          => $payload['user_id'] ?? $payload['user']['id'] ?? null,
        // Accept both old (pickup/destination) and explicit *_location keys
        'pickup_location'  => $payload['pickup_location'] ?? $payload['pickup'] ?? null,
        'dropoff_location' => $payload['dropoff_location'] ?? $payload['destination'] ?? null,
        'pickup_time'      => $payload['pickup_time'] ?? date('Y-m-d H:i:s'),
        'service_id'       => $payload['service_id'] ?? null,
        'vehicle_type'     => $payload['vehicle_type'] ?? 'standard',
        'schedule'         => $payload['schedule'] ?? 'now'
    ];

    if (
        !$booking['user_id'] ||
        !$booking['pickup_location'] ||
        !$booking['dropoff_location']
    ) {
        http_response_code(400);
        echo json_encode(['message' => 'user_id, pickup_location and dropoff_location are required']);
        exit;
    }

    // Resolve coordinates to human-readable names if needed
    $pickupCoords = parseCoords($booking['pickup_location']);
    $dropCoords = parseCoords($booking['dropoff_location']);
    if ($pickupCoords) {
        $name = reverseGeocodeName($pickupCoords['lat'], $pickupCoords['lon']);
        if ($name) {
            $booking['pickup_location'] = $name;
        }
    }
    if ($dropCoords) {
        $name = reverseGeocodeName($dropCoords['lat'], $dropCoords['lon']);
        if ($name) {
            $booking['dropoff_location'] = $name;
        }
    }

    // Send a payload that includes both legacy and explicit keys for broader provider compatibility
    $externalPayload = array_merge($booking, [
        'pickup' => $booking['pickup_location'],
        'destination' => $booking['dropoff_location'],
        'vehicleType' => $booking['vehicle_type'],
        // Include original coordinates when available for providers that can use them
        'pickup_lat' => $pickupCoords['lat'] ?? null,
        'pickup_lon' => $pickupCoords['lon'] ?? null,
        'destination_lat' => $dropCoords['lat'] ?? null,
        'destination_lon' => $dropCoords['lon'] ?? null,
    ]);

    // Try multiple candidate endpoints for bookings (with and without api_key in query)
    $bookingCandidatesBase = [
        rtrim($TAXI_BASE_URL, '/') . $TAXI_BOOKINGS_PATH,
        rtrim($TAXI_BASE_URL, '/') . '/api/bookings.php',
        rtrim($TAXI_BASE_URL, '/') . '/bookings.php'
    ];
    $bookingCandidates = [];
    foreach ($bookingCandidatesBase as $c) {
        $bookingCandidates[] = $c;
        $bookingCandidates[] = $c . (str_contains($c, '?') ? '&' : '?') . 'api_key=' . urlencode($TAXI_API_KEY);
    }
    $bookingCandidates = array_unique($bookingCandidates);

    $response = null;
    $hitUrl = null;
    $raw = null;
    foreach ($bookingCandidates as $candidate) {
        $resp = ExternalService::requestJson($candidate, 'POST', $externalPayload, $taxiHeaders);
        if ($resp['ok']) {
            $response = $resp;
            $hitUrl = $candidate;
            break;
        }
    }
    if (!$response) {
        // if all fail, keep the last response
        $response = $resp ?? ['ok' => false, 'status' => 0, 'error' => 'No candidates succeeded', 'data' => null];
    }

    $source = 'external';

    if (!$response['ok']) {
        http_response_code(503);
        $out = [
            'message' => 'External taxi service error',
            'status' => $response['status'],
            'error' => $response['error']
        ];
        if ($DEBUG) {
            $out['hit_url'] = $hitUrl;
            $out['candidates'] = $bookingCandidates;
            $out['upstream'] = $response['data'];
        }
        echo json_encode($out);
        exit;
    } else {
        // Normalize external response so frontend fields are populated
        $raw = $response['data'];
        if (is_string($raw)) {
            $decoded = json_decode($raw, true);
            if (is_array($decoded)) {
                $raw = $decoded;
            }
        }

        // Unwrap common envelopes
        if (is_array($raw)) {
            if (isset($raw['data']) && is_array($raw['data'])) {
                $raw = $raw['data'];
            } elseif (isset($raw['ride']) && is_array($raw['ride'])) {
                $raw = $raw['ride'];
            }
        }

        $ride = [
            'ride_id' => $raw['ride_id'] ?? $raw['id'] ?? null,
            'pickup' => $raw['pickup_location'] ?? $raw['pickup'] ?? $booking['pickup_location'],
            'destination' => $raw['dropoff_location'] ?? $raw['destination'] ?? $booking['dropoff_location'],
            'vehicleType' => $raw['vehicleType'] ?? $raw['vehicle_type'] ?? $raw['vehicle'] ?? ($booking['vehicle_type'] ?? null),
            'eta_minutes' => $raw['eta_minutes'] ?? $raw['eta'] ?? null,
            'fare' => $raw['fare'] ?? $raw['price'] ?? null,
            'status' => $raw['status'] ?? 'confirmed',
            'confirmation' => $raw['confirmation'] ?? ($raw['ride_id'] ?? null)
        ];
    }

    // Fill missing fields with sensible fallbacks for client display
    if (!$ride['ride_id']) {
        $ride['ride_id'] = 'ext-' . uniqid();
    }
    if (!isset($ride['confirmation']) || !$ride['confirmation']) {
        $ride['confirmation'] = $ride['ride_id'];
    }
    if ($ride['eta_minutes'] === null) {
        $ride['eta_minutes'] = rand(5, 12);
    }
    if ($ride['fare'] === null) {
        $ride['fare'] = 25.50;
    }

    // Persist booking so admins can view it later
    $dbStatus = ['saved' => false];
    try {
        $database = new Database();
        $db = $database->connect();
        if ($db) {
            $taxiOrder = new TaxiOrder($db);
            $rawDistance = null;
            if (is_array($raw)) {
                $rawDistance = $raw['distance_km'] ?? $raw['distance'] ?? null;
            }

            $storeData = [
                'user_id' => (int) $booking['user_id'],
                'pickup' => $ride['pickup'] ?? $booking['pickup_location'],
                'destination' => $ride['destination'] ?? $booking['dropoff_location'],
                'vehicle_type' => $ride['vehicleType'] ?? $booking['vehicle_type'] ?? 'standard',
                'schedule' => $booking['schedule'] ?? 'now',
                'custom_time' => $booking['pickup_time'] ?? null,
                'distance_km' => is_numeric($rawDistance) ? $rawDistance : 0,
                'fare' => is_numeric($ride['fare']) ? $ride['fare'] : 0,
                'eta_minutes' => is_numeric($ride['eta_minutes']) ? $ride['eta_minutes'] : rand(5, 12)
            ];
            $insertId = $taxiOrder->create($storeData);
            if ($insertId) {
                $dbStatus = ['saved' => true, 'id' => $insertId];
                $ride['db_id'] = $insertId;
            }
        } else {
            $dbStatus = ['saved' => false, 'error' => 'No DB connection'];
        }
    } catch (Throwable $e) {
        $dbStatus = ['saved' => false, 'error' => $e->getMessage()];
    }

    $out = [
        'source' => $source,
        'message' => $source === 'external' ? 'Taxi booked successfully' : 'Taxi booked successfully (mock fallback)',
        'data' => $ride
    ];
    if ($dbStatus['saved']) {
        $out['db_saved'] = true;
    }
    if ($DEBUG) {
        $out['debug'] = [
            'base_url' => $TAXI_BASE_URL,
            'status' => $response['status'],
            'error' => $response['error'],
            'rawType' => is_string($response['data']) ? 'string' : (is_array($response['data']) ? 'array' : gettype($response['data'])),
            'hit_url' => $hitUrl,
            'candidates' => $bookingCandidates,
            'db' => $dbStatus
        ];
    }
    echo json_encode($out);
    exit;
}

/* ================================
   GET /api/v1/taxis.php
   -> Available Taxis
================================ */
// Try multiple candidate endpoints for services (with and without api_key in query)
$serviceCandidatesBase = [
    rtrim($TAXI_BASE_URL, '/') . $TAXI_SERVICES_PATH,
    rtrim($TAXI_BASE_URL, '/') . '/api/services.php',
    rtrim($TAXI_BASE_URL, '/') . '/services.php'
];
$serviceCandidates = [];
foreach ($serviceCandidatesBase as $c) {
    $serviceCandidates[] = $c;
    $serviceCandidates[] = $c . (str_contains($c, '?') ? '&' : '?') . 'api_key=' . urlencode($TAXI_API_KEY);
}
$serviceCandidates = array_unique($serviceCandidates);

$response = null;
$hitListUrl = null;
$rawListData = null;
foreach ($serviceCandidates as $candidate) {
    $resp = ExternalService::requestJson($candidate, 'GET', null, $taxiHeaders);
    if ($resp['ok']) {
        $response = $resp;
        $hitListUrl = $candidate;
        $rawListData = $resp['data'];
        break;
    }
}
if (!$response) {
    $response = $resp ?? ['ok' => false, 'status' => 0, 'error' => 'No candidates succeeded', 'data' => null];
}

$services = [];

if ($response['ok']) {
    $data = $response['data'];
    // If provider returned raw string (non-JSON 2xx), attempt to decode
    if (!is_array($data) && is_string($data)) {
        $decoded = json_decode($data, true);
        if (is_array($decoded)) {
            $data = $decoded;
        }
    }

    // Unwrap common envelope keys
    if (is_array($data) && isset($data['services']) && is_array($data['services'])) {
        $data = $data['services'];
    } elseif (is_array($data) && isset($data['data']) && is_array($data['data'])) {
        $data = $data['data'];
    }

    if (is_array($data)) {
        $services = array_map(function ($item) {
            return [
                'id' => $item['id'] ?? null,
                'name' => $item['name'] ?? 'Taxi',
                'vehicle_type' => $item['vehicle_type'] ?? $item['type'] ?? 'Standard',
                'capacity' => $item['capacity'] ?? $item['seats'] ?? 4,
                'price_per_km' => $item['price_per_km'] ?? $item['price'] ?? 0,
                'eta_minutes' => $item['eta_minutes'] ?? $item['eta'] ?? rand(3, 10),
                'status' => $item['status'] ?? 'available'
            ];
        }, $data);
    }
$listOut = [
    'source' => 'external',
    'data' => $services
];
if ($DEBUG) {
    // Add raw sample to help diagnose parsing issues
    $rawSample = null;
    if (is_string($rawListData)) {
        $rawSample = substr($rawListData, 0, 500);
    } elseif (is_array($rawListData)) {
        $rawSample = array_slice($rawListData, 0, 3);
    } else {
        $rawSample = $rawListData;
    }

    $listOut['debug'] = [
        'base_url' => $TAXI_BASE_URL,
        'headers' => $taxiHeaders,
        'hit_url' => $hitListUrl,
        'candidates' => $serviceCandidates,
        'status' => $response['status'],
        'error' => $response['error'],
        'raw_sample' => $rawSample
    ];
}
if (!$response['ok'] || !$services) {
    http_response_code(503);
    $listOut['message'] = 'External taxi service unavailable';
}
echo json_encode($listOut);

}