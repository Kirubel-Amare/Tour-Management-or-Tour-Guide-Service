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

// Enforce API Key
Auth::authenticate();

/* ================================
   CONFIG
================================ */
$TAXI_BASE_URL = 'https://taxi-system.infinityfreeapp.com/api';
$TAXI_API_KEY  = getenv('EXTERNAL_TAXI_API_KEY') ?: 'TAXI_GROUP_SECURE_KEY_2024';

$taxiHeaders = [
    'Content-Type: application/json',
    'X-API-KEY: ' . $TAXI_API_KEY
];

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

    // Send a payload that includes both legacy and explicit keys for broader provider compatibility
    $externalPayload = array_merge($booking, [
        'pickup' => $booking['pickup_location'],
        'destination' => $booking['dropoff_location'],
        'vehicleType' => $booking['vehicle_type'],
    ]);

    $response = ExternalService::requestJson(
        $TAXI_BASE_URL . '/bookings.php',
        'POST',
        $externalPayload,
        $taxiHeaders
    );

    if (!$response['ok']) {
        // Fallback mock when external provider fails
        $mock = [
            'ride_id' => 'mock-taxi-' . uniqid(),
            'pickup' => $booking['pickup_location'],
            'destination' => $booking['dropoff_location'],
            'vehicleType' => $booking['vehicle_type'] ?? 'standard',
            'eta_minutes' => rand(4, 12),
            'fare' => rand(10, 40),
            'status' => 'mock-confirmed'
        ];
        http_response_code(200);
        echo json_encode([
            'source' => 'mock',
            'message' => 'Taxi booked successfully (mock fallback)',
            'data' => $mock
        ]);
        exit;
    }

    echo json_encode([
        'source' => 'external',
        'message' => 'Taxi booked successfully',
        'data' => $response['data']
    ]);
    exit;
}

/* ================================
   GET /api/v1/taxis.php
   -> Available Taxis
================================ */
$response = ExternalService::requestJson(
    $TAXI_BASE_URL . '/services.php',
    'GET',
    null,
    $taxiHeaders
);

$services = [];

if ($response['ok'] && is_array($response['data'])) {
    $services = array_map(function ($item) {
        return [
            'id' => $item['id'] ?? null,
            'name' => $item['name'] ?? 'Taxi',
            'vehicle_type' => $item['vehicle_type'] ?? 'Standard',
            'capacity' => $item['capacity'] ?? 4,
            'price_per_km' => $item['price_per_km'] ?? 0,
            'eta_minutes' => $item['eta_minutes'] ?? rand(3, 10),
            'status' => 'available'
        ];
    }, $response['data']);
} else {
    // Mock fallback if external list fails
    $services = [
        [
            'id' => 'mock-std',
            'name' => 'Standard Taxi',
            'vehicle_type' => 'standard',
            'capacity' => 4,
            'price_per_km' => 2.5,
            'eta_minutes' => rand(4, 10),
            'status' => 'available'
        ],
        [
            'id' => 'mock-van',
            'name' => 'Van',
            'vehicle_type' => 'van',
            'capacity' => 6,
            'price_per_km' => 4.0,
            'eta_minutes' => rand(6, 14),
            'status' => 'available'
        ]
    ];
}

echo json_encode([
    'source' => 'external',
    'data' => $services
]);
