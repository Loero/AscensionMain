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

-- Felhasználóhoz tartozó személyes adatok (életkor, súly, magasság, cél stb.)
CREATE TABLE IF NOT EXISTS user_profile (
    user_id INT PRIMARY KEY,
    age INT NULL,
    weight_kg DECIMAL(5,1) NULL,
    height_cm INT NULL,
    gender VARCHAR(10) NULL,
    activity_multiplier DECIMAL(4,2) NULL,
    goal VARCHAR(20) NULL,
    experience VARCHAR(20) NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
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

-- Arcápolási rutinok tábla
CREATE TABLE IF NOT EXISTS skin_routines (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    skin_type VARCHAR(20) NOT NULL,
    age_group VARCHAR(10) NOT NULL,
    concerns JSON,
    goals JSON,
    morning_routine JSON,
    evening_routine JSON,
    weekly_treatments JSON,
    product_recommendations JSON,
    tips JSON,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_active (user_id, is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Arcápolási rutin követés (napi checkboxok)
CREATE TABLE IF NOT EXISTS skin_routine_tracking (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    routine_id INT NOT NULL,
    date DATE NOT NULL,
    morning_completed BOOLEAN DEFAULT FALSE,
    evening_completed BOOLEAN DEFAULT FALSE,
    morning_steps JSON,
    evening_steps JSON,
    notes TEXT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (routine_id) REFERENCES skin_routines(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_routine_date (user_id, routine_id, date),
    INDEX idx_user_date (user_id, date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Bőrállapot napló
CREATE TABLE IF NOT EXISTS skin_condition_log (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    date DATE NOT NULL,
    skin_feeling VARCHAR(50),
    acne_level INT DEFAULT 0,
    oiliness_level INT DEFAULT 0,
    hydration_level INT DEFAULT 0,
    sensitivity_level INT DEFAULT 0,
    notes TEXT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_date (user_id, date),
    INDEX idx_user_date (user_id, date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
