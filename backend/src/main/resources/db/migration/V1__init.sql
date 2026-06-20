-- Create sequences
CREATE SEQUENCE IF NOT EXISTS roles_seq START 1;
CREATE SEQUENCE IF NOT EXISTS users_seq START 1;
CREATE SEQUENCE IF NOT EXISTS orders_seq START 1;
CREATE SEQUENCE IF NOT EXISTS carts_seq START 1;
CREATE SEQUENCE IF NOT EXISTS currencies_seq START 1;

-- Create roles table
CREATE TABLE IF NOT EXISTS roles (
    id BIGINT PRIMARY KEY DEFAULT nextval('roles_seq'),
    name VARCHAR(20) NOT NULL UNIQUE
);

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id BIGINT PRIMARY KEY DEFAULT nextval('users_seq'),
    email VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(120) NOT NULL,
    role_id BIGINT
);

-- Create orders table
CREATE TABLE IF NOT EXISTS orders (
    id BIGINT PRIMARY KEY DEFAULT nextval('orders_seq'),
    user_id BIGINT NOT NULL,
    status VARCHAR(20) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Create carts table
CREATE TABLE IF NOT EXISTS carts (
    id BIGINT PRIMARY KEY DEFAULT nextval('carts_seq'),
    user_id BIGINT NOT NULL,
    amount DOUBLE PRECISION NOT NULL,
    price DOUBLE PRECISION NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Insert default roles
INSERT INTO roles (name) VALUES ('ROLE_USER'), ('ROLE_ADMIN')
ON CONFLICT (name) DO NOTHING;

-- Update existing users to have ROLE_USER by default
UPDATE users SET role_id = (SELECT id FROM roles WHERE name = 'ROLE_USER')
WHERE role_id IS NULL;

-- Add foreign key constraint after updating users
ALTER TABLE users 
    ADD CONSTRAINT fk_users_roles 
    FOREIGN KEY (role_id) 
    REFERENCES roles(id);

-- Make role_id NOT NULL after setting default values
ALTER TABLE users 
    ALTER COLUMN role_id SET NOT NULL; 