<?php

class ExternalService
{
    public static function requestJson($url, $method = 'GET', $payload = null, $headers = [], $attempt = 0)
    {
        // Check for Mock Mode
        if (getenv('EXTERNAL_API_MODE') === 'mock') {
            return self::mockRequest($url, $method, $payload);
        }

        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_CUSTOMREQUEST, strtoupper($method));
        curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
        curl_setopt($ch, CURLOPT_MAXREDIRS, 3);
        curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 10);
        curl_setopt($ch, CURLOPT_USERAGENT, 'TourMgmtClient/1.0');

        // Allow disabling SSL verification in dev if needed
        $insecure = getenv('ALLOW_INSECURE_SSL') === 'true';
        if ($insecure) {
            curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
            curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, false);
        }

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

        // Handle anti-bot JS challenge pages by solving __test cookie once
        if ($response && strpos($response, 'slowAES.decrypt') !== false && $attempt === 0) {
            $challenge = self::solveJsChallenge($response);
            if ($challenge !== null) {
                [$cookieValue, $redirectUrl] = $challenge;
                // Retry original (or suggested redirect) with cookie header attached
                $headersWithCookie = $headers;
                    $headersWithCookie = array_values(array_filter($headers, fn($h) => stripos($h, 'Cookie:') !== 0));
                $headersWithCookie[] = 'Cookie: __test=' . $cookieValue;

                $retryUrl = $redirectUrl ?: $url;
                return self::requestJson($retryUrl, $method, $payload, $headersWithCookie, $attempt + 1);
            }
        }

        if ($curlError) {
            return ['ok' => false, 'status' => 0, 'error' => $curlError, 'data' => null];
        }

        $decoded = json_decode($response, true);
        if ($decoded === null && json_last_error() !== JSON_ERROR_NONE) {
            // If provider returns non-JSON but HTTP 2xx, treat raw body as data so we don't fail bookings
            if ($status >= 200 && $status < 300) {
                return [
                    'ok' => true,
                    'status' => $status,
                    'error' => null,
                    'data' => $response
                ];
            }

            return ['ok' => false, 'status' => $status, 'error' => 'Invalid JSON response', 'data' => $response];
        }

        return [
            'ok' => $status >= 200 && $status < 300,
            'status' => $status,
            'error' => null,
            'data' => $decoded
        ];
    }

    private static function solveJsChallenge($body)
    {
        // Extract key/iv/ciphertext from the challenge script
        if (!preg_match('/toNumbers\("([0-9a-fA-F]+)"\).*toNumbers\("([0-9a-fA-F]+)"\).*toNumbers\("([0-9a-fA-F]+)"\)/s', $body, $m)) {
            return null;
        }
        $keyHex = $m[1];
        $ivHex = $m[2];
        $cipherHex = $m[3];

        $key = @hex2bin($keyHex);
        $iv = @hex2bin($ivHex);
        $cipher = @hex2bin($cipherHex);
        if ($key === false || $iv === false || $cipher === false) {
            return null;
        }

        // Try with PKCS padding first, then no padding (some slowAES challenges omit padding)
        $plain = @openssl_decrypt($cipher, 'AES-128-CBC', $key, OPENSSL_RAW_DATA, $iv);
        if ($plain === false) {
            $plain = @openssl_decrypt($cipher, 'AES-128-CBC', $key, OPENSSL_RAW_DATA | OPENSSL_ZERO_PADDING, $iv);
        }
        if ($plain === false) {
            return null;
        }
        // Trim any trailing nulls that may come from zero-padding
        $plain = rtrim($plain, "\0");

        $cookieValue = bin2hex($plain);

        $redirectUrl = null;
        if (preg_match('/location.href="([^"]+)"/s', $body, $u)) {
            $redirectUrl = html_entity_decode($u[1]);
        }

        return [$cookieValue, $redirectUrl];
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
