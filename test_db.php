<?php
try {
    $host = '127.0.0.1';
    $db_name = 'tourism_db';
    $username = 'root';
    $password = '';
    $conn = new PDO("mysql:host=$host;dbname=$db_name", $username, $password);
    echo "Connected successfully to 127.0.0.1\n";
} catch (PDOException $e) {
    echo "Connection failed to 127.0.0.1: " . $e->getMessage() . "\n";
}

try {
    $host = 'localhost';
    $conn = new PDO("mysql:host=$host;dbname=$db_name", $username, $password);
    echo "Connected successfully to localhost\n";
} catch (PDOException $e) {
    echo "Connection failed to localhost: " . $e->getMessage() . "\n";
}
