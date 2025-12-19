<?php
class Auth
{
    private static $apiKey = 'demo-api-key'; // Hardcoded for this task

    public static function authenticate()
    {
        $headers = getallheaders();
        $apiKey = $headers['X-API-KEY'] ?? $headers['x-api-key'] ?? null;

        if (!$apiKey || $apiKey !== self::$apiKey) {
            header('Content-Type: application/json');
            http_response_code(401);
            echo json_encode(['error' => 'Unauthorized', 'message' => 'Invalid or missing API Key']);
            exit;
        }
    }
}
