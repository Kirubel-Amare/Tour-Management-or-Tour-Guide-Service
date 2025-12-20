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

function fetchAmadeusToken()
{
    $clientId = getenv('EXTERNAL_HOTEL_CLIENT_ID');
    $clientSecret = getenv('EXTERNAL_HOTEL_CLIENT_SECRET');

    if (!$clientId || !$clientSecret) {
        return null;
    }

    $tokenUrl = 'https://test.api.amadeus.com/v1/security/oauth2/token';
    $payload = http_build_query([
        'grant_type' => 'client_credentials',
        'client_id' => $clientId,
        'client_secret' => $clientSecret,
    ]);

    $ch = curl_init($tokenUrl);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, $payload);
    curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/x-www-form-urlencoded']);
    curl_setopt($ch, CURLOPT_TIMEOUT, 10);

    $response = curl_exec($ch);
    $status = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if (!$response || $status >= 400) {
        return null;
    }

    $decoded = json_decode($response, true);
    return $decoded['access_token'] ?? null;
}

$baseUrl = rtrim(getenv('EXTERNAL_HOTEL_API') ?: '', '/');
// Required headers for real providers (Bearer token or vendor key/host)
$hotelHeaders = [];
$token = getenv('EXTERNAL_HOTEL_API_TOKEN');
if (!$token) {
    $token = fetchAmadeusToken();
}
if ($token) {
    $hotelHeaders[] = 'Authorization: Bearer ' . $token;
}
if ($apiKey = getenv('EXTERNAL_HOTEL_API_KEY')) {
    $hotelHeaders[] = 'X-API-Key: ' . $apiKey;
}
if ($rapidKey = getenv('EXTERNAL_HOTEL_RAPIDAPI_KEY')) {
    $hotelHeaders[] = 'X-RapidAPI-Key: ' . $rapidKey;
}
if ($rapidHost = getenv('EXTERNAL_HOTEL_RAPIDAPI_HOST')) {
    $hotelHeaders[] = 'X-RapidAPI-Host: ' . $rapidHost;
}

if (empty($baseUrl)) {
    http_response_code(500);
    echo json_encode(['message' => 'EXTERNAL_HOTEL_API is required']);
    exit;
}

// Public API: POST /api/v1/hotels.php (Book Hotel)
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $payload = json_decode(file_get_contents('php://input'), true);

    if (!$payload) {
        http_response_code(400);
        echo json_encode(['message' => 'Invalid JSON payload']);
        exit;
    }

    // Adapt payload to match internal structure if needed, or enforce schema
    $reservation = [
        'user' => $payload['user'] ?? ['id' => 0], // External users might not map to internal IDs easily
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

    $source = 'external';
    $data = null;

    $response = ExternalService::requestJson($baseUrl, 'POST', $reservation, $hotelHeaders);
    if ($response['ok']) {
        $data = $response['data'];
    } else {
        http_response_code(503);
        echo json_encode(['message' => 'External service error', 'status' => $response['status'], 'error' => $response['error']]);
        exit;
    }

    if ($data === null) {
        http_response_code(503);
        echo json_encode(['message' => 'External hotel service unavailable']);
        exit;
    }

    $confirmation = is_array($data) ? ($data['confirmation'] ?? null) : null;
    $finalMessage = $confirmation ? 'Hotel booking confirmed' : 'Hotel booking submitted';

    echo json_encode([
        'source' => $source,
        'data' => $data,
        'message' => $finalMessage,
        'confirmation' => $confirmation
    ]);
    exit;
}

// Public API: GET /api/v1/hotels.php (Search Hotels)
$queryParams = [
    'q' => $_GET['q'] ?? '',
    'city' => $_GET['city'] ?? '',
    'roomType' => $_GET['room_type'] ?? '',
    'minRating' => $_GET['rating'] ?? ''
];

$source = 'db';
$data = [];

// For providers like Amadeus that expect cityCode, remap city -> cityCode (supports codes or names)
$forwardParams = array_filter($queryParams);
if (!empty($forwardParams['city'])) {
    $cityInput = trim($forwardParams['city']);
    $cityCodeMap = [
        'paris' => 'PAR',
        'london' => 'LON',
        'new york' => 'NYC',
        'los angeles' => 'LAX',
        'san francisco' => 'SFO',
        'rome' => 'ROM',
        'madrid' => 'MAD',
        'barcelona' => 'BCN',
        'tokyo' => 'TYO',
        'osaka' => 'OSA',
        'dubai' => 'DXB',
        'singapore' => 'SIN',
        'sydney' => 'SYD',
        'melbourne' => 'MEL',
        'berlin' => 'BER',
        'frankfurt' => 'FRA',
        'amsterdam' => 'AMS',
        'toronto' => 'YTO',
        'vancouver' => 'YVR',
        'mexico city' => 'MEX',
        'cairo' => 'CAI',
        'istanbul' => 'IST',
        'hong kong' => 'HKG',
        'bangkok' => 'BKK'
    ];

    $cityKey = strtolower($cityInput);
    $cityCode = $cityCodeMap[$cityKey] ?? $cityInput; // use input if already a code

    $forwardParams['cityCode'] = $cityCode;
    unset($forwardParams['city']);
}

$url = $baseUrl . ((strpos($baseUrl, '?') === false ? '?' : '&') . http_build_query($forwardParams));

$response = ExternalService::requestJson($url, 'GET', null, $hotelHeaders);
if ($response['ok'] && is_array($response['data'])) {
    // Amadeus returns { data: [...] }. Use nested data if present.
    $raw = isset($response['data']['data']) && is_array($response['data']['data'])
        ? $response['data']['data']
        : $response['data'];

    $data = array_map(function ($item) {
        return [
            'id' => $item['hotelId'] ?? ($item['id'] ?? uniqid('hotel_', true)),
            'name' => $item['name'] ?? 'Hotel',
            'location' => $item['address']['cityName'] ?? $item['iataCode'] ?? 'Unknown',
            'price' => $item['price'] ?? ($item['offers'][0]['price']['total'] ?? 0),
            'rating' => $item['rating'] ?? 4.4,
            'hotelRating' => $item['rating'] ?? 4,
            'reviews' => $item['reviews'] ?? ($item['lastUpdate'] ? 50 : 0),
            'description' => $item['description'] ?? 'Partner hotel',
            'image' => $item['image'] ?? 'https://via.placeholder.com/600x400?text=Hotel',
            'amenities' => $item['amenities'] ?? []
        ];
    }, is_array($raw) ? $raw : []);

    $source = 'external';
}

// Local DB read removed.
// Data comes exclusively from external API.
if (!$data) {
    // Empty data if external failed or returned nothing
}

echo json_encode(['source' => $source, 'data' => $data]);
