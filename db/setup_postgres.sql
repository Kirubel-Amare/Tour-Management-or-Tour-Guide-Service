-- PostgreSQL schema for Render (no CREATE DATABASE; Render manages the DB)

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('admin', 'manager', 'customer')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tours table
CREATE TABLE IF NOT EXISTS tours (
    id SERIAL PRIMARY KEY,
    guide_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    image TEXT,
    location VARCHAR(255) NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    schedule_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Bookings table
CREATE TABLE IF NOT EXISTS bookings (
    id SERIAL PRIMARY KEY,
    tour_id INTEGER NOT NULL REFERENCES tours(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    booking_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled'))
);

-- Tour reviews
CREATE TABLE IF NOT EXISTS tour_reviews (
    id SERIAL PRIMARY KEY,
    tour_id INTEGER NOT NULL REFERENCES tours(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    rating DECIMAL(2,1) NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Places table
CREATE TABLE IF NOT EXISTS places (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(100) NOT NULL,
    continent VARCHAR(100) NOT NULL,
    climate VARCHAR(100) DEFAULT 'Temperate',
    description TEXT,
    image TEXT,
    rating DECIMAL(3,1) DEFAULT 4.5,
    reviews INTEGER DEFAULT 0,
    features JSONB NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Hotels table
CREATE TABLE IF NOT EXISTS hotels (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    location VARCHAR(255) NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    rating DECIMAL(3,1) DEFAULT 4.0,
    reviews INTEGER DEFAULT 0,
    description TEXT,
    image TEXT,
    room_type VARCHAR(100) DEFAULT 'Standard',
    hotel_rating INTEGER DEFAULT 4,
    amenities JSONB NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Restaurants table
CREATE TABLE IF NOT EXISTS restaurants (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    location VARCHAR(255) NOT NULL,
    cuisine VARCHAR(100) NOT NULL,
    price_range VARCHAR(10) DEFAULT '$$ ',
    rating DECIMAL(3,1) DEFAULT 4.0,
    reviews INTEGER DEFAULT 0,
    description TEXT,
    image TEXT,
    features JSONB NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Hotel reservations
CREATE TABLE IF NOT EXISTS hotel_reservations (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    hotel_id INTEGER NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
    check_in DATE NOT NULL,
    check_out DATE NOT NULL,
    guests INTEGER DEFAULT 1,
    room_type VARCHAR(100) DEFAULT 'Standard',
    status TEXT DEFAULT 'confirmed' CHECK (status IN ('pending','confirmed','cancelled')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Restaurant reservations
CREATE TABLE IF NOT EXISTS restaurant_reservations (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    restaurant_id INTEGER NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    time TIME NOT NULL,
    guests INTEGER DEFAULT 2,
    notes TEXT,
    status TEXT DEFAULT 'confirmed' CHECK (status IN ('pending','confirmed','cancelled')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Taxi orders
CREATE TABLE IF NOT EXISTS taxi_orders (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    pickup VARCHAR(255) NOT NULL,
    destination VARCHAR(255) NOT NULL,
    vehicle_type VARCHAR(50) DEFAULT 'standard',
    schedule VARCHAR(50) DEFAULT 'now',
    custom_time TIMESTAMP NULL,
    distance_km DECIMAL(6,2) DEFAULT 0,
    fare DECIMAL(10,2) DEFAULT 0,
    eta_minutes INTEGER DEFAULT 10,
    status TEXT DEFAULT 'accepted' CHECK (status IN ('pending','accepted','completed','cancelled')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Seed data for demo
INSERT INTO places (name, type, continent, climate, description, image, rating, reviews, features) VALUES
('Paris, France', 'City', 'Europe', 'Temperate', 'Romantic capital of France with art, fashion, and cuisine.', 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=800&q=80', 4.8, 1245, '["Eiffel Tower","Louvre Museum","Notre-Dame","Champs-Élysées"]'::jsonb),
('Bali, Indonesia', 'Beach', 'Asia', 'Tropical', 'Island paradise with beaches, reefs, and rice paddies.', 'https://images.unsplash.com/photo-1537953773345-d172ccf13cf1?auto=format&fit=crop&w=800&q=80', 4.9, 892, '["Ubud","Kuta Beach","Tanah Lot","Uluwatu Temple"]'::jsonb);

INSERT INTO hotels (name, location, price, rating, reviews, description, image, room_type, hotel_rating, amenities) VALUES
('Paris Luxury Hotel', 'Paris, France', 299.99, 4.8, 456, '5-star hotel in central Paris with Eiffel Tower views.', 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80', 'Suite', 5, '["Wi-Fi","Pool","Spa","Restaurant","Gym"]'::jsonb),
('Tokyo Central Hotel', 'Tokyo, Japan', 199.99, 4.6, 321, 'Modern hotel in central Tokyo close to attractions.', 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80', 'Double', 4, '["Wi-Fi","Restaurant","Concierge","Laundry"]'::jsonb);

INSERT INTO restaurants (name, location, cuisine, price_range, rating, reviews, description, image, features) VALUES
('Le Gourmet Paris', 'Paris, France', 'French', '$$$$', 4.9, 287, 'Michelin-starred restaurant with modern French cuisine.', 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80', '["Fine dining","Wine pairing","Romantic ambiance","Chef\"s table"]'::jsonb),
('Tokyo Sushi Master', 'Tokyo, Japan', 'Japanese', '$$$', 4.8, 412, 'Authentic sushi with fresh ingredients and master chefs.', 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80', '["Omakase","Sushi bar","Fresh seafood","Traditional"]'::jsonb);
