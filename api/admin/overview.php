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
    $tourStmt = $db->prepare('SELECT t.id, t.title, t.location, t.image, t.price, t.schedule_date, t.created_at, u.name AS guide_name, u.id AS guide_id FROM tours t LEFT JOIN users u ON t.guide_id = u.id ORDER BY t.created_at DESC');
    $tourStmt->execute();
    $overview['tours'] = $tourStmt->fetchAll(PDO::FETCH_ASSOC);
    $overview['stats']['total_tours'] = count($overview['tours']);

    // Taxi orders
    $taxiStmt = $db->prepare('SELECT t.id, t.user_id, t.pickup, t.destination, t.vehicle_type, t.schedule, t.custom_time, t.distance_km, t.fare, t.eta_minutes, t.status, t.created_at, u.name AS user_name, u.email AS user_email FROM taxi_orders t LEFT JOIN users u ON t.user_id = u.id ORDER BY t.created_at DESC');
    $taxiStmt->execute();
    $overview['taxi_orders'] = $taxiStmt->fetchAll(PDO::FETCH_ASSOC);

    // Hotel reservations
    $hotelResStmt = $db->prepare('SELECT r.id, r.user_id, r.hotel_id, r.check_in, r.check_out, r.guests, r.room_type, r.status, r.created_at, u.name AS user_name, u.email AS user_email, h.name AS hotel_name FROM hotel_reservations r LEFT JOIN users u ON r.user_id = u.id LEFT JOIN hotels h ON r.hotel_id = h.id ORDER BY r.created_at DESC');
    $hotelResStmt->execute();
    $overview['hotel_reservations'] = $hotelResStmt->fetchAll(PDO::FETCH_ASSOC);

    // Restaurant reservations
    $restResStmt = $db->prepare('SELECT r.id, r.user_id, r.restaurant_id, r.date, r.time, r.guests, r.notes, r.status, r.created_at, u.name AS user_name, u.email AS user_email, res.name AS restaurant_name FROM restaurant_reservations r LEFT JOIN users u ON r.user_id = u.id LEFT JOIN restaurants res ON r.restaurant_id = res.id ORDER BY r.created_at DESC');
    $restResStmt->execute();
    $overview['restaurant_reservations'] = $restResStmt->fetchAll(PDO::FETCH_ASSOC);

    // Bookings with customer + tour (schema uses user_id)
    $bookingStmt = $db->prepare('SELECT b.id, b.booking_date, b.status, t.title AS tour_title, t.price, u.name AS tourist_name, u.email AS tourist_email FROM bookings b JOIN tours t ON b.tour_id = t.id JOIN users u ON b.user_id = u.id ORDER BY b.booking_date DESC');
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
