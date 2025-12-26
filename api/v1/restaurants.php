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

$BASE_URL = 'https://restaurant-management.page.gd/api/service-provider.php';
$SERVICE_API_KEY = 'TOUR_SERVICE_KEY_2025';

$headers = [
    'Content-Type: application/json',
    'X-API-Key: ' . $SERVICE_API_KEY
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
   GET – SERVICE INFO
========================= */
if ($_SERVER['REQUEST_METHOD'] === 'GET' && $action === 'service_info') {
    $url = $BASE_URL . '?action=service_info';
    $resp = ExternalService::requestJson($url, 'GET', null, $headers);
    if (!$resp['ok']) {
        http_response_code(503);
        echo json_encode([
            'message' => 'Service unavailable',
            'error' => $resp['error']
        ]);
        exit;
    }
    echo json_encode($resp['data']);
    exit;
}

/* =========================
   GET – LIST RESTAURANTS
========================= */
if ($_SERVER['REQUEST_METHOD'] === 'GET' && $action === 'restaurants') {
    $url = $BASE_URL . '?action=restaurants';
    $params = [];
    if (!empty($_GET['cuisine'])) $params['cuisine'] = $_GET['cuisine'];
    if (!empty($_GET['price_range'])) $params['price_range'] = $_GET['price_range'];
    if (!empty($params)) {
        $url .= '&' . http_build_query($params);
    }
    $resp = ExternalService::requestJson($url, 'GET', null, $headers);
    if (!$resp['ok']) {
        http_response_code(503);
        echo json_encode([
            'message' => 'Restaurant service unavailable',
            'error' => $resp['error']
        ]);
        exit;
    }
    echo json_encode($resp['data']);
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
    echo json_encode($resp['data']);
    exit;
}

/* =========================
   GET – RESTAURANT MENU
========================= */
if ($_SERVER['REQUEST_METHOD'] === 'GET' && $action === 'menu') {
    $restaurant_id = $_GET['restaurant_id'] ?? null;
    if (!$restaurant_id) {
        http_response_code(400);
        echo json_encode(['message' => 'restaurant_id is required']);
        exit;
    }
    $url = $BASE_URL . '?action=menu&restaurant_id=' . urlencode($restaurant_id);
    $resp = ExternalService::requestJson($url, 'GET', null, $headers);
    if (!$resp['ok']) {
        http_response_code(503);
        echo json_encode(['message' => 'External service error']);
        exit;
    }
    echo json_encode($resp['data']);
    exit;
}

/* =========================
   GET – CHECK AVAILABILITY
========================= */
if ($_SERVER['REQUEST_METHOD'] === 'GET' && $action === 'check_availability') {
    $restaurant_id = $_GET['restaurant_id'] ?? null;
    $date = $_GET['date'] ?? null;
    $time = $_GET['time'] ?? null;
    $guests = $_GET['guests'] ?? null;
    if (!$restaurant_id || !$date || !$time || !$guests) {
        http_response_code(400);
        echo json_encode(['message' => 'Missing required parameters']);
        exit;
    }
    $url = $BASE_URL . '?action=check_availability&restaurant_id=' . urlencode($restaurant_id) . '&date=' . urlencode($date) . '&time=' . urlencode($time) . '&guests=' . urlencode($guests);
    $resp = ExternalService::requestJson($url, 'GET', null, $headers);
    if (!$resp['ok']) {
        http_response_code(503);
        echo json_encode(['message' => 'External service error']);
        exit;
    }
    echo json_encode($resp['data']);
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
    $required = ['restaurant_id','customer_name','customer_email','customer_phone','date','time','guests'];
    foreach ($required as $f) {
        if (empty($payload[$f])) {
            http_response_code(400);
            echo json_encode(['message' => "Missing required field: $f"]);
            exit;
        }
    }
    $data = [
        'restaurant_id' => $payload['restaurant_id'],
        'customer_name' => $payload['customer_name'],
        'customer_email' => $payload['customer_email'],
        'customer_phone' => $payload['customer_phone'],
        'date' => $payload['date'],
        'time' => $payload['time'],
        'guests' => $payload['guests'],
        'special_requests' => $payload['special_requests'] ?? '',
        'external_booking_id' => $payload['external_booking_id'] ?? ''
    ];
    $url = $BASE_URL . '?action=create_reservation';
    $resp = ExternalService::requestJson($url, 'POST', $data, $headers);
    if (!$resp['ok']) {
        $error = $resp['data']['message'] ?? 'Reservation failed';
        http_response_code($resp['data']['code'] ?? 503);
        echo json_encode([
            'success' => false,
            'message' => $error,
            'code' => $resp['data']['code'] ?? 503
        ]);
        exit;
    }
    echo json_encode($resp['data']);
    exit;
}

/* =========================
   FALLBACK
========================= */
http_response_code(404);
echo json_encode(['message' => 'Invalid endpoint']);
