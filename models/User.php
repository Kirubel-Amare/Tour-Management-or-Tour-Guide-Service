<?php
class User
{
    private $conn;
    private $json_file = '../../data/users.json'; // Path relative to API files

    // User Properties
    public $id;
    public $name;
    public $email;
    public $password;
    public $role;
    public $created_at;

    // Constructor with DB (kept for compatibility)
    public function __construct($db)
    {
        $this->conn = $db;
        // Fix path if running from root vs api folder
        if (!file_exists($this->json_file) && file_exists('data/users.json')) {
            $this->json_file = 'data/users.json';
        }
    }

    private function getData()
    {
        if (!file_exists($this->json_file)) {
            file_put_contents($this->json_file, '[]');
            return [];
        }
        $content = file_get_contents($this->json_file);
        return json_decode($content, true) ?? [];
    }

    private function saveData($data)
    {
        file_put_contents($this->json_file, json_encode($data, JSON_PRETTY_PRINT));
    }

    // Create User (Register)
    public function create()
    {
        $users = $this->getData();

        // Auto increment ID
        $last_user = end($users);
        $this->id = $last_user ? $last_user['id'] + 1 : 1;
        $this->created_at = date('Y-m-d H:i:s');

        $new_user = [
            'id' => $this->id,
            'name' => $this->name,
            'email' => $this->email,
            'password' => $this->password,
            'role' => $this->role,
            'created_at' => $this->created_at
        ];

        $users[] = $new_user;
        $this->saveData($users);
        return true;
    }

    // Login (Verify)
    public function login()
    {
        $users = $this->getData();
        foreach ($users as $user) {
            if ($user['email'] === $this->email) {
                if (password_verify($this->password, $user['password'])) {
                    $this->id = $user['id'];
                    $this->name = $user['name'];
                    $this->role = $user['role'];
                    return true;
                }
            }
        }
        return false;
    }

    // Check if email exists
    public function emailExists()
    {
        $users = $this->getData();
        foreach ($users as $user) {
            if ($user['email'] === $this->email) {
                return true;
            }
        }
        return false;
    }
}
