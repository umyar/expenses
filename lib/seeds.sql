CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE if NOT EXISTS users (
  id UUID DEFAULT uuid_generate_v4 () PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email TEXT NOT NULL UNIQUE,
  telegram TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL
);

-- vendors table (not sure needed)
CREATE TABLE if NOT EXISTS vendors (id SERIAL PRIMARY KEY, name TEXT NOT NULL);

-- Receipts table
CREATE TABLE if NOT EXISTS receipts (
  id SERIAL PRIMARY KEY,
  vendor INT REFERENCES vendors (id) ON DELETE SET NULL,
  receipt_date DATE NOT NULL,
  total_amount NUMERIC(12, 2),
  added_by UUID REFERENCES users (id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW ()
);

-- expenses categories table
CREATE TABLE if NOT EXISTS expenses_categories (
  id SERIAL,
  name TEXT NOT NULL,
  slug TEXT NOT NULL PRIMARY KEY
);

-- Expenses table
CREATE TABLE if NOT EXISTS expenses (
  id SERIAL PRIMARY KEY,
  receipt_id INT REFERENCES receipts (id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT REFERENCES expenses_categories (slug) ON DELETE SET NULL,
  amount NUMERIC(12, 2) NOT NULL,
  added_by UUID REFERENCES users (id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW ()
);
