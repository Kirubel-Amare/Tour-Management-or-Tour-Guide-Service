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

    logMessage("Seed complete.");
} catch (Throwable $e) {
    http_response_code(500);
    echo 'Seed error: ' . $e->getMessage() . "\n";
    exit(1);
}
