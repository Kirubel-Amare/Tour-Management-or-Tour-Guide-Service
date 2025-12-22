<?php

/* ================== HEADERS ================== */
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

/* ================== CONFIG ================== */
$TAXI_API_BASE = rtrim(getenv('EXTERNAL_TAXI_API'), '/');
$TAXI_API_KEY  = getenv('EXTERNAL_TAXI_API_KEY');

if (!$TAXI_API_BASE || !$TAXI_API_KEY) {
    http_response_code(500);
    echo json_encode(['message' => 'Taxi API configuration missing']);
    exit;
}

/* ================== HELPER ================== */
function taxiRequest(string $url, string $method = 'GET', array $payload = null)
{
    global $TAXI_API_KEY;

    $ch = curl_init($url);

    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_CUSTOMREQUEST  => $method,
        CURLOPT_HTTPHEADER     => [
            'Content-Type: application/json',
            'X-API-KEY: ' . $TAXI_API_KEY
        ]
    ]);

    if ($payload) {
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
    }

    $response = curl_exec($ch);
    $status   = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    return [
        'ok' => $status >= 200 && $status < 300,
        'status' => $status,
        'data' => json_decode($response, true)
    ];
}

/* ================== ROUTING ================== */
$method = $_SERVER['REQUEST_METHOD'];

/* ============================================================
   GET → AVAILABLE TAXIS
   ============================================================ */
if ($method === 'GET') {

    $result = taxiRequest($TAXI_API_BASE . '/services.php');

    if (!$result['ok']) {
        http_response_code(502);
        echo json_encode(['message' => 'Failed to fetch taxi services']);
        exit;
    }

    echo json_encode([
        'message' => 'Available taxis',
        'data' => $result['data']
    ]);
    exit;
}

/* ============================================================
   POST → BOOK TAXI
   ============================================================ */
if ($method === 'POST') {

    $input = json_decode(file_get_contents('php://input'), true);

    if (!$input) {
        http_response_code(400);
        echo json_encode(['message' => 'Invalid JSON payload']);
        exit;
    }

    $userId   = intval($input['user_id'] ?? 0);
    $pickup   = trim($input['pickup_location'] ?? '');
    $dropoff  = trim($input['dropoff_location'] ?? '');
    $service  = intval($input['service_id'] ?? 1);
    $time     = $input['pickup_time'] ?? date('Y-m-d H:i:s');

    if (!$userId || !$pickup || !$dropoff) {
        http_response_code(400);
        echo json_encode(['message' => 'Missing required fields']);
        exit;
    }

    $payload = [
        'user_id' => $userId,
        'pickup_location' => $pickup,
        'dropoff_location' => $dropoff,
        'pickup_time' => $time,
        'service_id' => $service
    ];

    $result = taxiRequest($TAXI_API_BASE . '/bookings.php', 'POST', $payload);

    if (!$result['ok']) {
        http_response_code(502);
        echo json_encode([
            'message' => 'Taxi booking failed',
            'provider_error' => $result['data']
        ]);
        exit;
    }

    echo json_encode([
        'message' => 'Taxi booked successfully',
        'provider_response' => $result['data']
    ]);
    exit;
}

/* ================== FALLBACK ================== */
http_response_code(405);
echo json_encode(['message' => 'Method not allowed']);
