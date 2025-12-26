<?php
// api/admin/users/read.php
require_once __DIR__ . '/../../../config/Database.php';
require_once __DIR__ . '/../../../models/User.php';
require_once __DIR__ . '/../middleware/AuthMiddleware.php';

// Only allow GET
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['message' => 'Method Not Allowed']);
    exit;
}


AuthMiddleware::authorize(['admin']);

$db = (new Database())->connect();
$userModel = new User($db);
$users = $userModel->readAll();

http_response_code(200);
echo json_encode(['users' => $users]);
