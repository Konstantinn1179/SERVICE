
-- Создание таблицы заявок
CREATE TABLE IF NOT EXISTS car_bookings (
    id SERIAL PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    car_brand TEXT,
    car_model TEXT,
    reason TEXT,
    status TEXT DEFAULT 'pending'
);

-- Создание индекса для быстрого поиска по дате
CREATE INDEX IF NOT EXISTS idx_car_bookings_created_at ON car_bookings(created_at);

-- Пример вставки данных (для теста)
-- INSERT INTO car_bookings (name, phone, car_brand, car_model, reason) VALUES ('Иван Тест', '+79990000000', 'Toyota', 'Camry', 'Тестовая запись');
