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

// Base of the external API (new upstream: https://restaurantmanagement.xo.je/api)
$baseApi = rtrim(getenv('EXTERNAL_RESTAURANT_API') ?: 'https://restaurantmanagement.xo.je/api', '/');
// Optional debug flag to inspect upstream behavior
$DEBUG = (isset($_GET['debug']) && $_GET['debug'] === '1');

// Normalize image URL to include static host when upstream returns relative paths
function normalizeRestaurantImageUrl($url)
{
    static $imageBase = null;
    static $fallback = null;
    if ($imageBase === null) {
        $baseApi = rtrim(getenv('EXTERNAL_RESTAURANT_API') ?: 'https://restaurantmanagement.xo.je/api', '/');
        $imageBase = rtrim(getenv('EXTERNAL_RESTAURANT_ASSET_BASE') ?: preg_replace('~/api/?$~', '', $baseApi) ?: 'https://restaurantmanagement.xo.je', '/');
        $fallback = getenv('EXTERNAL_RESTAURANT_DEFAULT_IMAGE') ?: $imageBase . '/uploads/restaurants/default.jpg';
    }

    if (empty($url)) {
        return $fallback;
    }
    if (preg_match('#^https?://#i', $url)) {
        return $url;
    }
    return $imageBase . '/' . ltrim($url, '/');
}

// Choose the best image field from a restaurant item then normalize to absolute URL
function pickRestaurantImage($item)
{
    if (!is_array($item)) {
        return normalizeRestaurantImageUrl(null);
    }

    $candidates = [];
    // common keys from possible upstream responses
    foreach (['image_url', 'image', 'photo', 'thumbnail', 'logo', 'cover', 'banner'] as $key) {
        if (!empty($item[$key])) {
            $candidates[] = $item[$key];
        }
    }
    // if upstream provides array of images
    if (empty($candidates) && !empty($item['images']) && is_array($item['images'])) {
        $first = reset($item['images']);
        if (is_string($first)) {
            $candidates[] = $first;
        } elseif (is_array($first) && !empty($first['url'])) {
            $candidates[] = $first['url'];
        }
    }

    $chosen = $candidates[0] ?? null;
    return normalizeRestaurantImageUrl($chosen);
}

// Upstream auth: API key header is required; Bearer token stays optional
$restaurantHeaders = [];
$apiKey = getenv('EXTERNAL_RESTAURANT_API_KEY') ?: 'RESTO-API-2025';
if (!empty($apiKey)) {
    $restaurantHeaders[] = 'X-API-KEY: ' . $apiKey;
}
$bearer = getenv('EXTERNAL_RESTAURANT_API_TOKEN');
if ($bearer) {
    $restaurantHeaders[] = 'Authorization: Bearer ' . $bearer;
}
$restaurantHeaders[] = 'Content-Type: application/json';

if (empty($baseApi)) {
    http_response_code(500);
    echo json_encode(['message' => 'EXTERNAL_RESTAURANT_API base URL is required']);
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
        'user' => $payload['user'] ?? ['id' => ($payload['user_id'] ?? 0)],
        'restaurant_id' => $payload['restaurant_id'] ?? null,
        'date' => $payload['date'] ?? null,
        'time' => $payload['time'] ?? null,
        'guests' => $payload['guests'] ?? 2,
        // accept either 'notes' or 'requests' from client
        'notes' => $payload['notes'] ?? ($payload['requests'] ?? '')
    ];

    if (!$reservation['restaurant_id'] || !$reservation['date'] || !$reservation['time']) {
        http_response_code(400);
        echo json_encode(['message' => 'restaurant_id, date, and time are required']);
        exit;
    }

    // Map to external Booking API payload
    $externalBody = [
        'restaurant_id' => $reservation['restaurant_id'],
        'booking_date' => $reservation['date'],
        'booking_time' => $reservation['time'],
        'number_of_people' => $reservation['guests'],
        'special_requests' => $reservation['notes']
    ];

    // Upstream requires customer_id; prefer user_id if provided
    $customerId = $payload['user_id'] ?? ($reservation['user']['id'] ?? null);
    if ($customerId) {
        $externalBody['customer_id'] = $customerId;
    }

    $source = 'external';
    $data = null;

    $url = $baseApi . '/bookings/create.php';
    $response = ExternalService::requestJson($url, 'POST', $externalBody, $restaurantHeaders);
    if ($response['ok']) {
        $data = $response['data'];
    } else {
        // Optional dev fallback: allow mock confirmation when upstream fails
        $allowMock = (getenv('ALLOW_RESTAURANT_MOCK_ON_FAIL') === 'true') || (getenv('EXTERNAL_API_MODE') === 'mock');
        if ($allowMock) {
            $data = [
                'reservation_id' => 'mock-rest-' . uniqid(),
                'confirmation' => 'REST-' . strtoupper(substr(md5(uniqid()), 0, 6)),
                'status' => 'confirmed',
                'message' => 'Mock reservation accepted (upstream unavailable).'
            ];
        } else {
            http_response_code(503);
            $out = [
                'message' => 'External service error',
                'status' => $response['status'],
                'error' => $response['error']
            ];
            if ($DEBUG) {
                $out['upstream'] = $response['data'];
                $out['hit_url'] = $url;
                $out['payload'] = $externalBody;
            }
            echo json_encode($out);
            exit;
        }
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

// Build listing/search against external API
$queryParams = [
    'q' => $_GET['q'] ?? '',
    'city' => $_GET['city'] ?? '',
    'priceRange' => $_GET['price'] ?? '',
    'rating' => $_GET['rating'] ?? '',
    'user_id' => $_GET['user_id'] ?? ''
];

$source = 'external';
$data = [];

// Map our query to provider fields
$forward = [];
if (!empty($queryParams['city'])) $forward['location'] = $queryParams['city'];
if (!empty($queryParams['priceRange'])) $forward['price_range'] = $queryParams['priceRange'];
if (!empty($queryParams['rating'])) $forward['rating'] = $queryParams['rating'];
if (!empty($queryParams['user_id'])) $forward['user_id'] = $queryParams['user_id'];
// External docs do not mention free-text search param; ignore 'q' if present.

$url = $baseApi . '/restaurants/index.php';
if (!empty($forward)) {
    $url .= (strpos($url, '?') === false ? '?' : '&') . http_build_query($forward);
}

$response = ExternalService::requestJson($url, 'GET', null, $restaurantHeaders);
if ($response['ok']) {
    $debugInfo = ['hit_url' => $url];
    // Decide which upstream endpoint to call based on query
    $id = $_GET['id'] ?? null;
    $hasMenu = isset($_GET['menu']);
    $hasAvailability = isset($_GET['availability']);
    $hasReviews = isset($_GET['reviews']);

    if ($id && $hasMenu) {
        // Menu
        $menuUrl = $baseApi . '/restaurants/menu.php?id=' . urlencode($id);
        $resp = ExternalService::requestJson($menuUrl, 'GET', null, $restaurantHeaders);
        if ($resp['ok']) {
            $raw = $resp['data'];
            $debugInfo['hit_url'] = $menuUrl;
            $debugInfo['upstream'] = $DEBUG ? $raw : null;
            $data = is_array($raw) && isset($raw['data']) ? $raw['data'] : (is_array($raw) ? $raw : []);
        } else {
            http_response_code(503);
            $out = ['message' => 'External service error', 'status' => $resp['status'], 'error' => $resp['error']];
            if ($DEBUG) { $out['hit_url'] = $menuUrl; $out['upstream'] = $resp['data']; }
            echo json_encode($out);
            exit;
        }
    } elseif ($id && $hasAvailability) {
        // Availability requires id, date, time
        $date = $_GET['date'] ?? '';
        $time = $_GET['time'] ?? '';
        $availUrl = $baseApi . '/restaurants/availability.php?id=' . urlencode($id) . '&date=' . urlencode($date) . '&time=' . urlencode($time);
        $resp = ExternalService::requestJson($availUrl, 'GET', null, $restaurantHeaders);
        if ($resp['ok']) {
            $raw = $resp['data'];
            $debugInfo['hit_url'] = $availUrl;
            $debugInfo['upstream'] = $DEBUG ? $raw : null;
            $raw = is_array($raw) && isset($raw['data']) ? $raw['data'] : $raw;
            if (is_array($raw)) {
                $data = [
                    'restaurant_id' => $raw['restaurant_id'] ?? $id,
                    'date' => $raw['date'] ?? $date,
                    'time' => $raw['time'] ?? $time,
                    'available_seats' => $raw['available_seats'] ?? null
                ];
            } else {
                $data = $raw ?: [];
            }
        } else {
            http_response_code(503);
            $out = ['message' => 'External service error', 'status' => $resp['status'], 'error' => $resp['error']];
            if ($DEBUG) { $out['hit_url'] = $availUrl; $out['upstream'] = $resp['data']; }
            echo json_encode($out);
            exit;
        }
    } elseif ($id && $hasReviews) {
        // Reviews
        $reviewsUrl = $baseApi . '/restaurants/reviews.php?id=' . urlencode($id);
        $resp = ExternalService::requestJson($reviewsUrl, 'GET', null, $restaurantHeaders);
        if ($resp['ok']) {
            $raw = $resp['data'];
            $debugInfo['hit_url'] = $reviewsUrl;
            $debugInfo['upstream'] = $DEBUG ? $raw : null;
            $data = is_array($raw) && isset($raw['data']) ? $raw['data'] : (is_array($raw) ? $raw : []);
        } else {
            http_response_code(503);
            $out = ['message' => 'External service error', 'status' => $resp['status'], 'error' => $resp['error']];
            if ($DEBUG) { $out['hit_url'] = $reviewsUrl; $out['upstream'] = $resp['data']; }
            echo json_encode($out);
            exit;
        }
    } elseif ($id) {
        // Single restaurant read
        $readUrl = $baseApi . '/restaurants/read.php?id=' . urlencode($id);
        $resp = ExternalService::requestJson($readUrl, 'GET', null, $restaurantHeaders);
        if ($resp['ok']) {
            $raw = $resp['data'];
            $debugInfo['hit_url'] = $readUrl;
            $debugInfo['upstream'] = $DEBUG ? $raw : null;
            $raw = is_array($raw) && isset($raw['data']) ? $raw['data'] : $raw;
            if (is_array($raw)) {
                $item = $raw;
                $amenitiesStr = $item['amenities'] ?? '';
                $features = [];
                if (is_string($amenitiesStr) && $amenitiesStr !== '') {
                    $features = array_values(array_filter(array_map(function ($s) { return trim($s); }, explode(',', $amenitiesStr)), fn($x) => $x !== ''));
                }
                $data = [
                    'id' => $item['id'] ?? uniqid('restaurant_', true),
                    'name' => $item['name'] ?? 'Restaurant',
                    'location' => $item['location'] ?? 'Unknown',
                    'cuisine' => $item['cuisine'] ?? 'International',
                    'priceRange' => $item['price_range'] ?? '$$',
                    'rating' => isset($item['rating']) ? (is_numeric($item['rating']) ? (float)$item['rating'] : $item['rating']) : 4.5,
                    'description' => $item['description'] ?? 'Partner restaurant',
                    'image' => pickRestaurantImage($item),
                    'features' => $features,
                    // Additional fields
                    'capacity' => $item['capacity'] ?? null,
                    'contact_phone' => $item['contact_phone'] ?? null,
                    'opening_hours' => $item['opening_hours'] ?? null
                ];
            } else {
                $data = [];
            }
        } else {
            http_response_code(503);
            $out = ['message' => 'External service error', 'status' => $resp['status'], 'error' => $resp['error']];
            if ($DEBUG) { $out['hit_url'] = $readUrl; $out['upstream'] = $resp['data']; }
            echo json_encode($out);
            exit;
        }
    } else {
        // List/search
        $raw = $response['data'];
        if (is_array($raw) && isset($raw['data'])) {
            $raw = $raw['data'];
        }
        if ($DEBUG) {
            $debugInfo['upstream'] = $raw;
        }
        if (is_array($raw)) {
            $data = array_map(function ($item) {
                $amenitiesStr = $item['amenities'] ?? '';
                $features = [];
                if (is_string($amenitiesStr) && $amenitiesStr !== '') {
                    $features = array_values(array_filter(array_map(function ($s) { return trim($s); }, explode(',', $amenitiesStr)), fn($x) => $x !== ''));
                }
                return [
                    'id' => $item['id'] ?? uniqid('restaurant_', true),
                    'name' => $item['name'] ?? 'Restaurant',
                    'location' => $item['location'] ?? 'Unknown',
                    'cuisine' => $item['cuisine'] ?? 'International',
                    'priceRange' => $item['price_range'] ?? '$$',
                    'rating' => isset($item['rating']) ? (is_numeric($item['rating']) ? (float)$item['rating'] : $item['rating']) : 4.5,
                    'reviews' => $item['review_count'] ?? $item['reviews'] ?? 40,
                    'description' => $item['description'] ?? 'Partner restaurant',
                    'image' => pickRestaurantImage($item),
                    'features' => $features
                ];
            }, $raw);
        }
    }
} else {
    http_response_code(503);
    $out = [
        'message' => 'External service error',
        'status' => $response['status'],
        'error' => $response['error']
    ];
    if ($DEBUG) {
        $out['upstream'] = $response['data'];
        $out['hit_url'] = $url;
    }
    echo json_encode($out);
    exit;
}

echo json_encode($DEBUG ? ['source' => $source, 'data' => $data, 'debug' => $debugInfo] : ['source' => $source, 'data' => $data]);
