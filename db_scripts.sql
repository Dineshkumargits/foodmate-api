CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  phone VARCHAR(15) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('seller','consumer') NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE food_entries (
  id INT AUTO_INCREMENT PRIMARY KEY,
  seller_id INT NOT NULL,
  consumer_id INT NOT NULL,
  date DATE NOT NULL,
  meal_type VARCHAR(50) NOT NULL,
  food_name VARCHAR(255) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (seller_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (consumer_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE payments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  consumer_id INT NOT NULL,
  seller_id INT NOT NULL,
  date DATE NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  note TEXT,
  upi_reference VARCHAR(255),
  receipt_url VARCHAR(255),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (consumer_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (seller_id) REFERENCES users(id) ON DELETE CASCADE
);



-- Seed users
INSERT INTO users (name, email, phone, password_hash, role)
VALUES 
('Cindrella', 'cindrellam54@gmail.com', '9940553067', '$2a$10$JF0jM2Tn6ze06ZlARsPq7u7gz9Yo4gbqfyvU1oDA3TJxNqcF3r2cO', 'seller');

-- Seed food entries
INSERT INTO food_entries (seller_id, consumer_id, date, meal_type, food_name, amount)
VALUES
(1, 2, '2025-11-01', 'lunch', 'Rice + Curry', 50.00),
(1, 2, '2025-11-02', 'lunch', 'Idli + Sambar', 40.00),
(1, 3, '2025-11-01', 'dinner', 'Biriyani', 120.00);

-- Seed payments
INSERT INTO payments (consumer_id, seller_id, date, amount, note, upi_reference, receipt_url)
VALUES
(2, 1, '2025-11-05', 50.00, 'partial', 'UPI12345', NULL);