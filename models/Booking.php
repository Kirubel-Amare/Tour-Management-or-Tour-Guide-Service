<?php
class Booking
{
    private $conn;
    private $table_name = 'bookings';

    public $id;
    public $tour_id;
    public $user_id; // Tourist
    public $booking_date;
    public $status;

    public function __construct($db)
    {
        $this->conn = $db;
    }

    // Create Booking
    public function create()
    {
        $query = "INSERT INTO " . $this->table_name . " (tour_id, user_id, status)
                  VALUES (:tour_id, :user_id, 'confirmed')"; // Auto confirm for now

        $stmt = $this->conn->prepare($query);

        // Sanitize
        $this->tour_id = htmlspecialchars(strip_tags($this->tour_id));
        $this->user_id = htmlspecialchars(strip_tags($this->user_id));

        // Bind data
        $stmt->bindParam(':tour_id', $this->tour_id);
        $stmt->bindParam(':user_id', $this->user_id);

        if ($stmt->execute()) {
            return true;
        }

        printf("Error: %s.\n", $stmt->errorInfo()[2]);
        return false;
    }

    // Read Bookings for a User (Customer History)
    public function readByUser()
    {
        $query = "SELECT 
                    b.id, b.tour_id, b.booking_date, b.status,
                    t.title as tour_title, t.location, t.price, t.schedule_date
                  FROM " . $this->table_name . " b
                  LEFT JOIN tours t ON b.tour_id = t.id
                  WHERE b.user_id = :user_id
                  ORDER BY b.booking_date DESC";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':user_id', $this->user_id);
        $stmt->execute();

        return $stmt;
    }

    // Read Bookings for a Guide (Manager View Participants)
    public function readByGuide($guide_id)
    {
        $query = "SELECT 
                    b.id, b.tour_id, b.booking_date, b.status,
                    t.title as tour_title, t.price, t.schedule_date,
                    u.name as customer_name, u.email as customer_email
                  FROM " . $this->table_name . " b
                  JOIN tours t ON b.tour_id = t.id
                  JOIN users u ON b.user_id = u.id
                  WHERE t.guide_id = :guide_id
                  ORDER BY b.booking_date DESC";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':guide_id', $guide_id);
        $stmt->execute();

        return $stmt;
    }
}
