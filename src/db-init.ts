import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
dotenv.config();

const DB_FILE = process.env.DB_FILE || './food.db';
if (fs.existsSync(DB_FILE)) {
  console.log('Removing existing DB file:', DB_FILE);
  fs.unlinkSync(DB_FILE);
}

const db = new Database(DB_FILE);

// create tables
db.exec(`
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('seller','consumer')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE food_entries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  seller_id INTEGER NOT NULL,
  consumer_id INTEGER NOT NULL,
  date DATE NOT NULL,
  meal_type TEXT NOT NULL,
  food_name TEXT NOT NULL,
  amount REAL NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE payments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  consumer_id INTEGER NOT NULL,
  seller_id INTEGER NOT NULL,
  date DATE NOT NULL,
  amount REAL NOT NULL,
  note TEXT,
  upi_reference TEXT,
  receipt_url TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
`);

// seed users
const sellerPass = bcrypt.hashSync('sellerpass', 10);
const consumerPass = bcrypt.hashSync('consumerpass', 10);

const insertUser = db.prepare('INSERT INTO users (name,email,password_hash,role) VALUES (?,?,?,?)');
insertUser.run('Seller One', 'seller@example.com', sellerPass, 'seller');
insertUser.run('Consumer A', 'a@example.com', consumerPass, 'consumer');
insertUser.run('Consumer B', 'b@example.com', consumerPass, 'consumer');

const insertEntry = db.prepare('INSERT INTO food_entries (seller_id,consumer_id,date,meal_type,food_name,amount) VALUES (?,?,?,?,?,?)');
insertEntry.run(1,2,'2025-11-01','lunch','Rice + Curry',50);
insertEntry.run(1,2,'2025-11-02','lunch','Idli + Sambar',40);
insertEntry.run(1,3,'2025-11-01','dinner','Biriyani',120);

const insertPayment = db.prepare('INSERT INTO payments (consumer_id,seller_id,date,amount,note,upi_reference,receipt_url) VALUES (?,?,?,?,?,?,?)');
insertPayment.run(2,1,'2025-11-05',50,'partial','UPI12345',null);

console.log('DB initialized:', DB_FILE);
