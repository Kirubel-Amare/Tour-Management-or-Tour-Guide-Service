<?php
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-API-KEY');

ini_set('display_errors', '0');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

// Polyfill for getallheaders() if missing
if (!function_exists('getallheaders')) {
    function getallheaders() {
        $headers = [];
        foreach ($_SERVER as $name => $value) {
            if (substr($name, 0, 5) === 'HTTP_') {
                $key = str_replace(' ', '-', ucwords(strtolower(str_replace('_', ' ', substr($name, 5)))));
                $headers[$key] = $value;
            }
        }
        return $headers;
    }
}

require_once 'middleware/Auth.php';
require_once '../../config/ExternalService.php';

/* =========================
   DEFAULT ACTION
========================= */
if (!isset($_GET['action']) || $_GET['action'] === '') {
    $_GET['action'] = 'restaurants';
}
$action = $_GET['action'];

/* =========================
   AUTH
========================= */
// Public endpoints: no API key required
Auth::authenticate([
    'restaurants',
    'restaurant_details'
]);

/* =========================
   CONFIG
========================= */
$DEBUG = isset($_GET['debug']) && $_GET['debug'] === '1';
$BASE_URL = 'https://restaurant-managment-system.free.nf/api/service-provider.php';
$SERVICE_API_KEY = 'TOUR_SERVICE_KEY_2025';

$headers = [
    'Content-Type: application/json',
    'X-API-KEY: ' . $SERVICE_API_KEY
];

/* =========================
   HELPERS
========================= */
function pickRestaurantImage($item) {
    if (!is_array($item)) return null;
    foreach (['image','image_url','photo','thumbnail','logo','cover','banner'] as $k) {
        if (!empty($item[$k])) return $item[$k];
    }
    return null;
}

/* =========================
   GET – LIST RESTAURANTS
========================= */
if ($_SERVER['REQUEST_METHOD'] === 'GET' && $action === 'restaurants') {
    $url = $BASE_URL . '?action=restaurants';
    $resp = ExternalService::requestJson($url, 'GET', null, $headers);

    if (!$resp['ok']) {
        http_response_code(503);
        echo json_encode([
            'message' => 'Restaurant service unavailable',
            'error' => $resp['error']
        ]);
        exit;
    }

    $raw = $resp['data']['data'] ?? $resp['data'] ?? [];
    $restaurants = array_map(function ($r) {
        return [
            'id' => $r['id'] ?? null,
            'name' => $r['name'] ?? 'Restaurant',
            'cuisine' => $r['cuisine'] ?? 'International',
            'address' => $r['address'] ?? $r['location'] ?? '',
            'phone' => $r['phone'] ?? '',
            'rating' => isset($r['rating']) ? (float)$r['rating'] : null,
            'price_range' => $r['price_range'] ?? '',
            'image' => pickRestaurantImage($r)
        ];
    }, is_array($raw) ? $raw : []);

    echo json_encode([
        'source' => 'external',
        'message' => 'Restaurants retrieved successfully',
        'data' => $restaurants,
        $DEBUG ? 'debug' : null => $DEBUG ? $raw : null
    ]);
    exit;
}

/* =========================
   GET – RESTAURANT DETAILS
========================= */
if ($_SERVER['REQUEST_METHOD'] === 'GET' && $action === 'restaurant_details') {
    $id = $_GET['id'] ?? null;
    if (!$id) {
        http_response_code(400);
        echo json_encode(['message' => 'id is required']);
        exit;
    }

    $url = $BASE_URL . '?action=restaurant_details&id=' . urlencode($id);
    $resp = ExternalService::requestJson($url, 'GET', null, $headers);

    if (!$resp['ok']) {
        http_response_code(503);
        echo json_encode(['message' => 'External service error']);
        exit;
    }

    $r = $resp['data']['data'] ?? $resp['data'];

    echo json_encode([
        'source' => 'external',
        'message' => 'Restaurant details retrieved',
        'data' => [
            'id' => $r['id'] ?? null,
            'name' => $r['name'] ?? '',
            'description' => $r['description'] ?? '',
            'cuisine' => $r['cuisine'] ?? '',
            'address' => $r['address'] ?? '',
            'phone' => $r['phone'] ?? '',
            'rating' => isset($r['rating']) ? (float)$r['rating'] : null,
            'opening_hours' => $r['opening_hours'] ?? '',
            'capacity' => $r['seating_capacity'] ?? null
        ]
    ]);
    exit;
}

/* =========================
   POST – CREATE RESERVATION
========================= */
if ($_SERVER['REQUEST_METHOD'] === 'POST' && $action === 'create_reservation') {
    $payload = json_decode(file_get_contents('php://input'), true);
    if (!$payload) {
        http_response_code(400);
        echo json_encode(['message' => 'Invalid JSON payload']);
        exit;
    }

    foreach (['restaurant_id','customer_name','customer_phone','date','time','guests'] as $f) {
        if (empty($payload[$f])) {
            http_response_code(400);
            echo json_encode(['message' => "$f is required"]);
            exit;
        }
    }

    $url = $BASE_URL . '?action=create_reservation';
    $resp = ExternalService::requestJson($url, 'POST', $payload, $headers);

    if (!$resp['ok']) {
        http_response_code(503);
        echo json_encode(['message' => 'Reservation failed']);
        exit;
    }

    echo json_encode([
        'source' => 'external',
        'message' => 'Reservation created successfully',
        'data' => $resp['data']
    ]);
    exit;
}

/* =========================
   FALLBACK
========================= */
http_response_code(404);
echo json_encode(['message' => 'Invalid endpoint']);
