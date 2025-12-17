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

$baseUrl = getenv('EXTERNAL_RESTAURANT_API');

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $payload = json_decode(file_get_contents('php://input'), true);

    if (!$payload) {
        http_response_code(400);
        echo json_encode(['message' => 'Invalid JSON payload']);
        exit;
    }

    $reservation = [
        'user' => $payload['user'] ?? null,
        'restaurant_id' => $payload['restaurant_id'] ?? null,
        'date' => $payload['date'] ?? null,
        'time' => $payload['time'] ?? null,
        'guests' => $payload['guests'] ?? 2,
        'notes' => $payload['notes'] ?? ''
    ];

    if (!$reservation['restaurant_id'] || !$reservation['date'] || !$reservation['time']) {
        http_response_code(400);
        echo json_encode(['message' => 'restaurant_id, date, and time are required']);
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
            'confirmation' => uniqid('restaurant_', true),
            'status' => 'confirmed'
        ]);
    }

    echo json_encode(['source' => $source, 'data' => $data]);
    exit;
}

$queryParams = [
    'q' => $_GET['q'] ?? '',
    'city' => $_GET['city'] ?? '',
    'cuisine' => $_GET['cuisine'] ?? '',
    'priceRange' => $_GET['price'] ?? ''
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
            'name' => 'Le Gourmet Paris',
            'location' => 'Paris, France',
            'cuisine' => 'French',
            'priceRange' => '$$$$',
            'rating' => 4.9,
            'reviews' => 287,
            'description' => 'Michelin-starred restaurant offering exquisite French cuisine with a modern twist.',
            'image' => 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80',
            'features' => ['Fine dining', 'Wine pairing', 'Romantic ambiance', "Chef's table"]
        ],
        [
            'id' => 2,
            'name' => 'Tokyo Sushi Master',
            'location' => 'Tokyo, Japan',
            'cuisine' => 'Japanese',
            'priceRange' => '$$$',
            'rating' => 4.8,
            'reviews' => 412,
            'description' => 'Authentic sushi experience with fresh ingredients and master chefs.',
            'image' => 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80',
            'features' => ['Omakase', 'Sushi bar', 'Fresh seafood', 'Traditional']
        ]
    ];
}

echo json_encode(['source' => $source, 'data' => $data]);
