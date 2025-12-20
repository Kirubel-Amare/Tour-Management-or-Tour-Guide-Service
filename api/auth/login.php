<?php
// Headers
$origin = $_SERVER['HTTP_ORIGIN'] ?? '*';
header('Access-Control-Allow-Origin: ' . $origin);
header('Access-Control-Allow-Credentials: true');
header('Vary: Origin');
header('Content-Type: application/json');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Access-Control-Allow-Headers,Content-Type,Access-Control-Allow-Methods, Authorization, X-Requested-With');

session_start(); // Start session

include_once '../../config/Database.php';
include_once '../../models/User.php';

// Instantiate DB & Connect
$database = new Database();
$db = $database->connect();

// Instantiate User object
$user = new User($db);

// Get raw posted data
$data = json_decode(file_get_contents("php://input"));

if (!empty($data->email) && !empty($data->password)) {
    $user->email = $data->email;
    $user->password = $data->password;

    if ($user->login()) {
        // Set session variables
        $_SESSION['user_id'] = $user->id;
        $_SESSION['user_name'] = $user->name;
        $_SESSION['user_role'] = $user->role;

        http_response_code(200);
        echo json_encode(array(
            'message' => 'Login Successful',
            'id' => $user->id,
            'name' => $user->name,
            'role' => $user->role
        ));
    } else {
        error_log("Login failed for email: " . $user->email);
        http_response_code(401);
        echo json_encode(array('message' => 'Login Failed'));
    }
} else {
    http_response_code(400);
    echo json_encode(array('message' => 'Incomplete Data'));
}
