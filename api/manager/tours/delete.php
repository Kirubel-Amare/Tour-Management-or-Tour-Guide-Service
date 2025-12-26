<?php
// api/manager/tours/delete.php
require_once __DIR__ . '/../../../config/Database.php';
require_once __DIR__ . '/../../../models/Tour.php';
require_once __DIR__ . '/../middleware/AuthMiddleware.php';

// Only allow DELETE
if ($_SERVER['REQUEST_METHOD'] !== 'DELETE') {
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
if (!$data || !isset($data['id'])) {
    http_response_code(400);
    echo json_encode(['message' => 'Missing required fields']);
    exit;
}

$db = (new Database())->connect();
$tour = new Tour($db);
$tour->id = $data['id'];
$tour->guide_id = $user['id'];

if ($tour->delete()) {
    http_response_code(200);
    echo json_encode(['message' => 'Tour deleted successfully']);
} else {
    http_response_code(500);
    echo json_encode(['message' => 'Failed to delete tour']);
}
