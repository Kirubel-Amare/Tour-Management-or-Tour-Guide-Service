#!/bin/bash

BASE_URL="http://localhost:8000/api/auth"

echo "1. Registering Tour Guide..."
curl -X POST $BASE_URL/register.php \
     -H "Content-Type: application/json" \
     -d '{"name": "Guide One", "email": "guide1@example.com", "password": "password123", "role": "guide"}'
echo -e "\n"

echo "2. Registering Tourist..."
curl -X POST $BASE_URL/register.php \
     -H "Content-Type: application/json" \
     -d '{"name": "Tourist One", "email": "tourist1@example.com", "password": "password123", "role": "tourist"}'
echo -e "\n"

echo "3. Logging in as Guide..."
curl -c cookies.txt -X POST $BASE_URL/login.php \
     -H "Content-Type: application/json" \
     -d '{"email": "guide1@example.com", "password": "password123"}'
echo -e "\n"

echo "4. Logging out..."
curl -b cookies.txt -X POST $BASE_URL/logout.php
echo -e "\n"
