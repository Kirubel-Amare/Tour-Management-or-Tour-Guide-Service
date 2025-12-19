<?php
class Database
{
    private $driver;
    private $host;
    private $port;
    private $db_name;
    private $username;
    private $password;
    private $conn;

    public function __construct()
    {
        // Defaults allow local development without env vars
        $this->driver = getenv('DB_DRIVER') ?: 'mysql';
        $this->host = getenv('DB_HOST') ?: '127.0.0.1';
        $this->port = getenv('DB_PORT') ?: ($this->driver === 'pgsql' ? '5432' : '3306');
        $this->db_name = getenv('DB_NAME') ?: 'tourism_db';
        $this->username = getenv('DB_USER') ?: 'root';
        $this->password = getenv('DB_PASSWORD') ?: '';

        // Render-style single DATABASE_URL overrides discrete values
        $databaseUrl = getenv('DATABASE_URL');
        if ($databaseUrl) {
            $parts = parse_url($databaseUrl);
            if ($parts) {
                $scheme = $parts['scheme'] ?? $this->driver;
                // Normalize common postgres schemes
                if (in_array($scheme, ['postgres', 'postgresql'])) {
                    $scheme = 'pgsql';
                }
                $this->driver = $scheme;
                $this->host = $parts['host'] ?? $this->host;
                $this->port = $parts['port'] ?? ($this->driver === 'pgsql' ? '5432' : '3306');
                $this->db_name = isset($parts['path']) ? ltrim($parts['path'], '/') : $this->db_name;
                $this->username = $parts['user'] ?? $this->username;
                $this->password = $parts['pass'] ?? $this->password;
            }
        }
    }

    // DB connect method
    public function connect()
    {
        $this->conn = null;

        try {
            $dsn = $this->buildDsn();
            $this->conn = new PDO($dsn, $this->username, $this->password);
            $this->conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        } catch (PDOException $e) {
            echo 'Connection Error: ' . $e->getMessage();
        }

        return $this->conn;
    }

    private function buildDsn(): string
    {
        if ($this->driver === 'pgsql') {
            return sprintf('pgsql:host=%s;port=%s;dbname=%s;sslmode=require', $this->host, $this->port, $this->db_name);
        }

        // Fallback to MySQL
        return sprintf('mysql:host=%s;port=%s;dbname=%s;charset=utf8mb4', $this->host, $this->port, $this->db_name);
    }
}
