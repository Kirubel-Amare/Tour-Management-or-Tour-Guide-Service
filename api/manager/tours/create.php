<?php
// api/manager/tours/create.php
require_once __DIR__ . '/../../../config/Database.php';
require_once __DIR__ . '/../../../models/Tour.php';
require_once __DIR__ . '/../middleware/AuthMiddleware.php';

// Only allow POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['message' => 'Method Not Allowed']);
    exit;
}


AuthMiddleware::authorize(['manager']);
$user = [
    'id' => $_SESSION['user_id'],
    'role' => $_SESSION['user_role']
];

$data = json_decode(file_get_contents('php://input'), true);
if (!$data || !isset($data['title'], $data['description'], $data['price'], $data['schedule_date'], $data['location'])) {
    http_response_code(400);
    echo json_encode(['message' => 'Missing required fields']);
    exit;
}

$db = (new Database())->connect();
$tour = new Tour($db);
$tour->guide_id = $user['id'];
$tour->title = $data['title'];
$tour->description = $data['description'];
$tour->price = $data['price'];
$tour->schedule_date = $data['schedule_date'];
$tour->location = $data['location'];
$tour->image = isset($data['image']) ? $data['image'] : null;

if ($tour->create()) {
    http_response_code(201);
    echo json_encode(['message' => 'Tour created successfully']);
} else {
    http_response_code(500);
    echo json_encode(['message' => 'Failed to create tour']);
}
