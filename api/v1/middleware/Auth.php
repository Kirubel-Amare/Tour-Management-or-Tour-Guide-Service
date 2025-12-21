<?php
class Auth
{
    // Defaults to env API_REVIEW_KEY/REVIEW_API_KEY, falls back to demo key for local
    private static $apiKey = 'demo-api-key';

    public static function authenticate()
    {
        // Be robust to various server header casings and environments
        $headers = function_exists('getallheaders') ? getallheaders() : [];
        $apiKey = $headers['X-API-KEY']
            ?? $headers['x-api-key']
            ?? $headers['X-Api-Key']
            ?? ($_SERVER['HTTP_X_API_KEY'] ?? null)
            ?? ($_SERVER['HTTP_X_API-KEY'] ?? null);

        $envKey = getenv('API_REVIEW_KEY') ?: getenv('REVIEW_API_KEY') ?: self::$apiKey;

        if (!$apiKey || $apiKey !== $envKey) {
            header('Content-Type: application/json');
            http_response_code(401);
            echo json_encode(['error' => 'Unauthorized', 'message' => 'Invalid or missing API Key']);
            exit;
        }
    }
}
