const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Database connection pool
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
});

async function initializeDatabase() {
    const client = await pool.connect();
    
    try {
        console.log('📊 Connecting to database...');
        
        // Read the schema file
        const schemaPath = path.join(__dirname, '../database/schema.sql');
        const schemaSql = fs.readFileSync(schemaPath, 'utf8');
        
        console.log('🚀 Running database schema...');
        
        // Execute the schema
        await client.query(schemaSql);
        
        console.log('✅ Database schema executed successfully!');
        console.log('📋 Tables created:');
        console.log('   - waitlist_signups');
        console.log('   - free_signups');
        console.log('   - signup_events');
        console.log('   - verification_tokens');
        console.log('   - landing_page_metrics');
        
        // Verify tables exist
        const tablesCheck = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
            AND table_name IN ('free_signups', 'waitlist_signups', 'signup_events', 'verification_tokens', 'landing_page_metrics')
        `);
        
        console.log('✅ Tables verified:', tablesCheck.rows.map(row => row.table_name));
        
    } catch (error) {
        console.error('❌ Error initializing database:', error);
        throw error;
    } finally {
        client.release();
        await pool.end();
    }
}

// Run if called directly
if (require.main === module) {
    initializeDatabase()
        .then(() => {
            console.log('🎉 Database initialization completed!');
            process.exit(0);
        })
        .catch(error => {
            console.error('💥 Database initialization failed:', error);
            process.exit(1);
        });
}

module.exports = { initializeDatabase };
