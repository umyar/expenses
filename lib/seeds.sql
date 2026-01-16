CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE if NOT EXISTS users (
  user_id UUID DEFAULT uuid_generate_v4 () PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email TEXT NOT NULL UNIQUE,
  telegram TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL
);

-- vendors table (not sure needed)
CREATE TABLE if NOT EXISTS vendor (vendor_id SERIAL PRIMARY KEY, name TEXT NOT NULL);

-- Receipts table
CREATE TABLE if NOT EXISTS receipt (
  receipt_id SERIAL PRIMARY KEY,
  vendor_id INT REFERENCES vendor (vendor_id) ON DELETE SET NULL,
  receipt_date DATE NOT NULL,
  amount INTEGER,
  user_id UUID REFERENCES users (user_id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW ()
);

-- expenses categories table
CREATE TABLE if NOT EXISTS category (
  category_id SERIAL,
  name TEXT NOT NULL,
  slug TEXT NOT NULL PRIMARY KEY
);

-- Expenses table
CREATE TABLE if NOT EXISTS expense (
  expense_id SERIAL PRIMARY KEY,
  receipt_id INT REFERENCES receipt (receipt_id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT REFERENCES category (slug) ON DELETE SET NULL,
  amount INTEGER NOT NULL,
  user_id UUID REFERENCES users (user_id) ON DELETE SET NULL,
  expense_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP DEFAULT NOW ()
);
