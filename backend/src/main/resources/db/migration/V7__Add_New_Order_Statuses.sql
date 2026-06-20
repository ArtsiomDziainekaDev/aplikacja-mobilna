-- Dodawanie wsparcia dla nowych statusów zamówień
-- Ponieważ używamy VARCHAR dla status, nowe wartości są automatycznie obsługiwane
-- Ta migracja jest potrzebna do dokumentowania zmian

-- Aktualizuj istniejące statusy, jeśli trzeba (na razie zostawiamy bez zmian)
-- ALTER TABLE orders ALTER COLUMN status TYPE VARCHAR(25);

-- Tworzenie komentarza do dokumentowania dostępnych statusów
COMMENT ON COLUMN orders.status IS 'Order status: PENDING_PAYMENT, PENDING_CONFIRMATION, CONFIRMED, IN_PROGRESS, READY_FOR_PICKUP, COMPLETED, CANCELLED'; 