<?php
// Headers
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json');

include_once '../../config/Database.php';

// Mock Data for "Places" service
$places = [
    [
        'id' => 101,
        'name' => 'Eiffel Tower',
        'city' => 'Paris',
        'country' => 'France',
        'category' => 'Landmark'
    ],
    [
        'id' => 102,
        'name' => 'Great Wall',
        'city' => 'Beijing',
        'country' => 'China',
        'category' => 'Code Item Review Needed' // Joke? No, just category
    ],
    [
        'id' => 103,
        'name' => 'Grand Canyon',
        'city' => 'Arizona',
        'country' => 'USA',
        'category' => 'Nature'
    ],
    [
        'id' => 104,
        'name' => 'Machu Picchu',
        'city' => 'Cusco',
        'country' => 'Peru',
        'category' => 'Historic'
    ],
    [
        'id' => 105,
        'name' => 'Lalibela',
        'city' => 'Lalibela',
        'country' => 'Ethiopia',
        'category' => 'Historic'
    ]
];

echo json_encode($places);
