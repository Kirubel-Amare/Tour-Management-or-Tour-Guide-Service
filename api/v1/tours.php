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
require_once '../../models/Tour.php';
require_once '../../models/Booking.php';
require_once '../../models/User.php';

// Enforce simple API key auth for partner usage
Auth::authenticate();

$database = new Database();
$db = $database->connect();

$method = $_SERVER['REQUEST_METHOD'];

function respond($code, $payload) {
    http_response_code($code);
    echo json_encode($payload);
    exit;
}

if ($method === 'GET') {
    $id = isset($_GET['id']) ? intval($_GET['id']) : null;
    $guideId = isset($_GET['guide_id']) ? intval($_GET['guide_id']) : null;
    $q = isset($_GET['q']) ? trim($_GET['q']) : '';

    $tour = new Tour($db);

    if ($id) {
        $tour->id = $id;
        if ($tour->read_single()) {
            respond(200, [
                'source' => 'db',
                'data' => [
                    'id' => $tour->id,
                    'guide_id' => $tour->guide_id,
                    'title' => $tour->title,
                    'description' => $tour->description,
                    'image' => $tour->image,
                    'location' => $tour->location,
                    'price' => $tour->price,
                    'schedule_date' => $tour->schedule_date,
                ],
            ]);
        }
        respond(404, ['message' => 'Tour not found']);
    }

    if (!empty($guideId)) {
        $tour->guide_id = $guideId;
    }

    $stmt = $tour->read();
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Optional filtering on title/location
    if ($q !== '') {
        $rows = array_values(array_filter($rows, function ($r) use ($q) {
            $needle = mb_strtolower($q);
            return (
                strpos(mb_strtolower($r['title'] ?? ''), $needle) !== false ||
                strpos(mb_strtolower($r['location'] ?? ''), $needle) !== false
            );
        }));
    }

    respond(200, ['source' => 'db', 'data' => $rows]);
}

if ($method === 'POST') {
    $payload = json_decode(file_get_contents('php://input'), true);
    if (!$payload || empty($payload['tour_id'])) {
        respond(400, ['message' => 'tour_id is required']);
    }

    $tourId = intval($payload['tour_id']);
    $userId = isset($payload['user_id']) ? intval($payload['user_id']) : null;
    $email = isset($payload['email']) ? trim($payload['email']) : null;
    $name = isset($payload['name']) ? trim($payload['name']) : 'Guest User';

    // Resolve user: if user_id not provided, use email to find or create a customer
    if (!$userId) {
        if (!$email) {
            respond(400, ['message' => 'Provide user_id or email for booking']);
        }
        $user = new User($db);
        $user->email = $email;
        if ($user->emailExists()) {
            // Fetch user id
            $stmt = $db->prepare('SELECT id FROM users WHERE email = ? LIMIT 1');
            $stmt->bindParam(1, $email);
            $stmt->execute();
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            $userId = intval($row['id']);
        } else {
            // Create customer account with a random password
            $user->name = $name;
            $user->role = 'customer';
            $user->password = bin2hex(random_bytes(6));
            if (!$user->register()) {
                respond(503, ['message' => 'Failed to create user']);
            }
            // get inserted id
            $userId = intval($db->lastInsertId());
        }
    }

    // Verify tour exists
    $tour = new Tour($db);
    $tour->id = $tourId;
    if (!$tour->read_single()) {
        respond(404, ['message' => 'Tour not found']);
    }

    // Create booking
    $booking = new Booking($db);
    $booking->tour_id = $tourId;
    $booking->user_id = $userId;

    if ($booking->create()) {
        respond(201, [
            'message' => 'Booking Created',
            'data' => [
                'tour_id' => $tourId,
                'user_id' => $userId,
                'status' => 'confirmed',
            ],
        ]);
    } else {
        respond(503, ['message' => 'Booking Not Created']);
    }
}

respond(405, ['message' => 'Method Not Allowed']);
