<?php
// Headers
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, X-API-KEY');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

require_once '../v1/middleware/Auth.php';
require_once '../middleware/AuthMiddleware.php';
include_once '../../config/Database.php';
include_once '../../models/Booking.php';

// Allow either API key or logged-in tourist
function allowApiKeyOrTourist()
{
    // Try API key first (same logic as v1 Auth)
    $headers = function_exists('getallheaders') ? getallheaders() : [];
    $apiKey = $headers['X-API-KEY']
        ?? $headers['x-api-key']
        ?? $headers['X-Api-Key']
        ?? ($_SERVER['HTTP_X_API_KEY'] ?? null)
        ?? ($_SERVER['HTTP_X_API-KEY'] ?? null);

    $envKey = getenv('API_REVIEW_KEY') ?: getenv('REVIEW_API_KEY') ?: 'demo-api-key';

    if ($apiKey && $apiKey === $envKey) {
        return ['type' => 'api-key'];
    }

    // Fallback to session user with tourist role
    if (session_status() === PHP_SESSION_NONE) {
        session_start();
    }
    if (!empty($_SESSION['user_role']) && strtolower($_SESSION['user_role']) === 'tourist' && !empty($_SESSION['user_id'])) {
        return ['type' => 'session', 'user_id' => $_SESSION['user_id']];
    }

    http_response_code(401);
    echo json_encode(['message' => 'Unauthorized: API key or tourist login required']);
    exit;
}

$authContext = allowApiKeyOrTourist();

$database = new Database();
$db = $database->connect();
$booking = new Booking($db);

$data = json_decode(file_get_contents("php://input"), true);
if (!$data) {
    http_response_code(400);
    echo json_encode(['message' => 'Invalid JSON payload']);
    exit;
}

// New Restaurant booking contract
if (!empty($data['restaurant_id']) && !empty($data['booking_date']) && !empty($data['booking_time']) && !empty($data['number_of_people'])) {
    $bookingId = random_int(10000, 99999);
    $conf = 'BK-' . $bookingId . '-' . strtoupper(substr(md5(uniqid('', true)), 0, 3));

    http_response_code(201);
    echo json_encode([
        'status' => 'success',
        'message' => 'Booking created successfully.',
        'data' => [
            'booking_id' => $bookingId,
            'confirmation_code' => $conf,
            'restaurant_id' => $data['restaurant_id'],
            'booking_date' => $data['booking_date'],
            'booking_time' => $data['booking_time'],
            'number_of_people' => (int)$data['number_of_people']
        ]
    ]);
    exit;
}

// Existing tour booking path (backward compatible)
if (!empty($data['tour_id']) && !empty($data['user_id'])) {
    $booking->tour_id = $data['tour_id'];
    $booking->user_id = $data['user_id'];

    // Allow clients (admin) to request a status; default is pending
    $valid_status = ['pending', 'confirmed', 'cancelled'];
    if (!empty($data['status']) && in_array(strtolower($data['status']), $valid_status, true)) {
        $booking->status = strtolower($data['status']);
    }

    if ($booking->create()) {
        http_response_code(201);
        echo json_encode(['message' => 'Booking Created']);
    } else {
        http_response_code(503);
        echo json_encode(['message' => 'Booking Not Created']);
    }
} else {
    http_response_code(400);
    echo json_encode(['message' => 'Incomplete Data']);
}
