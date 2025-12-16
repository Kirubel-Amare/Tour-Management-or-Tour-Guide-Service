<?php
// Headers
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json');
header('Access-Control-Allow-Methods: GET, PUT, POST');
header('Access-Control-Allow-Headers: Access-Control-Allow-Headers,Content-Type,Access-Control-Allow-Methods, Authorization, X-Requested-With');

session_start();

include_once '../../config/Database.php';
include_once '../../models/User.php';
include_once '../../api/middleware/AuthMiddleware.php';

// Instantiate DB & Connect
$database = new Database();
$db = $database->connect();

// Instantiate User object
$user = new User($db);

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    // Check Authentication
    AuthMiddleware::isAuthenticated();

    // For profile viewing, we allow users to view their own profile
    // If we wanted to allow viewing others, we'd check logic here.
    // For now, assume viewing own profile if no ID provided or strictly own.

    // Simplification: Always return logged in user's profile for "My Profile" feature
    // Usage: /api/user/profile.php
    $user->id = $_SESSION['user_id'];

    // If admin wants to view others, handle here (omitted for brevity unless requested)

    if ($user->readOne()) {
        $user_arr = array(
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'role' => $user->role
        );
        http_response_code(200);
        echo json_encode($user_arr);
    } else {
        http_response_code(404);
        echo json_encode(['message' => 'User not found']);
    }

} elseif ($method === 'PUT' || $method === 'POST') {
    // Update Profile
    $data = json_decode(file_get_contents("php://input"));

    if (!isset($_SESSION['user_id']) && !isset($data->id)) {
        http_response_code(401);
        echo json_encode(['message' => 'Unauthorized']);
        exit;
    }

    $user->id = isset($_SESSION['user_id']) ? $_SESSION['user_id'] : $data->id;

    $user->name = $data->name;
    $user->email = $data->email;
    $user->password = isset($data->password) ? $data->password : null;

    if ($user->update()) {
        http_response_code(200);
        echo json_encode(['message' => 'Profile Updated']);
    } else {
        http_response_code(500);
        echo json_encode(['message' => 'Profile Not Updated']);
    }
}
