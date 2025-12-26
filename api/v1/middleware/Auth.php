<?php
class Auth
{
    // List of valid API keys
    private static $validApiKeys = [
        'demo-api-key',
        'TOUR_SERVICE_KEY_2025',
        'TAXI_GROUP_SECURE_KEY_2024',
    ];

    public static function authenticate()
    {
        // Be robust to various server header casings and environments
        $headers = function_exists('getallheaders') ? getallheaders() : [];
        $apiKey = $headers['X-API-KEY']
            ?? $headers['x-api-key']
            ?? $headers['X-Api-Key']
            ?? ($_SERVER['HTTP_X_API_KEY'] ?? null)
            ?? ($_SERVER['HTTP_X_API-KEY'] ?? null);

        // Add environment keys if set
        $envKeys = array_filter([
            getenv('API_REVIEW_KEY'),
            getenv('REVIEW_API_KEY'),
        ]);
        $allValidKeys = array_merge(self::$validApiKeys, $envKeys);

        if (!$apiKey || !in_array($apiKey, $allValidKeys, true)) {
            header('Content-Type: application/json');
            http_response_code(401);
            echo json_encode(['error' => 'Unauthorized', 'message' => 'Invalid or missing API Key']);
            exit;
        }
    }
}