<?php

class ExternalService
{
    public static function requestJson($url, $method = 'GET', $payload = null, $headers = [])
    {
        // Check for Mock Mode
        if (getenv('EXTERNAL_API_MODE') === 'mock') {
            return self::mockRequest($url, $method, $payload);
        }

        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_CUSTOMREQUEST, strtoupper($method));

        $requestHeaders = array_merge(['Accept: application/json'], $headers);

        if ($payload !== null) {
            $json = json_encode($payload);
            $requestHeaders[] = 'Content-Type: application/json';
            curl_setopt($ch, CURLOPT_POSTFIELDS, $json);
        }

        curl_setopt($ch, CURLOPT_HTTPHEADER, $requestHeaders);
        curl_setopt($ch, CURLOPT_TIMEOUT, 10);

        $response = curl_exec($ch);
        $curlError = curl_error($ch);
        $status = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($curlError) {
            return ['ok' => false, 'status' => 0, 'error' => $curlError, 'data' => null];
        }

        $decoded = json_decode($response, true);
        if ($decoded === null && json_last_error() !== JSON_ERROR_NONE) {
            return ['ok' => false, 'status' => $status, 'error' => 'Invalid JSON response', 'data' => null];
        }

        return [
            'ok' => $status >= 200 && $status < 300,
            'status' => $status,
            'error' => null,
            'data' => $decoded
        ];
    }

    private static function mockRequest($url, $method, $payload)
    {
        // Simulate network delay
        usleep(200000); // 200ms

        $data = [];

        // Mock Logic based on URL context
        if (strpos($url, 'hotel') !== false) {
            if ($method === 'POST') {
                $data = [
                    'reservation_id' => 'mock-ext-' . uniqid(),
                    'confirmation' => 'HOTEL-' . strtoupper(substr(md5(uniqid()), 0, 6)),
                    'status' => 'confirmed',
                    'hotel_name' => 'Mock Grand Hotel',
                    'message' => 'Reservation confirmed! Your room is ready.'
                ];
            } else {
                $data = [
                    [
                        'id' => 'ext-1',
                        'name' => 'Mock Placid Hotel',
                        'location' => 'Paris, France',
                        'price' => 150,
                        'rating' => 4.5,
                        'reviews' => 120,
                        'description' => 'A wonderful mock hotel.',
                        'image' => 'https://via.placeholder.com/600x400?text=Hotel+Paris',
                        'roomType' => 'Standard',
                        'hotelRating' => 5,
                        'amenities' => ['pool', 'wifi', 'mock-gym']
                    ],
                    [
                        'id' => 'ext-2',
                        'name' => 'Mock Central Inn',
                        'location' => 'London, UK',
                        'price' => 200,
                        'rating' => 4.0,
                        'reviews' => 85,
                        'description' => 'Central location mock hotel.',
                        'image' => 'https://via.placeholder.com/600x400?text=Hotel+London',
                        'roomType' => 'Suite',
                        'hotelRating' => 4,
                        'amenities' => ['wifi', 'parking']
                    ]
                ];
            }
        } elseif (strpos($url, 'restaurant') !== false) {
            if ($method === 'POST') {
                $data = [
                    'reservation_id' => 'mock-rest-' . uniqid(),
                    'confirmation' => 'REST-' . strtoupper(substr(md5(uniqid()), 0, 6)),
                    'status' => 'confirmed',
                    'restaurant_name' => 'Mock Gourmet Bistro',
                    'message' => 'Table reserved via External Mock'
                ];
            } else {
                $data = [
                    [
                        'id' => 'ext-r1',
                        'name' => 'Mock Bistro',
                        'location' => 'Rome, Italy',
                        'cuisine' => 'Italian',
                        'priceRange' => '$$',
                        'rating' => 4.7,
                        'reviews' => 210,
                        'description' => 'Authentic mock pasta.',
                        'image' => 'https://via.placeholder.com/600x400?text=Italian+Bistro',
                        'features' => ['outdoor', 'live music']
                    ]
                ];
            }
        } elseif (strpos($url, 'taxi') !== false) {
            // Taxi usually POST for order/estimate
            $pickup = $payload['pickup'] ?? 'Unknown';
            $dist = 15;
            $data = [
                'ride_id' => 'mock-taxi-' . uniqid(),
                'confirmation' => 'TAXI-' . strtoupper(substr(md5(uniqid()), 0, 6)),
                'status' => 'confirmed',
                'message' => 'Taxi Dispatch Confirmed',
                'pickup' => $pickup,
                'destination' => $payload['destination'] ?? 'Unknown',
                'vehicleType' => $payload['vehicleType'] ?? 'standard',
                'schedule' => $payload['schedule'] ?? 'now',
                'distance_km' => $dist,
                'eta_minutes' => 12,
                'fare' => 35.50,
                'driver' => 'Mock Driver John',
                'plate' => 'MOCK-123'
            ];
        }

        return [
            'ok' => true,
            'status' => 200,
            'error' => null,
            'data' => $data
        ];
    }
}
