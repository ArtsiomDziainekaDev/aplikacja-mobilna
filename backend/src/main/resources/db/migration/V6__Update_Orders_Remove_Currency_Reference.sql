-- Usuń klucz obcy do tabeli currencies
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_currency_id_fkey;

-- Dodaj nową kolumnę currency_code
ALTER TABLE orders ADD COLUMN currency_code VARCHAR(3);

-- Skopiuj dane ze starej struktury (jeśli są dane)
UPDATE orders SET currency_code = 'USD' WHERE currency_id = 1;
UPDATE orders SET currency_code = 'EUR' WHERE currency_id = 2;
UPDATE orders SET currency_code = 'GBP' WHERE currency_id = 3;

-- Ustaw NOT NULL po wypełnieniu danych
ALTER TABLE orders ALTER COLUMN currency_code SET NOT NULL;

-- Usuń starą kolumnę
ALTER TABLE orders DROP COLUMN currency_id; 