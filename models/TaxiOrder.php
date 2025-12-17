<?php

class TaxiOrder
{
    private $conn;
    private $table = 'taxi_orders';

    public function __construct($db)
    {
        $this->conn = $db;
    }

    public function create(array $data)
    {
        $query = "INSERT INTO {$this->table} (user_id, pickup, destination, vehicle_type, schedule, custom_time, distance_km, fare, eta_minutes, status)
                  VALUES (:user_id, :pickup, :destination, :vehicle_type, :schedule, :custom_time, :distance_km, :fare, :eta_minutes, 'accepted')";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':user_id', $data['user_id']);
        $stmt->bindParam(':pickup', $data['pickup']);
        $stmt->bindParam(':destination', $data['destination']);
        $stmt->bindParam(':vehicle_type', $data['vehicle_type']);
        $stmt->bindParam(':schedule', $data['schedule']);
        $stmt->bindParam(':custom_time', $data['custom_time']);
        $stmt->bindParam(':distance_km', $data['distance_km']);
        $stmt->bindParam(':fare', $data['fare']);
        $stmt->bindParam(':eta_minutes', $data['eta_minutes']);
        $stmt->execute();
        return $this->conn->lastInsertId();
    }
}
