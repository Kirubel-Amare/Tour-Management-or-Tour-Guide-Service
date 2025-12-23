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

// Base of the external API (e.g., https://restaurantmanagement.ct.ws/api)
$baseApi = rtrim(getenv('EXTERNAL_RESTAURANT_API') ?: 'https://restaurantmanagement.ct.ws/api', '/');
// Optional debug flag to inspect upstream behavior
$DEBUG = (isset($_GET['debug']) && $_GET['debug'] === '1');

// Upstream auth: Bearer token is required for most endpoints
$restaurantHeaders = [];
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

    // Map to external Booking API payload
    $externalBody = [
        'restaurant_id' => $reservation['restaurant_id'],
        'booking_date' => $reservation['date'],
        'booking_time' => $reservation['time'],
        'number_of_people' => $reservation['guests'],
        'special_requests' => $reservation['notes']
    ];

    $source = 'external';
    $data = null;

    $url = $baseApi . '/bookings/create.php';
    $response = ExternalService::requestJson($url, 'POST', $externalBody, $restaurantHeaders);
    if ($response['ok']) {
        $data = $response['data'];
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

    // Helper to build absolute image URLs when provider returns relative paths
    $makeImageUrl = function ($path) use ($baseApi) {
        if (!$path) return null;
        if (preg_match('/^https?:\/\//i', $path)) return $path;
        return rtrim($baseApi, '/') . '/' . ltrim($path, '/');
    };
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
                    'image' => $makeImageUrl($item['image_url'] ?? $item['image']) ?? 'https://via.placeholder.com/600x400?text=Restaurant',
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
            $data = array_map(function ($item) use ($makeImageUrl) {
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
                    'image' => $makeImageUrl($item['image_url'] ?? $item['image']) ?? 'https://via.placeholder.com/600x400?text=Restaurant',
                    'features' => $features,
                    'capacity' => $item['capacity'] ?? null,
                    'contact_phone' => $item['contact_phone'] ?? null,
                    'opening_hours' => $item['opening_hours'] ?? null
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
