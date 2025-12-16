<?php
// Headers
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Access-Control-Allow-Headers,Content-Type,Access-Control-Allow-Methods, Authorization, X-Requested-With');

include_once '../../config/Database.php';
include_once '../../models/User.php';

// Instantiate DB & Connect
$database = new Database();
$db = $database->connect();

// Instantiate User object
$user = new User($db);

// Get raw posted data
$data = json_decode(file_get_contents("php://input"));

if (!empty($data->name) && !empty($data->email) && !empty($data->password)) {
    $user->name = $data->name;
    $user->email = $data->email;
    $user->password = password_hash($data->password, PASSWORD_DEFAULT); // Hash password
    $user->role = !empty($data->role) ? $data->role : 'tourist'; // Default to tourist

    // Check if email exists
    if ($user->emailExists()) {
        echo json_encode(array('message' => 'Email already exists.'));
    } else {
        // Create user
        if ($user->create()) {
            http_response_code(201);
            echo json_encode(array('message' => 'User Created'));
        } else {
            http_response_code(503);
            echo json_encode(array('message' => 'User Not Created'));
        }
    }
} else {
    http_response_code(400);
    echo json_encode(array('message' => 'Incomplete Data'));
}
