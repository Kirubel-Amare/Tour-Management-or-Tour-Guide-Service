<?php
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-API-KEY');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

require_once 'middleware/Auth.php';
require_once '../../config/Database.php';
require_once '../../models/Place.php';

// Enforce API key auth
Auth::authenticate();

$database = new Database();
$db = $database->connect();

function respond($code, $payload) {
    http_response_code($code);
    echo json_encode($payload);
    exit;
}

$q = isset($_GET['q']) ? trim($_GET['q']) : '';
$type = isset($_GET['type']) ? trim($_GET['type']) : '';
$continent = isset($_GET['continent']) ? trim($_GET['continent']) : '';
$climate = isset($_GET['climate']) ? trim($_GET['climate']) : '';

$place = new Place($db);
$stmt = $place->read();
$rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

// Apply filters client-side for simplicity
$rows = array_values(array_filter($rows, function ($r) use ($q, $type, $continent, $climate) {
    if ($q !== '') {
        $needle = mb_strtolower($q);
        $hay = mb_strtolower(($r['name'] ?? '') . ' ' . ($r['description'] ?? ''));
        if (strpos($hay, $needle) === false) return false;
    }
    if ($type !== '' && strcasecmp($r['type'] ?? '', $type) !== 0) return false;
    if ($continent !== '' && strcasecmp($r['continent'] ?? '', $continent) !== 0) return false;
    if ($climate !== '' && strcasecmp($r['climate'] ?? '', $climate) !== 0) return false;
    return true;
}));

respond(200, ['source' => 'db', 'data' => $rows]);
