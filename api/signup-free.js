const { Pool } = require('pg');
const validator = require('validator');
require('dotenv').config();

// Database connection pool
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
});

// Validation functions
const validateEmail = (email) => {
    return validator.isEmail(email) && validator.isLength(email, { max: 255 });
};

const sanitizeInput = (input) => {
    if (typeof input === 'string') {
        return validator.escape(input.trim());
    }
    return input;
};

module.exports = async (req, res) => {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', process.env.NODE_ENV === 'production' 
        ? 'https://your-vercel-domain.vercel.app' 
        : 'http://localhost:3000');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Access-Control-Allow-Credentials', 'true');

    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // Only allow POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ 
            error: 'Method not allowed', 
            message: 'Only POST requests are supported' 
        });
    }

    try {
        const { email } = req.body;

        // Validate required fields
        if (!email) {
            return res.status(400).json({ 
                error: 'Validation error', 
                message: 'Email is required' 
            });
        }

        // Sanitize and validate email
        const sanitizedEmail = sanitizeInput(email);

        if (!validateEmail(sanitizedEmail)) {
            return res.status(400).json({ 
                error: 'Validation error', 
                message: 'Please provide a valid email address' 
            });
        }

        const client = await pool.connect();

        try {
            // Check if email already exists in free signups
            const existingCheck = await client.query(
                'SELECT id FROM free_signups WHERE email = $1',
                [sanitizedEmail]
            );

            if (existingCheck.rows.length > 0) {
                // Email already exists - update the existing record
                const result = await client.query(
                    `UPDATE free_signups 
                     SET updated_at = CURRENT_TIMESTAMP,
                         ip_address = $2,
                         user_agent = $3,
                         source = $4
                     WHERE email = $1 
                     RETURNING id, email, created_at`,
                    [
                        sanitizedEmail,
                        req.headers['x-forwarded-for'] || req.connection.remoteAddress,
                        req.headers['user-agent'],
                        'landing_page_free'
                    ]
                );

                res.status(200).json({
                    message: 'Free signup updated successfully',
                    data: {
                        id: result.rows[0].id,
                        email: result.rows[0].email,
                        createdAt: result.rows[0].created_at
                    }
                });
            } else {
                // Insert new free signup
                const result = await client.query(
                    `INSERT INTO free_signups 
                     (email, ip_address, user_agent, source) 
                     VALUES ($1, $2, $3, $4) 
                     RETURNING id, email, created_at`,
                    [
                        sanitizedEmail,
                        req.headers['x-forwarded-for'] || req.connection.remoteAddress,
                        req.headers['user-agent'],
                        'landing_page_free'
                    ]
                );

                // Update metrics
                await client.query(
                    'INSERT INTO landing_page_metrics (metric_type, metric_value) VALUES ($1, 1)',
                    ['free_signup_count']
                );

                res.status(201).json({
                    message: 'Successfully registered for free access!',
                    data: {
                        id: result.rows[0].id,
                        email: result.rows[0].email,
                        createdAt: result.rows[0].created_at
                    }
                });
            }

        } catch (dbError) {
            console.error('Database error:', dbError);
            
            // General database error handling
            throw dbError;
        } finally {
            client.release();
        }

    } catch (error) {
        console.error('Server error:', error);
        
        res.status(500).json({ 
            error: 'Internal server error', 
            message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong. Please try again later.'
        });
    }
};
