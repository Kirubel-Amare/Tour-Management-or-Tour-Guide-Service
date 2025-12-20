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
require_once '../../config/Database.php';
require_once '../../models/Review.php';
require_once '../../models/User.php';

Auth::authenticate();

$database = new Database();
$db = $database->connect();

function respond($code, $payload) {
    http_response_code($code);
    echo json_encode($payload);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $tourId = isset($_GET['tour_id']) ? intval($_GET['tour_id']) : null;
    $guideId = isset($_GET['guide_id']) ? intval($_GET['guide_id']) : null;
    $stats = isset($_GET['stats']) ? ($_GET['stats'] === 'true') : false;

    $review = new Review($db);

    if ($stats && $guideId) {
        $data = $review->statsByGuide($guideId);
        return respond(200, ['source' => 'db', 'data' => $data]);
    }

    if ($guideId) {
        $stmt = $review->readByGuide($guideId);
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
        return respond(200, ['source' => 'db', 'data' => $rows]);
    }

    if ($tourId) {
        $review->tour_id = $tourId;
        $stmt = $review->readByTour();
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
        return respond(200, ['source' => 'db', 'data' => $rows]);
    }

    return respond(400, ['message' => 'Provide tour_id or guide_id']);
}

if ($method === 'POST') {
    $payload = json_decode(file_get_contents('php://input'), true);
    if (!$payload || empty($payload['tour_id']) || (empty($payload['user_id']) && empty($payload['email'])) || empty($payload['rating'])) {
        return respond(400, ['message' => 'tour_id, rating and user_id or email are required']);
    }

    $tourId = intval($payload['tour_id']);
    $userId = isset($payload['user_id']) ? intval($payload['user_id']) : null;
    $email = isset($payload['email']) ? trim($payload['email']) : null;
    $name = isset($payload['name']) ? trim($payload['name']) : 'Guest Reviewer';
    $rating = floatval($payload['rating']);
    $comment = isset($payload['comment']) ? trim($payload['comment']) : '';

    if (!$userId) {
        $user = new User($db);
        $user->email = $email;
        if ($user->emailExists()) {
            $stmt = $db->prepare('SELECT id FROM users WHERE email = ? LIMIT 1');
            $stmt->bindParam(1, $email);
            $stmt->execute();
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            $userId = intval($row['id']);
        } else {
            $user->name = $name;
            $user->role = 'customer';
            $user->password = bin2hex(random_bytes(6));
            if (!$user->register()) {
                return respond(503, ['message' => 'Failed to create user']);
            }
            $userId = intval($db->lastInsertId());
        }
    }

    $review = new Review($db);
    $review->tour_id = $tourId;
    $review->user_id = $userId;
    $review->rating = $rating;
    $review->comment = $comment;

    if ($review->create()) {
        return respond(201, ['message' => 'Review Created']);
    }

    return respond(503, ['message' => 'Review Not Created']);
}

respond(405, ['message' => 'Method Not Allowed']);
