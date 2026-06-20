-- Zapewnienie istnienia ról ROLE_USER i ROLE_ADMIN (np. po ręcznej zmianie w DB)
INSERT INTO roles (name) VALUES ('ROLE_USER'), ('ROLE_ADMIN')
ON CONFLICT (name) DO NOTHING;

-- Ustawienie roli ADMIN dla użytkownika admin@example.com (jeśli istnieje)
UPDATE users
SET role_id = (SELECT id FROM roles WHERE name = 'ROLE_ADMIN' LIMIT 1)
WHERE email = 'admin@example.com';
