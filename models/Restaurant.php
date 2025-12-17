<?php

class Restaurant
{
    private $conn;
    private $table = 'restaurants';
    private $reservationTable = 'restaurant_reservations';

    public function __construct($db)
    {
        $this->conn = $db;
    }

    public function read()
    {
        $query = "SELECT id, name, location, cuisine, price_range, rating, reviews, description, image, features FROM {$this->table} ORDER BY id DESC";
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        return $stmt;
    }

    public function reserve(array $data)
    {
        $query = "INSERT INTO {$this->reservationTable} (user_id, restaurant_id, date, time, guests, notes, status)
                  VALUES (:user_id, :restaurant_id, :date, :time, :guests, :notes, 'confirmed')";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':user_id', $data['user_id']);
        $stmt->bindParam(':restaurant_id', $data['restaurant_id']);
        $stmt->bindParam(':date', $data['date']);
        $stmt->bindParam(':time', $data['time']);
        $stmt->bindParam(':guests', $data['guests']);
        $stmt->bindParam(':notes', $data['notes']);
        $stmt->execute();
        return $this->conn->lastInsertId();
    }
}
