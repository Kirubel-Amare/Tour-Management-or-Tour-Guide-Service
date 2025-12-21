<?php
class Auth
{
    // Defaults to env API_REVIEW_KEY/REVIEW_API_KEY, falls back to demo key for local
    private static $apiKey = 'demo-api-key';

    public static function authenticate()
    {
        $headers = getallheaders();
        $apiKey = $headers['X-API-KEY'] ?? $headers['x-api-key'] ?? null;

        $envKey = getenv('API_REVIEW_KEY') ?: getenv('REVIEW_API_KEY') ?: self::$apiKey;

        if (!$apiKey || $apiKey !== $envKey) {
            header('Content-Type: application/json');
            http_response_code(401);
            echo json_encode(['error' => 'Unauthorized', 'message' => 'Invalid or missing API Key']);
            exit;
        }
    }
}
