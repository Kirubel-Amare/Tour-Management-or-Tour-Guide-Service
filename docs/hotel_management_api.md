# Hotel Management System - API Documentation
## Group 6 - Service Provider

This document describes how other groups can consume the Hotel Management System API to integrate hotel services into their applications.

---

## Base URL

**Production:**
```
http://hotelmanagemt.infinityfreeapp.com/api
```

**Development:**
```
http://localhost/Webservice_project/api
```

---

## CORS Support

All endpoints include CORS headers, allowing cross-origin requests from any domain:
- `Access-Control-Allow-Origin: *`
- `Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS`
- `Access-Control-Allow-Headers: Content-Type, Authorization`

---

## Response Format

All responses follow this JSON structure:

```json
{
    "success": true,
    "message": "Description of result",
    "data": { ... }
}
```

Error responses:
```json
{
    "success": false,
    "message": "Error description"
}
```

---

## Public Endpoints (No Authentication Required)

### 1. Get All Hotels

Retrieve a list of all available hotels.

**Endpoint:** `GET /api/hotels.php`

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `city` | string | Filter by city name |
| `country` | string | Filter by country |
| `star_rating` | integer | Filter by star rating (1-5) |
| `search` | string | Search in hotel name/description |
| `limit` | integer | Limit results |
| `offset` | integer | Pagination offset |

**Example Request:**
```bash
curl -X GET "http://hotelmanagemt.infinityfreeapp.com/api/hotels.php?city=Paris&star_rating=5"
```

**Example Response:**
```json
{
    "success": true,
    "message": "Hotels retrieved",
    "data": {
        "hotels": [
            {
                "id": 1,
                "name": "The Ritz Paris",
                "description": "Luxury hotel in the heart of Paris",
                "address": "15 Place Vendôme",
                "city": "Paris",
                "country": "France",
                "star_rating": 5,
                "image_url": "https://example.com/ritz.jpg",
                "contact_email": "info@ritzparis.com",
                "contact_phone": "+33 1 43 16 30 30",
                "amenities": ["wifi", "pool", "spa", "restaurant"],
                "status": "active"
            }
        ],
        "count": 1,
        "cities": ["Paris", "London", "Dubai"],
        "countries": ["France", "UK", "UAE"]
    }
}
```

---

### 2. Get Single Hotel

Retrieve details of a specific hotel.

**Endpoint:** `GET /api/hotels.php?id={hotel_id}`

**Example Request:**
```bash
curl -X GET "http://hotelmanagemt.infinityfreeapp.com/api/hotels.php?id=1"
```

---

### 3. Check Room Availability

Get available rooms for specific dates.

**Endpoint:** `GET /api/rooms.php`

**Required Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `hotel_id` | integer | Hotel ID |
| `check_in` | string | Check-in date (YYYY-MM-DD) |
| `check_out` | string | Check-out date (YYYY-MM-DD) |

**Example Request:**
```bash
curl -X GET "http://hotelmanagemt.infinityfreeapp.com/api/rooms.php?hotel_id=1&check_in=2025-01-15&check_out=2025-01-20"
```

**Example Response:**
```json
{
    "success": true,
    "message": "Available rooms retrieved",
    "data": {
        "rooms": [
            {
                "id": 1,
                "room_number": "101",
                "floor": 1,
                "status": "available",
                "room_type": {
                    "id": 1,
                    "name": "Deluxe Room",
                    "description": "Spacious room with city view",
                    "base_price": 250.00,
                    "max_occupancy": 2
                }
            }
        ],
        "count": 1
    }
}
```

---

### 4. Get Room Types

Get all room types for a hotel.

**Endpoint:** `GET /api/room_types.php?hotel_id={hotel_id}`

**Example Response:**
```json
{
    "success": true,
    "message": "Room types retrieved",
    "data": {
        "room_types": [
            {
                "id": 1,
                "name": "Standard Room",
                "description": "Comfortable room with essential amenities",
                "base_price": 150.00,
                "max_occupancy": 2,
                "image_url": "https://example.com/standard.jpg"
            },
            {
                "id": 2,
                "name": "Suite",
                "description": "Luxury suite with separate living area",
                "base_price": 400.00,
                "max_occupancy": 4,
                "image_url": "https://example.com/suite.jpg"
            }
        ]
    }
}
```

---

### 5. Get Amenities

Get list of available amenities.

**Endpoint:** `GET /api/amenities.php`

**Example Response:**
```json
{
    "success": true,
    "message": "Amenities retrieved",
    "data": {
        "amenities": [
            { "id": 1, "name": "Free WiFi", "icon": "wifi" },
            { "id": 2, "name": "Swimming Pool", "icon": "pool" },
            { "id": 3, "name": "Spa", "icon": "spa" },
            { "id": 4, "name": "Restaurant", "icon": "restaurant" },
            { "id": 5, "name": "Gym", "icon": "fitness_center" }
        ]
    }
}
```

---

## Authenticated Endpoints

For booking operations, users must be authenticated.

### Authentication

**Register a new user:**
```bash
POST /api/auth/register.php
Content-Type: application/json

{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "securepassword123",
    "phone": "+1234567890"
}
```

**Login:**
```bash
POST /api/auth/login.php
Content-Type: application/json

{
    "email": "john@example.com",
    "password": "securepassword123"
}
```

**Response:**
```json
{
    "success": true,
    "message": "Login successful",
    "data": {
        "user": {
            "id": 1,
            "name": "John Doe",
            "email": "john@example.com",
            "role": "customer"
        },
        "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
}
```

**Using the Token:**
Include the token in the Authorization header for authenticated requests:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

### 6. Create Booking

Create a new hotel room booking.

**Endpoint:** `POST /api/bookings.php`

**Headers:**
```
Content-Type: application/json
Authorization: Bearer {token}
```

**Request Body:**
```json
{
    "hotel_id": 1,
    "room_id": 5,
    "check_in": "2025-01-15",
    "check_out": "2025-01-20",
    "guests": 2,
    "special_requests": "Late check-in requested"
}
```

**Example Response:**
```json
{
    "success": true,
    "message": "Booking created successfully",
    "data": {
        "id": 123,
        "booking_reference": "BK-ABC12345",
        "user_id": 1,
        "hotel_id": 1,
        "room_id": 5,
        "check_in": "2025-01-15",
        "check_out": "2025-01-20",
        "guests": 2,
        "total_price": 1250.00,
        "status": "confirmed",
        "created_at": "2025-01-10T14:30:00Z"
    }
}
```

---

### 7. Get User Bookings

Retrieve bookings for the authenticated user.

**Endpoint:** `GET /api/bookings.php`

**Headers:**
```
Authorization: Bearer {token}
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `status` | string | Filter by status (pending, confirmed, cancelled) |
| `from_date` | string | Filter from date |
| `to_date` | string | Filter to date |

---

### 8. Cancel Booking

Cancel an existing booking.

**Endpoint:** `DELETE /api/bookings.php?id={booking_id}`

**Headers:**
```
Authorization: Bearer {token}
```

---

## Integration Example (PHP)

```php
<?php
class HotelConsumer {
    private $baseUrl = 'http://hotelmanagemt.infinityfreeapp.com/api';
    
    private function makeRequest($endpoint, $method = 'GET', $data = null, $token = null) {
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $this->baseUrl . $endpoint);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_TIMEOUT, 15);
        
        $headers = ['Content-Type: application/json'];
        if ($token) {
            $headers[] = 'Authorization: Bearer ' . $token;
        }
        curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
        
        if ($method === 'POST') {
            curl_setopt($ch, CURLOPT_POST, true);
            curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
        }
        
        $response = curl_exec($ch);
        curl_close($ch);
        
        return json_decode($response, true);
    }
    
    // Get all hotels
    public function getHotels($city = null, $starRating = null) {
        $params = [];
        if ($city) $params['city'] = $city;
        if ($starRating) $params['star_rating'] = $starRating;
        
        $query = !empty($params) ? '?' . http_build_query($params) : '';
        return $this->makeRequest('/hotels.php' . $query);
    }
    
    // Get hotel by ID
    public function getHotelById($id) {
        return $this->makeRequest('/hotels.php?id=' . $id);
    }
    
    // Check room availability
    public function checkAvailability($hotelId, $checkIn, $checkOut) {
        $params = [
            'hotel_id' => $hotelId,
            'check_in' => $checkIn,
            'check_out' => $checkOut
        ];
        return $this->makeRequest('/rooms.php?' . http_build_query($params));
    }
    
    // Create booking (requires authentication)
    public function createBooking($bookingData, $token) {
        return $this->makeRequest('/bookings.php', 'POST', $bookingData, $token);
    }
}

// Usage example:
$hotelConsumer = new HotelConsumer();

// Get all 5-star hotels in Paris
$hotels = $hotelConsumer->getHotels('Paris', 5);

// Check availability
$rooms = $hotelConsumer->checkAvailability(1, '2025-01-15', '2025-01-20');

// Book a room (after user login)
$booking = $hotelConsumer->createBooking([
    'hotel_id' => 1,
    'room_id' => 5,
    'check_in' => '2025-01-15',
    'check_out' => '2025-01-20',
    'guests' => 2
], $userToken);
```

---

## Integration Example (JavaScript)

```javascript
const HOTEL_API_URL = 'http://hotelmanagemt.infinityfreeapp.com/api';

// Get all hotels
async function getHotels(city = null, starRating = null) {
    const params = new URLSearchParams();
    if (city) params.append('city', city);
    if (starRating) params.append('star_rating', starRating);
    
    const response = await fetch(`${HOTEL_API_URL}/hotels.php?${params}`);
    return response.json();
}

// Check room availability
async function checkAvailability(hotelId, checkIn, checkOut) {
    const params = new URLSearchParams({
        hotel_id: hotelId,
        check_in: checkIn,
        check_out: checkOut
    });
    
    const response = await fetch(`${HOTEL_API_URL}/rooms.php?${params}`);
    return response.json();
}

// Create booking
async function createBooking(bookingData, token) {
    const response = await fetch(`${HOTEL_API_URL}/bookings.php`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(bookingData)
    });
    return response.json();
}

// Usage
const hotels = await getHotels('Dubai', 5);
console.log(hotels.data.hotels);
```

---

## Error Codes

| HTTP Code | Meaning |
|-----------|---------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request - Invalid parameters |
| 401 | Unauthorized - Authentication required |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found |
| 409 | Conflict - Room not available |
| 500 | Server Error |

---

## Rate Limiting

Currently no rate limiting is enforced. Please be respectful of the API.

---

## Contact

For integration support or questions:
- **Group 6 - Hotel Management System**
- Project Repository: [Your Repository URL]

---

## Changelog

- **v1.0** (December 2025) - Initial API release
