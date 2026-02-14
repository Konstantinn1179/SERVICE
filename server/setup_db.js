
require('dotenv').config();
const db = require('./db');
const fs = require('fs');
const path = require('path');

async function setupDatabase() {
    try {
        console.log('🔌 Connecting to database...');
        
        // Check if table exists
        const checkTable = await db.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_name = 'car_bookings'
            );
        `);

        if (!checkTable.rows[0].exists) {
            console.log('📦 Table car_bookings does not exist. Creating...');
            const schemaPath = path.join(__dirname, 'schema.sql');
            const schemaSql = fs.readFileSync(schemaPath, 'utf8');
            await db.query(schemaSql);
            console.log('✅ Schema applied successfully!');
        } else {
            console.log('📦 Table car_bookings exists. Checking columns...');
        }

        // Add booking_date column if not exists
        await db.query(`
            DO $$ 
            BEGIN 
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='car_bookings' AND column_name='booking_date') THEN 
                    ALTER TABLE car_bookings ADD COLUMN booking_date DATE; 
                    CREATE INDEX idx_booking_date ON car_bookings(booking_date);
                    RAISE NOTICE 'Added booking_date column';
                END IF;

                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='car_bookings' AND column_name='booking_time') THEN 
                    ALTER TABLE car_bookings ADD COLUMN booking_time TIME; 
                    RAISE NOTICE 'Added booking_time column';
                END IF;

                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='car_bookings' AND column_name='chat_id') THEN 
                    ALTER TABLE car_bookings ADD COLUMN chat_id BIGINT; 
                    RAISE NOTICE 'Added chat_id column';
                END IF;

                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='car_bookings' AND column_name='platform') THEN 
                    ALTER TABLE car_bookings ADD COLUMN platform TEXT; 
                    RAISE NOTICE 'Added platform column';
                END IF;
            END $$;
        `);
        console.log('✅ Schema migration (columns) completed!');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error setting up database:', error);
        process.exit(1);
    }
}

setupDatabase();
