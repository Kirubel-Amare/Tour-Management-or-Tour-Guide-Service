<?php

header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, X-API-KEY');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

// API key check (simple, not using Auth class)
$apiKey = $_SERVER['HTTP_X_API_KEY'] ?? $_SERVER['HTTP_X-API-KEY'] ?? $_SERVER['HTTP_X_API_KEY'] ?? null;
if (!$apiKey || $apiKey !== 'HOTEL_SERVICE_KEY_2025') {
    http_response_code(401);
    echo json_encode(['error' => 'Unauthorized', 'message' => 'Invalid or missing API Key']);
    exit;
}

$baseUrl = 'https://restaurant-managment-system.free.nf/api/service-provider.php';
$DEBUG = (isset($_GET['debug']) && $_GET['debug'] === '1');

function do_curl($url, $method = 'GET', $payload = null, $headers = []) {
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $method);
    if ($payload) {
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
        $headers[] = 'Content-Type: application/json';
    }
    if (!empty($headers)) {
        curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
    }
    $result = curl_exec($ch);
    $err = curl_error($ch);
    $status = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    return [$result, $status, $err];
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $action = $_GET['action'] ?? '';
    if ($action === 'restaurant_details' && isset($_GET['id'])) {
        $url = $baseUrl . '?action=restaurant_details&id=' . urlencode($_GET['id']);
        list($result, $status, $err) = do_curl($url);
        if ($err) {
            http_response_code(503);
            echo json_encode(['error' => $err]);
            exit;
        }
        http_response_code($status);
        echo $result;
        exit;
    } elseif ($action === 'check_availability' && isset($_GET['restaurant_id'], $_GET['date'], $_GET['time'], $_GET['guests'])) {
        $url = $baseUrl . '?action=check_availability&restaurant_id=' . urlencode($_GET['restaurant_id']) . '&date=' . urlencode($_GET['date']) . '&time=' . urlencode($_GET['time']) . '&guests=' . urlencode($_GET['guests']);
        list($result, $status, $err) = do_curl($url);
        if ($err) {
            http_response_code(503);
            echo json_encode(['error' => $err]);
            exit;
        }
        http_response_code($status);
        echo $result;
        exit;
    } else {
        // Default: get all restaurants
        $url = $baseUrl . '?action=restaurants';
        list($result, $status, $err) = do_curl($url);
        if ($err) {
            http_response_code(503);
            echo json_encode(['error' => $err]);
            exit;
        }
        http_response_code($status);
        echo $result;
        exit;
    }
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $action = $_GET['action'] ?? '';
    if ($action === 'create_reservation') {
        $payload = json_decode(file_get_contents('php://input'), true);
        if (!$payload) {
            http_response_code(400);
            echo json_encode(['error' => 'Invalid JSON payload']);
            exit;
        }
        $url = $baseUrl . '?action=create_reservation';
        list($result, $status, $err) = do_curl($url, 'POST', $payload);
        if ($err) {
            http_response_code(503);
            echo json_encode(['error' => $err]);
            exit;
        }
        http_response_code($status);
        echo $result;
        exit;
    }
    http_response_code(400);
    echo json_encode(['error' => 'Invalid action for POST']);
    exit;
}

http_response_code(405);
echo json_encode(['error' => 'Method Not Allowed']);
