<?php
class AuthMiddleware
{
    public static function isAuthenticated()
    {
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }

        if (!isset($_SESSION['user_id'])) {
            http_response_code(401);
            echo json_encode(['message' => 'Unauthorized']);
            exit;
        }
        return true;
    }

    public static function authorize($allowed_roles = [])
    {
        self::isAuthenticated();

        if (empty($allowed_roles)) {
            return true;
        }

        if (!in_array($_SESSION['user_role'], $allowed_roles)) {
            http_response_code(403);
            echo json_encode(['message' => 'Forbidden: You do not have permission to access this resource']);
            exit;
        }
        return true;
    }
}
