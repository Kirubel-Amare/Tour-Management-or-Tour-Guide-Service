<?php

class Place
{
    private $conn;
    private $table = 'places';

    public function __construct($db)
    {
        $this->conn = $db;
    }

    public function read()
    {
        $query = "SELECT id, name, type, continent, climate, description, image, rating, reviews, features FROM {$this->table} ORDER BY id DESC";
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        return $stmt;
    }
}
