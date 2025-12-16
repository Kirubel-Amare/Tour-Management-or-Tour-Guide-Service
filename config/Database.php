<?php
class Database
{
    // DB Params
    private $host = '127.0.0.1';
    private $db_name = 'tourism_db';
    private $username = 'root';
    private $password = ''; // Default for local dev, changeable
    private $conn;

    // DB Connect
    public function connect()
    {
        $this->conn = null;

        try {
            $this->conn = new PDO('mysql:host=' . $this->host . ';dbname=' . $this->db_name, $this->username, $this->password);
            $this->conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        } catch (PDOException $e) {
            // echo 'Connection Error: ' . $e->getMessage();
        }

        return $this->conn;
    }
}
