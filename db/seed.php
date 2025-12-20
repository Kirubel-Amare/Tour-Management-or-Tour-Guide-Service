<?php
// Seed demo users and tours using PDO, hashing passwords properly.

require_once __DIR__ . '/../config/Database.php';

function logMessage($msg) {
    echo $msg . "\n";
}

try {
    $db = (new Database())->connect();
    $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // Ensure unique index on users.email exists (Postgres/MySQL already has UNIQUE in schema)

    // Upsert helper by email
    $getUserId = function (PDO $db, string $email) {
        $stmt = $db->prepare('SELECT id FROM users WHERE email = :email');
        $stmt->execute([':email' => $email]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        return $row ? (int)$row['id'] : null;
    };

    $insertUser = function (PDO $db, string $name, string $email, string $role, string $plainPassword) use ($getUserId) {
        $existingId = $getUserId($db, $email);
        if ($existingId) {
            logMessage("User exists: $email (id=$existingId), skipping insert");
            return $existingId;
        }
        $hash = password_hash($plainPassword, PASSWORD_BCRYPT);
        $stmt = $db->prepare('INSERT INTO users (name, email, password, role) VALUES (:name, :email, :password, :role)');
        $stmt->execute([
            ':name' => $name,
            ':email' => $email,
            ':password' => $hash,
            ':role' => $role,
        ]);
        $id = $getUserId($db, $email);
        logMessage("Inserted user: $email (id=$id)");
        return $id;
    };

    $adminId = $insertUser($db, 'Admin User', 'admin@demo.com', 'admin', 'demopass123');
    $managerId = $insertUser($db, 'Guide Manager', 'manager@demo.com', 'manager', 'demopass123');
    $customerId = $insertUser($db, 'Customer Demo', 'customer@demo.com', 'customer', 'demopass123');

    // Seed tours for manager (guide)
    $insertTour = function (PDO $db, array $tour) {
        $stmt = $db->prepare('SELECT id FROM tours WHERE title = :title AND guide_id = :guide_id');
        $stmt->execute([':title' => $tour['title'], ':guide_id' => $tour['guide_id']]);
        if ($stmt->fetch(PDO::FETCH_ASSOC)) {
            logMessage("Tour exists: {$tour['title']} (guide_id={$tour['guide_id']})");
            return;
        }
        $stmt = $db->prepare('INSERT INTO tours (guide_id, title, description, image, location, price, schedule_date) VALUES (:guide_id, :title, :description, :image, :location, :price, :schedule_date)');
        $stmt->execute([
            ':guide_id' => $tour['guide_id'],
            ':title' => $tour['title'],
            ':description' => $tour['description'],
            ':image' => $tour['image'],
            ':location' => $tour['location'],
            ':price' => $tour['price'],
            ':schedule_date' => $tour['schedule_date'],
        ]);
        logMessage("Inserted tour: {$tour['title']}");
    };

    $tours = [
        [
            'guide_id' => $managerId,
            'title' => 'Paris Highlights Walking Tour',
            'description' => 'Explore the Eiffel Tower, Louvre, and charming streets with a local guide.',
            'image' => 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=800&q=80',
            'location' => 'Paris, France',
            'price' => 79.00,
            'schedule_date' => date('Y-m-d', strtotime('+10 days')),
        ],
        [
            'guide_id' => $managerId,
            'title' => 'Tokyo Food & Culture Tour',
            'description' => 'Taste authentic sushi and visit hidden gems in Tokyo.',
            'image' => 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80',
            'location' => 'Tokyo, Japan',
            'price' => 99.00,
            'schedule_date' => date('Y-m-d', strtotime('+20 days')),
        ],
        [
            'guide_id' => $managerId,
            'title' => 'Bali Beach & Temple Day Trip',
            'description' => 'Relax on Bali beaches and see Tanah Lot temple at sunset.',
            'image' => 'https://images.unsplash.com/photo-1537953773345-d172ccf13cf1?auto=format&fit=crop&w=800&q=80',
            'location' => 'Bali, Indonesia',
            'price' => 120.00,
            'schedule_date' => date('Y-m-d', strtotime('+30 days')),
        ],
    ];

    foreach ($tours as $tour) {
        $insertTour($db, $tour);
    }

    // Optional: Seed a booking for customer on first tour
    $firstTourId = null;
    $stmt = $db->query('SELECT id FROM tours ORDER BY id ASC LIMIT 1');
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    if ($row) { $firstTourId = (int)$row['id']; }
    if ($firstTourId && $customerId) {
        $stmt = $db->prepare('SELECT id FROM bookings WHERE tour_id = :tour_id AND user_id = :user_id');
        $stmt->execute([':tour_id' => $firstTourId, ':user_id' => $customerId]);
        if (!$stmt->fetch(PDO::FETCH_ASSOC)) {
            $stmt = $db->prepare("INSERT INTO bookings (tour_id, user_id, status) VALUES (:tour_id, :user_id, 'confirmed')");
            $stmt->execute([':tour_id' => $firstTourId, ':user_id' => $customerId]);
            logMessage("Inserted booking: tour_id=$firstTourId user_id=$customerId");
        } else {
            logMessage("Booking already exists for user_id=$customerId on tour_id=$firstTourId");
        }
    }

    // Seed taxi orders for visibility in admin dashboard
    $insertTaxiOrder = function (PDO $db, array $order) {
        $stmt = $db->prepare('SELECT id FROM taxi_orders WHERE user_id = :user_id AND pickup = :pickup AND destination = :destination');
        $stmt->execute([
            ':user_id' => $order['user_id'],
            ':pickup' => $order['pickup'],
            ':destination' => $order['destination'],
        ]);
        if ($stmt->fetch(PDO::FETCH_ASSOC)) {
            logMessage("Taxi order exists for {$order['pickup']} -> {$order['destination']}");
            return;
        }

        $insert = $db->prepare('INSERT INTO taxi_orders (user_id, pickup, destination, vehicle_type, schedule, custom_time, distance_km, fare, eta_minutes, status) VALUES (:user_id, :pickup, :destination, :vehicle_type, :schedule, :custom_time, :distance_km, :fare, :eta_minutes, :status)');
        $insert->execute([
            ':user_id' => $order['user_id'],
            ':pickup' => $order['pickup'],
            ':destination' => $order['destination'],
            ':vehicle_type' => $order['vehicle_type'],
            ':schedule' => $order['schedule'],
            ':custom_time' => $order['custom_time'],
            ':distance_km' => $order['distance_km'],
            ':fare' => $order['fare'],
            ':eta_minutes' => $order['eta_minutes'],
            ':status' => $order['status'],
        ]);
        logMessage("Inserted taxi order {$order['pickup']} -> {$order['destination']}");
    };

    if ($customerId) {
        $taxiOrders = [
            [
                'user_id' => $customerId,
                'pickup' => 'Hotel Lobby',
                'destination' => 'Airport Terminal 1',
                'vehicle_type' => 'standard',
                'schedule' => 'now',
                'custom_time' => null,
                'distance_km' => 18.5,
                'fare' => 32.50,
                'eta_minutes' => 9,
                'status' => 'accepted',
            ],
            [
                'user_id' => $customerId,
                'pickup' => 'Downtown Square',
                'destination' => 'Conference Center',
                'vehicle_type' => 'van',
                'schedule' => 'scheduled',
                'custom_time' => date('Y-m-d H:i:s', strtotime('+1 day 10:00')), // tomorrow 10am
                'distance_km' => 6.2,
                'fare' => 14.75,
                'eta_minutes' => 12,
                'status' => 'pending',
            ],
        ];

        foreach ($taxiOrders as $order) {
            $insertTaxiOrder($db, $order);
        }
    }

    // Seed hotel reservation for the customer
    $hotelId = null;
    $stmt = $db->query('SELECT id FROM hotels ORDER BY id ASC LIMIT 1');
    if ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        $hotelId = (int)$row['id'];
    }

    if ($customerId && $hotelId) {
        $checkIn = date('Y-m-d', strtotime('+7 days'));
        $checkOut = date('Y-m-d', strtotime('+10 days'));
        $stmt = $db->prepare('SELECT id FROM hotel_reservations WHERE user_id = :user_id AND hotel_id = :hotel_id AND check_in = :check_in');
        $stmt->execute([
            ':user_id' => $customerId,
            ':hotel_id' => $hotelId,
            ':check_in' => $checkIn,
        ]);
        if ($stmt->fetch(PDO::FETCH_ASSOC)) {
            logMessage("Hotel reservation already exists for user $customerId at hotel $hotelId");
        } else {
            $insert = $db->prepare('INSERT INTO hotel_reservations (user_id, hotel_id, check_in, check_out, guests, room_type, status) VALUES (:user_id, :hotel_id, :check_in, :check_out, :guests, :room_type, :status)');
            $insert->execute([
                ':user_id' => $customerId,
                ':hotel_id' => $hotelId,
                ':check_in' => $checkIn,
                ':check_out' => $checkOut,
                ':guests' => 2,
                ':room_type' => 'Deluxe',
                ':status' => 'confirmed',
            ]);
            logMessage("Inserted hotel reservation for user $customerId (hotel $hotelId)");
        }
    }

    // Seed restaurant reservation for the customer
    $restaurantId = null;
    $stmt = $db->query('SELECT id FROM restaurants ORDER BY id ASC LIMIT 1');
    if ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        $restaurantId = (int)$row['id'];
    }

    if ($customerId && $restaurantId) {
        $resDate = date('Y-m-d', strtotime('+3 days'));
        $resTime = '19:30:00';
        $stmt = $db->prepare('SELECT id FROM restaurant_reservations WHERE user_id = :user_id AND restaurant_id = :restaurant_id AND date = :date');
        $stmt->execute([
            ':user_id' => $customerId,
            ':restaurant_id' => $restaurantId,
            ':date' => $resDate,
        ]);
        if ($stmt->fetch(PDO::FETCH_ASSOC)) {
            logMessage("Restaurant reservation already exists for user $customerId at restaurant $restaurantId");
        } else {
            $insert = $db->prepare('INSERT INTO restaurant_reservations (user_id, restaurant_id, date, time, guests, notes, status) VALUES (:user_id, :restaurant_id, :date, :time, :guests, :notes, :status)');
            $insert->execute([
                ':user_id' => $customerId,
                ':restaurant_id' => $restaurantId,
                ':date' => $resDate,
                ':time' => $resTime,
                ':guests' => 4,
                ':notes' => 'Window table if possible',
                ':status' => 'pending',
            ]);
            logMessage("Inserted restaurant reservation for user $customerId (restaurant $restaurantId)");
        }
    }

    logMessage("Seed complete.");
} catch (Throwable $e) {
    http_response_code(500);
    echo 'Seed error: ' . $e->getMessage() . "\n";
    exit(1);
}
