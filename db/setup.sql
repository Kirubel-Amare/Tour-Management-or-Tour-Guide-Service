CREATE DATABASE IF NOT EXISTS tourism_db;
USE tourism_db;

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('admin', 'manager', 'customer') NOT NULL DEFAULT 'customer',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tours table
CREATE TABLE IF NOT EXISTS tours (
    id INT AUTO_INCREMENT PRIMARY KEY,
    guide_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    image TEXT,
    location VARCHAR(255) NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    schedule_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (guide_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Bookings table
CREATE TABLE IF NOT EXISTS bookings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tour_id INT NOT NULL,
    tourist_id INT NOT NULL,
    booking_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status ENUM('pending', 'confirmed', 'cancelled') DEFAULT 'pending',
    FOREIGN KEY (tour_id) REFERENCES tours(id) ON DELETE CASCADE,
    FOREIGN KEY (tourist_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Places table
CREATE TABLE IF NOT EXISTS places (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(100) NOT NULL,
    continent VARCHAR(100) NOT NULL,
    climate VARCHAR(100) DEFAULT 'Temperate',
    description TEXT,
    image TEXT,
    rating DECIMAL(3,1) DEFAULT 4.5,
    reviews INT DEFAULT 0,
    features JSON NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Hotels table
CREATE TABLE IF NOT EXISTS hotels (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    location VARCHAR(255) NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    rating DECIMAL(3,1) DEFAULT 4.0,
    reviews INT DEFAULT 0,
    description TEXT,
    image TEXT,
    room_type VARCHAR(100) DEFAULT 'Standard',
    hotel_rating INT DEFAULT 4,
    amenities JSON NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Restaurants table
CREATE TABLE IF NOT EXISTS restaurants (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    location VARCHAR(255) NOT NULL,
    cuisine VARCHAR(100) NOT NULL,
    price_range VARCHAR(10) DEFAULT '$$ ',
    rating DECIMAL(3,1) DEFAULT 4.0,
    reviews INT DEFAULT 0,
    description TEXT,
    image TEXT,
    features JSON NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Hotel reservations
CREATE TABLE IF NOT EXISTS hotel_reservations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    hotel_id INT NOT NULL,
    check_in DATE NOT NULL,
    check_out DATE NOT NULL,
    guests INT DEFAULT 1,
    room_type VARCHAR(100) DEFAULT 'Standard',
    status ENUM('pending','confirmed','cancelled') DEFAULT 'confirmed',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (hotel_id) REFERENCES hotels(id) ON DELETE CASCADE
);

-- Restaurant reservations
CREATE TABLE IF NOT EXISTS restaurant_reservations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    restaurant_id INT NOT NULL,
    date DATE NOT NULL,
    time TIME NOT NULL,
    guests INT DEFAULT 2,
    notes TEXT,
    status ENUM('pending','confirmed','cancelled') DEFAULT 'confirmed',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE
);

-- Taxi orders
CREATE TABLE IF NOT EXISTS taxi_orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    pickup VARCHAR(255) NOT NULL,
    destination VARCHAR(255) NOT NULL,
    vehicle_type VARCHAR(50) DEFAULT 'standard',
    schedule VARCHAR(50) DEFAULT 'now',
    custom_time DATETIME NULL,
    distance_km DECIMAL(6,2) DEFAULT 0,
    fare DECIMAL(10,2) DEFAULT 0,
    eta_minutes INT DEFAULT 10,
    status ENUM('pending','accepted','completed','cancelled') DEFAULT 'accepted',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Seed data for demo
INSERT INTO places (name, type, continent, climate, description, image, rating, reviews, features) VALUES
('Paris, France', 'City', 'Europe', 'Temperate', 'Romantic capital of France with art, fashion, and cuisine.', 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=800&q=80', 4.8, 1245, JSON_ARRAY('Eiffel Tower','Louvre Museum','Notre-Dame','Champs-Élysées')),
('Bali, Indonesia', 'Beach', 'Asia', 'Tropical', 'Island paradise with beaches, reefs, and rice paddies.', 'https://images.unsplash.com/photo-1537953773345-d172ccf13cf1?auto=format&fit=crop&w=800&q=80', 4.9, 892, JSON_ARRAY('Ubud','Kuta Beach','Tanah Lot','Uluwatu Temple'));

INSERT INTO hotels (name, location, price, rating, reviews, description, image, room_type, hotel_rating, amenities) VALUES
('Paris Luxury Hotel', 'Paris, France', 299.99, 4.8, 456, '5-star hotel in central Paris with Eiffel Tower views.', 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80', 'Suite', 5, JSON_ARRAY('Wi-Fi','Pool','Spa','Restaurant','Gym')),
('Tokyo Central Hotel', 'Tokyo, Japan', 199.99, 4.6, 321, 'Modern hotel in central Tokyo close to attractions.', 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80', 'Double', 4, JSON_ARRAY('Wi-Fi','Restaurant','Concierge','Laundry'));

INSERT INTO restaurants (name, location, cuisine, price_range, rating, reviews, description, image, features) VALUES
('Le Gourmet Paris', 'Paris, France', 'French', '$$$$', 4.9, 287, 'Michelin-starred restaurant with modern French cuisine.', 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80', JSON_ARRAY('Fine dining','Wine pairing','Romantic ambiance','Chef"s table')),
('Tokyo Sushi Master', 'Tokyo, Japan', 'Japanese', '$$$', 4.8, 412, 'Authentic sushi with fresh ingredients and master chefs.', 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80', JSON_ARRAY('Omakase','Sushi bar','Fresh seafood','Traditional'));
