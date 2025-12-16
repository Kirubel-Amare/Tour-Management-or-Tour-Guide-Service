<?php
try {
    $conn = new PDO('mysql:host=127.0.0.1;dbname=tourism_db', 'root', '');
    $stmt = $conn->query("SHOW TABLES");
    $tables = $stmt->fetchAll(PDO::FETCH_Column);
    print_r($tables);
} catch (Exception $e) {
    echo "Error 127.0.0.1: " . $e->getMessage() . "\n";
}

try {
    $conn = new PDO('mysql:host=localhost;dbname=tourism_db', 'root', '');
    $stmt = $conn->query("SHOW TABLES");
    $tables = $stmt->fetchAll(PDO::FETCH_Column);
    print_r($tables);
} catch (Exception $e) {
    echo "Error localhost: " . $e->getMessage() . "\n";
}
