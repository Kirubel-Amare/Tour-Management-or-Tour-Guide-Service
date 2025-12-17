<?php
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

require_once '../../config/ExternalService.php';

$baseUrl = getenv('EXTERNAL_HOTEL_API');

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $payload = json_decode(file_get_contents('php://input'), true);

    if (!$payload) {
        http_response_code(400);
        echo json_encode(['message' => 'Invalid JSON payload']);
        exit;
    }

    $reservation = [
        'user' => $payload['user'] ?? null,
        'hotel_id' => $payload['hotel_id'] ?? null,
        'check_in' => $payload['check_in'] ?? null,
        'check_out' => $payload['check_out'] ?? null,
        'guests' => $payload['guests'] ?? 1,
        'roomType' => $payload['roomType'] ?? 'Standard'
    ];

    if (!$reservation['hotel_id'] || !$reservation['check_in'] || !$reservation['check_out']) {
        http_response_code(400);
        echo json_encode(['message' => 'hotel_id, check_in, and check_out are required']);
        exit;
    }

    $source = 'fallback';
    $data = null;

    if (!empty($baseUrl)) {
        $response = ExternalService::requestJson(rtrim($baseUrl, '/'), 'POST', $reservation);
        if ($response['ok']) {
            $data = $response['data'];
            $source = 'external';
        }
    }

    if ($data === null) {
        $data = array_merge($reservation, [
            'confirmation' => uniqid('hotel_', true),
            'status' => 'confirmed'
        ]);
    }

    echo json_encode(['source' => $source, 'data' => $data]);
    exit;
}

$queryParams = [
    'q' => $_GET['q'] ?? '',
    'city' => $_GET['city'] ?? '',
    'roomType' => $_GET['room_type'] ?? '',
    'minRating' => $_GET['rating'] ?? ''
];

$source = 'fallback';
$data = [];

if (!empty($baseUrl)) {
    $url = rtrim($baseUrl, '/');
    $url .= (strpos($url, '?') === false ? '?' : '&') . http_build_query(array_filter($queryParams));

    $response = ExternalService::requestJson($url);
    if ($response['ok'] && is_array($response['data'])) {
        $data = $response['data'];
        $source = 'external';
    }
}

if (!$data) {
    $data = [
        [
            'id' => 1,
            'name' => 'Paris Luxury Hotel',
            'location' => 'Paris, France',
            'price' => 299.99,
            'rating' => 4.8,
            'reviews' => 456,
            'description' => '5-star hotel in the heart of Paris with panoramic views of the Eiffel Tower.',
            'image' => 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80',
            'roomType' => 'Suite',
            'hotelRating' => 5,
            'amenities' => ['Wi-Fi', 'Pool', 'Spa', 'Restaurant', 'Gym']
        ],
        [
            'id' => 2,
            'name' => 'Tokyo Central Hotel',
            'location' => 'Tokyo, Japan',
            'price' => 199.99,
            'rating' => 4.6,
            'reviews' => 321,
            'description' => 'Modern hotel located in central Tokyo with easy access to major attractions.',
            'image' => 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80',
            'roomType' => 'Double',
            'hotelRating' => 4,
            'amenities' => ['Wi-Fi', 'Restaurant', 'Concierge', 'Laundry']
        ]
    ];
}

echo json_encode(['source' => $source, 'data' => $data]);
