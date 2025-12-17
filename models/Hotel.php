<?php

class Hotel
{
    private $conn;
    private $table = 'hotels';
    private $reservationTable = 'hotel_reservations';

    public function __construct($db)
    {
        $this->conn = $db;
    }

    public function read()
    {
        $query = "SELECT id, name, location, price, rating, reviews, description, image, room_type, hotel_rating, amenities FROM {$this->table} ORDER BY id DESC";
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        return $stmt;
    }

    public function book(array $data)
    {
        $query = "INSERT INTO {$this->reservationTable} (user_id, hotel_id, check_in, check_out, guests, room_type, status)
                  VALUES (:user_id, :hotel_id, :check_in, :check_out, :guests, :room_type, 'confirmed')";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':user_id', $data['user_id']);
        $stmt->bindParam(':hotel_id', $data['hotel_id']);
        $stmt->bindParam(':check_in', $data['check_in']);
        $stmt->bindParam(':check_out', $data['check_out']);
        $stmt->bindParam(':guests', $data['guests']);
        $stmt->bindParam(':room_type', $data['room_type']);
        $stmt->execute();
        return $this->conn->lastInsertId();
    }
}
