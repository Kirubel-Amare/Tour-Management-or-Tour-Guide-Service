<?php
// Enable error reporting for debugging
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// Headers
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Include DB and User class
include_once '../../config/Database.php';
include_once '../../models/User.php';

// Connect to DB
$database = new Database();
$db = $database->connect();
if (!$db) {
    http_response_code(500);
    echo json_encode(['message' => 'Database connection failed']);
    exit;
}

// Create User object
$user = new User($db);

// Get JSON input
$data = json_decode(file_get_contents("php://input"));
if (!$data) {
    http_response_code(400);
    echo json_encode(['message' => 'No input data received']);
    exit;
}

// Validate required fields
if (empty($data->name) || empty($data->email) || empty($data->password)) {
    http_response_code(400);
    echo json_encode(['message' => 'Incomplete data: name, email, and password are required']);
    exit;
}

// Set user properties
$user->name = $data->name;
$user->email = $data->email;
$user->password = $data->password;
$user->role = !empty($data->role) ? $data->role : 'customer';

// Check if email exists
if ($user->emailExists()) {
    http_response_code(409); // Conflict
    echo json_encode(['message' => 'Email already exists']);
    exit;
}

// Create the user
if ($user->register()) {   // <-- use create() instead of register()
    http_response_code(201); // Created
    echo json_encode([
        'message' => 'User created successfully',
        'user' => [
            'name' => $user->name,
            'email' => $user->email,
            'password' => $user->password,
            'role' => $user->role
        ]
    ]);
} else {
    http_response_code(500); // Internal server error
    echo json_encode(['message' => 'Failed to create user']);
}
