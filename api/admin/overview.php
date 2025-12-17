<?php
// Headers
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json');

require_once '../../config/Database.php';

$database = new Database();
$db = $database->connect();

$overview = [
    'users' => [],
    'tours' => [],
    'bookings' => [],
    'stats' => [
        'total_users' => 0,
        'total_tours' => 0,
        'total_bookings' => 0,
        'revenue' => 0
    ]
];

try {
    // Users
    $userStmt = $db->prepare('SELECT id, name, email, role, created_at FROM users ORDER BY created_at DESC');
    $userStmt->execute();
    $overview['users'] = $userStmt->fetchAll(PDO::FETCH_ASSOC);
    $overview['stats']['total_users'] = count($overview['users']);

    // Tours with guide name
    $tourStmt = $db->prepare('SELECT t.id, t.title, t.location, t.price, t.schedule_date, t.created_at, u.name AS guide_name, u.id AS guide_id FROM tours t LEFT JOIN users u ON t.guide_id = u.id ORDER BY t.created_at DESC');
    $tourStmt->execute();
    $overview['tours'] = $tourStmt->fetchAll(PDO::FETCH_ASSOC);
    $overview['stats']['total_tours'] = count($overview['tours']);

    // Bookings with tourist + tour
    $bookingStmt = $db->prepare('SELECT b.id, b.booking_date, b.status, t.title AS tour_title, t.price, u.name AS tourist_name, u.email AS tourist_email FROM bookings b JOIN tours t ON b.tour_id = t.id JOIN users u ON b.tourist_id = u.id ORDER BY b.booking_date DESC');
    $bookingStmt->execute();
    $overview['bookings'] = $bookingStmt->fetchAll(PDO::FETCH_ASSOC);
    $overview['stats']['total_bookings'] = count($overview['bookings']);

    // Revenue is sum of tour price per booking
    $overview['stats']['revenue'] = array_reduce($overview['bookings'], function ($carry, $booking) {
        return $carry + (float)($booking['price'] ?? 0);
    }, 0.0);

    echo json_encode($overview);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['message' => 'Failed to load admin overview', 'error' => $e->getMessage()]);
}
