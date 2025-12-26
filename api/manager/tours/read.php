<?php
// api/manager/tours/read.php
require_once __DIR__ . '/../../../config/Database.php';
require_once __DIR__ . '/../../../models/Tour.php';
require_once __DIR__ . '/../middleware/AuthMiddleware.php';

// Only allow GET
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['message' => 'Method Not Allowed']);
    exit;
}


AuthMiddleware::authorize(['manager']);
$user = [
    'id' => $_SESSION['user_id'],
    'role' => $_SESSION['user_role']
];

$db = (new Database())->connect();
$tour = new Tour($db);
$tour->guide_id = $user['id'];
$stmt = $tour->read();
$tours = $stmt->fetchAll(PDO::FETCH_ASSOC);

http_response_code(200);
echo json_encode(['tours' => $tours]);
