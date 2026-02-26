-- Ascension Authentication Database
-- Másold be ezt phpMyAdmin-ba az SQL fülön és kattints a Végrehajtás gombra

CREATE DATABASE IF NOT EXISTS ascension_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE ascension_db;

CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Alkohol követési tábla
CREATE TABLE IF NOT EXISTS alcohol_entries (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    drink_type VARCHAR(100) NOT NULL,
    amount_ml INT NOT NULL,
    alcohol_percentage DECIMAL(4,2) NOT NULL,
    calories INT NOT NULL,
    date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_date (user_id, date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Kalória számláló (étel) követési tábla
CREATE TABLE IF NOT EXISTS food_entries (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    food_name VARCHAR(200) NOT NULL,
    grams INT NOT NULL,
    calories INT NOT NULL,
    protein_g DECIMAL(6,1) NOT NULL,
    carbs_g DECIMAL(6,1) NOT NULL,
    date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_date (user_id, date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Edzés követési tábla
CREATE TABLE IF NOT EXISTS workout_entries (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    workout_type VARCHAR(100) NOT NULL,
    exercise_name VARCHAR(200) NOT NULL,
    duration_minutes INT NOT NULL,
    calories_burned INT NOT NULL,
    sets INT DEFAULT NULL,
    reps INT DEFAULT NULL,
    weight_kg DECIMAL(5,1) DEFAULT NULL,
    notes TEXT DEFAULT NULL,
    date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_date (user_id, date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
