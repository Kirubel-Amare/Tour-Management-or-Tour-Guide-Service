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

// Enforce API key authentication for partner access
Auth::authenticate();

$baseUrl = rtrim(getenv('EXTERNAL_RESTAURANT_API') ?: '', '/');
// Optional/typical headers for real providers
$restaurantHeaders = [];
if ($token = getenv('EXTERNAL_RESTAURANT_API_TOKEN')) {
    $restaurantHeaders[] = 'Authorization: Bearer ' . $token;
}
if ($apiKey = getenv('EXTERNAL_RESTAURANT_API_KEY')) {
    $restaurantHeaders[] = 'X-API-Key: ' . $apiKey;
}
if ($rapidKey = getenv('EXTERNAL_RESTAURANT_RAPIDAPI_KEY')) {
    $restaurantHeaders[] = 'X-RapidAPI-Key: ' . $rapidKey;
}
if ($rapidHost = getenv('EXTERNAL_RESTAURANT_RAPIDAPI_HOST')) {
    $restaurantHeaders[] = 'X-RapidAPI-Host: ' . $rapidHost;
}

if (empty($baseUrl)) {
    http_response_code(500);
    echo json_encode(['message' => 'EXTERNAL_RESTAURANT_API is required']);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $payload = json_decode(file_get_contents('php://input'), true);

    if (!$payload) {
        http_response_code(400);
        echo json_encode(['message' => 'Invalid JSON payload']);
        exit;
    }

    $reservation = [
        'user' => $payload['user'] ?? ['id' => 0],
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

    $source = 'external';
    $data = null;

    $response = ExternalService::requestJson($baseUrl, 'POST', $reservation, $restaurantHeaders);
    if ($response['ok']) {
        $data = $response['data'];
    } else {
        http_response_code(503);
        echo json_encode(['message' => 'External service error', 'status' => $response['status'], 'error' => $response['error']]);
        exit;
    }

    $confirmation = is_array($data) ? ($data['confirmation'] ?? null) : null;
    $finalMessage = $confirmation ? 'Restaurant reservation confirmed' : 'Restaurant reservation submitted';

    echo json_encode([
        'source' => $source,
        'data' => $data,
        'message' => $finalMessage,
        'confirmation' => $confirmation
    ]);
    exit;
}

$queryParams = [
    'q' => $_GET['q'] ?? '',
    'city' => $_GET['city'] ?? '',
    'cuisine' => $_GET['cuisine'] ?? '',
    'priceRange' => $_GET['price'] ?? ''
];

$source = 'external';
$data = [];

// Remap to common provider params (e.g., Yelp: location, term, categories, price)
$forwardParams = array_filter($queryParams);
if (!empty($forwardParams['city'])) {
    $forwardParams['location'] = $forwardParams['city'];
    unset($forwardParams['city']);
}
if (!empty($forwardParams['cuisine'])) {
    $forwardParams['categories'] = $forwardParams['cuisine'];
    unset($forwardParams['cuisine']);
}
if (!empty($forwardParams['priceRange'])) {
    // Yelp expects 1,2,3,4 for $, $$, $$$, $$$$
    $priceMap = [' $' => '1', '$$' => '2', '$$$' => '3', '$$$$' => '4'];
    $forwardParams['price'] = $priceMap[$forwardParams['priceRange']] ?? $forwardParams['priceRange'];
    unset($forwardParams['priceRange']);
}
if (!empty($forwardParams['q'])) {
    $forwardParams['term'] = $forwardParams['q'];
    unset($forwardParams['q']);
}

$url = $baseUrl . ((strpos($baseUrl, '?') === false ? '?' : '&') . http_build_query($forwardParams));

$response = ExternalService::requestJson($url, 'GET', null, $restaurantHeaders);
if ($response['ok'] && is_array($response['data'])) {
    $raw = isset($response['data']['data']) && is_array($response['data']['data'])
        ? $response['data']['data']
        : $response['data'];

    $data = array_map(function ($item) {
        $categories = $item['categories'] ?? $item['cuisines'] ?? [];
        if (is_array($categories)) {
            $categories = array_map(function ($c) {
                return is_array($c) ? ($c['title'] ?? $c['name'] ?? '') : $c;
            }, $categories);
        }
        return [
            'id' => $item['id'] ?? uniqid('restaurant_', true),
            'name' => $item['name'] ?? 'Restaurant',
            'location' => $item['location']['city'] ?? $item['city'] ?? $item['address'] ?? 'Unknown',
            'cuisine' => $categories[0] ?? 'International',
            'priceRange' => $item['price'] ?? '$$',
            'rating' => $item['rating'] ?? 4.5,
            'reviews' => $item['review_count'] ?? $item['reviews'] ?? 40,
            'description' => $item['description'] ?? 'Partner restaurant',
            'image' => $item['image_url'] ?? $item['image'] ?? 'https://via.placeholder.com/600x400?text=Restaurant',
            'features' => $item['features'] ?? $categories ?? []
        ];
    }, is_array($raw) ? $raw : []);
}

echo json_encode(['source' => $source, 'data' => $data]);
