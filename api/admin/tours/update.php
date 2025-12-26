<?php
// api/admin/tours/update.php
require_once __DIR__ . '/../../../config/Database.php';
require_once __DIR__ . '/../../../models/Tour.php';
require_once __DIR__ . '/../middleware/AuthMiddleware.php';

// Only allow PUT
if ($_SERVER['REQUEST_METHOD'] !== 'PUT') {
    http_response_code(405);
    echo json_encode(['message' => 'Method Not Allowed']);
    exit;
}


AuthMiddleware::authorize(['admin']);
$user = [
    'id' => $_SESSION['user_id'],
    'role' => $_SESSION['user_role']
];

$data = json_decode(file_get_contents('php://input'), true);

if (!$data || !isset($data['id'], $data['title'], $data['description'], $data['price'], $data['schedule_date'], $data['location'])) {
    http_response_code(400);
    echo json_encode(['message' => 'Missing required fields']);
    exit;
}


$db = (new Database())->connect();
$tour = new Tour($db);
$tour->id = $data['id'];
$tour->title = $data['title'];
$tour->description = $data['description'];
$tour->price = $data['price'];
$tour->schedule_date = $data['schedule_date'];
$tour->location = $data['location'];
$tour->image = isset($data['image']) ? $data['image'] : null;

if ($tour->update()) {
    http_response_code(200);
    echo json_encode(['message' => 'Tour updated successfully']);
} else {
    http_response_code(500);
    echo json_encode(['message' => 'Failed to update tour']);
}
