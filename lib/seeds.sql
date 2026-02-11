CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE if NOT EXISTS users (
  user_id UUID DEFAULT uuid_generate_v4 () PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  email VARCHAR(100) NOT NULL UNIQUE,
  telegram VARCHAR(30) NOT NULL UNIQUE,
  password TEXT NOT NULL
);

-- vendors table
CREATE TABLE if NOT EXISTS vendor (
  vendor_id SERIAL PRIMARY KEY,
  name varchar(50) NOT NULL
);

-- Receipts table
CREATE TABLE if NOT EXISTS receipt (
  receipt_id SERIAL PRIMARY KEY,
  vendor_id INT NOT NULL REFERENCES vendor (vendor_id) ON DELETE RESTRICT,
  receipt_date DATE NOT NULL,
  amount INTEGER NOT NULL,
  user_id UUID NOT NULL REFERENCES users (user_id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ DEFAULT NOW ()
);

-- expenses categories table
CREATE TABLE if NOT EXISTS category (
  category_id SERIAL PRIMARY KEY,
  name VARCHAR(50) NOT NULL
);

-- Expenses table
CREATE TABLE if NOT EXISTS expense (
  expense_id SERIAL PRIMARY KEY,
  receipt_id INT REFERENCES receipt (receipt_id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category_id INT REFERENCES category (category_id) ON DELETE RESTRICT,
  amount INTEGER NOT NULL,
  user_id UUID REFERENCES users (user_id) ON DELETE RESTRICT,
  expense_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW ()
);

-- User groups info (name + group_id)
CREATE TABLE if NOT EXISTS user_group_info (
  group_id serial PRIMARY KEY,
  title VARCHAR(50) not null,
  created_at TIMESTAMPTZ DEFAULT NOW (),
  user_id UUID REFERENCES users (user_id) ON DELETE CASCADE NOT NULL
);

-- User groups (connection between group_id and user_id)
CREATE TABLE if NOT EXISTS user_group (
  group_id INT REFERENCES user_group_info (group_id) ON DELETE CASCADE,
  user_id uuid REFERENCES users (user_id) ON DELETE CASCADE,
  PRIMARY KEY (group_id, user_id)
);

CREATE TABLE IF NOT EXISTS user_group_invitation (
  invitation_id SERIAL PRIMARY KEY,
  group_id INT NOT NULL REFERENCES user_group_info (group_id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users (user_id) ON DELETE CASCADE,
  invitee_id UUID NOT NULL REFERENCES users (user_id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW (),
  UNIQUE (group_id, invitee_id)
);

CREATE OR REPLACE FUNCTION fn_block_redundant_invites()
RETURNS TRIGGER AS $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM user_group
        WHERE group_id = NEW.group_id
        AND user_id = NEW.invitee_id
    ) THEN
        RAISE EXCEPTION 'Constraint Violation: User % is already a member of group %', NEW.invitee_id, NEW.group_id;
END IF;
RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Fires BEFORE insert to stop the transaction if the function raises an exception
CREATE TRIGGER trg_check_existing_membership BEFORE INSERT ON user_group_invitation FOR EACH ROW EXECUTE FUNCTION fn_block_redundant_invites ();
