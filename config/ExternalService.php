<?php

class ExternalService
{
    public static function requestJson($url, $method = 'GET', $payload = null, $headers = [])
    {
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
}
