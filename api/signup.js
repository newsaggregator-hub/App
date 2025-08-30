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

// Test database connection
pool.on('connect', () => {
    console.log('Connected to PostgreSQL database');
});

pool.on('error', (err) => {
    console.error('Database connection error:', err);
});

// Validation functions
const validateEmail = (email) => {
    return validator.isEmail(email) && validator.isLength(email, { max: 255 });
};

const validateTopics = (topics) => {
    if (!Array.isArray(topics)) return false;
    if (topics.length === 0 || topics.length > 5) return false;
    
    const allowedTopics = ['technology', 'business', 'politics', 'health', 'science', 'entertainment', 'sports'];
    return topics.every(topic => allowedTopics.includes(topic));
};

const validateReferralCode = (code) => {
    if (!code) return true; // Optional field
    return typeof code === 'string' && code.length >= 6 && code.length <= 20 && /^[a-zA-Z0-9_-]+$/.test(code);
};

const generateReferralCode = (email) => {
    // Generate a unique referral code based on email and timestamp
    const timestamp = Date.now().toString(36);
    const emailPart = email.split('@')[0].substring(0, 4).toLowerCase();
    return `${emailPart}${timestamp.substring(timestamp.length - 4)}`.replace(/[^a-z0-9]/g, '');
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
        const { email, topics = [], referralCode } = req.body;

        // Validate required fields
        if (!email) {
            return res.status(400).json({ 
                error: 'Validation error', 
                message: 'Email is required' 
            });
        }

        // Sanitize and validate inputs
        const sanitizedEmail = sanitizeInput(email);
        const sanitizedTopics = Array.isArray(topics) ? topics.map(sanitizeInput) : [];

        if (!validateEmail(sanitizedEmail)) {
            return res.status(400).json({ 
                error: 'Validation error', 
                message: 'Please provide a valid email address' 
            });
        }

        if (!validateTopics(sanitizedTopics)) {
            return res.status(400).json({ 
                error: 'Validation error', 
                message: 'Please select 1-5 valid topics from the available options' 
            });
        }

        // Validate referral code if provided
        const sanitizedReferralCode = referralCode ? sanitizeInput(referralCode) : null;
        if (!validateReferralCode(sanitizedReferralCode)) {
            return res.status(400).json({ 
                error: 'Validation error', 
                message: 'Invalid referral code format' 
            });
        }

        const client = await pool.connect();

        try {
            // Check if email already exists
            const existingCheck = await client.query(
                'SELECT id, is_verified FROM waitlist_signups WHERE email = $1',
                [sanitizedEmail]
            );

            let signupId;
            let isNewSignup = false;

            if (existingCheck.rows.length > 0) {
                const existingUser = existingCheck.rows[0];
                signupId = existingUser.id;
                
                // Update existing user (regardless of verification status)
                await client.query(
                    'UPDATE waitlist_signups SET topics = $1, updated_at = CURRENT_TIMESTAMP WHERE email = $2',
                    [sanitizedTopics, sanitizedEmail]
                );
            } else {
                // Insert new signup
                const result = await client.query(
                    `INSERT INTO waitlist_signups 
                     (email, topics, ip_address, user_agent, source) 
                     VALUES ($1, $2, $3, $4, $5) 
                     RETURNING id, email, topics, created_at`,
                    [
                        sanitizedEmail,
                        sanitizedTopics,
                        req.headers['x-forwarded-for'] || req.connection.remoteAddress,
                        req.headers['user-agent'],
                        'landing_page'
                    ]
                );
                signupId = result.rows[0].id;
                isNewSignup = true;
            }

            // Log signup event
            await client.query(
                'INSERT INTO signup_events (signup_id, event_type, event_data, ip_address, user_agent) VALUES ($1, $2, $3, $4, $5)',
                [
                    signupId,
                    isNewSignup ? 'signup_created' : 'signup_updated',
                    JSON.stringify({ email: sanitizedEmail, topics: sanitizedTopics }),
                    req.headers['x-forwarded-for'] || req.connection.remoteAddress,
                    req.headers['user-agent']
                ]
            );

            // Update metrics
            await client.query(
                'INSERT INTO landing_page_metrics (metric_type, metric_value) VALUES ($1, 1)',
                ['signup_count']
            );

            // Get the final signup data for response
            const finalResult = await client.query(
                'SELECT id, email, topics, created_at FROM waitlist_signups WHERE id = $1',
                [signupId]
            );

            res.status(201).json({
                message: isNewSignup ? 'Successfully joined the waitlist!' : 'Waitlist preferences updated!',
                data: {
                    id: finalResult.rows[0].id,
                    email: finalResult.rows[0].email,
                    topics: finalResult.rows[0].topics,
                    createdAt: finalResult.rows[0].created_at
                }
            });

        } catch (dbError) {
            console.error('Database error:', dbError);
            
            if (dbError.code === '23505') { // Unique violation (race condition)
                try {
                    // Race condition occurred - email exists but our initial check missed it
                    // Update the existing record with new topics and timestamp
                    const updateResult = await client.query(
                        `UPDATE waitlist_signups 
                         SET topics = $2, 
                             updated_at = CURRENT_TIMESTAMP,
                             ip_address = $3,
                             user_agent = $4,
                             source = $5
                         WHERE email = $1 
                         RETURNING id, email, created_at, topics, is_verified`,
                        [
                            sanitizedEmail,
                            sanitizedTopics,
                            req.headers['x-forwarded-for'] || req.connection.remoteAddress,
                            req.headers['user-agent'],
                            'landing_page'
                        ]
                    );

                    if (updateResult.rows.length > 0) {
                        // Successfully updated existing record
                        const updatedUser = updateResult.rows[0];
                        
                        // Log the update event
                        await client.query(
                            'INSERT INTO signup_events (signup_id, event_type, event_data, ip_address, user_agent) VALUES ($1, $2, $3, $4, $5)',
                            [
                                updatedUser.id,
                                'signup_updated_race_condition',
                                JSON.stringify({ email: sanitizedEmail, topics: sanitizedTopics }),
                                req.headers['x-forwarded-for'] || req.connection.remoteAddress,
                                req.headers['user-agent']
                            ]
                        );

                        res.status(200).json({
                            message: 'Waitlist preferences updated!',
                            data: {
                                id: updatedUser.id,
                                email: updatedUser.email,
                                topics: updatedUser.topics,
                                createdAt: updatedUser.created_at
                            }
                        });
                    } else {
                        // Should not happen, but handle gracefully
                        throw dbError;
                    }
                } catch (updateError) {
                    console.error('Update error during race condition handling:', updateError);
                    throw dbError; // Re-throw original error if update fails
                }
            } else {
                // General database error handling
                throw dbError;
            }
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
