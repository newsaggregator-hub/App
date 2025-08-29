import mysql from 'mysql2/promise';

// Database connection configuration
const dbConfig = {
  host: process.env.DATABASE_HOST,
  user: process.env.DATABASE_USERNAME,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME,
  ssl: {
    rejectUnauthorized: true
  },
  connectTimeout: 60000,
  acquireTimeout: 60000,
  timeout: 60000
};

// Email validation regex
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Valid topics
const validTopics = ['Politics', 'Business', 'Technology'];

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed. Only POST requests are accepted.'
    });
  }

  try {
    // Parse and validate request body
    const { email, topics } = req.body;

    // Validate email
    if (!email || typeof email !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Email is required and must be a string.'
      });
    }

    const trimmedEmail = email.trim().toLowerCase();
    if (!emailRegex.test(trimmedEmail)) {
      return res.status(400).json({
        success: false,
        error: 'Please provide a valid email address.'
      });
    }

    // Validate topics
    if (!topics || !Array.isArray(topics) || topics.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'At least one topic must be selected.'
      });
    }

    // Validate each topic
    const invalidTopics = topics.filter(topic => !validTopics.includes(topic));
    if (invalidTopics.length > 0) {
      return res.status(400).json({
        success: false,
        error: `Invalid topics: ${invalidTopics.join(', ')}. Valid topics are: ${validTopics.join(', ')}.`
      });
    }

    // Remove duplicates from topics
    const uniqueTopics = [...new Set(topics)];

    // Connect to database
    let connection;
    try {
      connection = await mysql.createConnection(dbConfig);
      console.log('Database connection established');
    } catch (dbError) {
      console.error('Database connection error:', dbError);
      return res.status(500).json({
        success: false,
        error: 'Database connection failed. Please try again later.'
      });
    }

    try {
      // Insert or update signup record
      const query = `
        INSERT INTO signups (email, topics, created_at) 
        VALUES (?, ?, NOW()) 
        ON DUPLICATE KEY UPDATE 
        topics = VALUES(topics), 
        created_at = NOW()
      `;

      const [result] = await connection.execute(query, [
        trimmedEmail,
        JSON.stringify(uniqueTopics)
      ]);

      console.log('Database operation successful:', {
        email: trimmedEmail,
        topics: uniqueTopics,
        affectedRows: result.affectedRows
      });

      // Determine if this was an insert or update
      const isNewSignup = result.insertId > 0;
      
      return res.status(200).json({
        success: true,
        message: isNewSignup 
          ? 'Successfully signed up for early access!' 
          : 'Your preferences have been updated!',
        data: {
          email: trimmedEmail,
          topics: uniqueTopics,
          isNewSignup
        }
      });

    } catch (dbError) {
      console.error('Database query error:', dbError);
      
      // Handle specific database errors
      if (dbError.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({
          success: false,
          error: 'This email is already registered.'
        });
      }
      
      return res.status(500).json({
        success: false,
        error: 'Failed to save signup. Please try again later.'
      });
    } finally {
      // Always close the database connection
      if (connection) {
        await connection.end();
        console.log('Database connection closed');
      }
    }

  } catch (error) {
    console.error('Signup API error:', error);
    
    // Handle JSON parsing errors
    if (error instanceof SyntaxError) {
      return res.status(400).json({
        success: false,
        error: 'Invalid JSON in request body.'
      });
    }
    
    return res.status(500).json({
      success: false,
      error: 'Internal server error. Please try again later.'
    });
  }
}

// Helper function to validate environment variables
function validateEnvironment() {
  const requiredEnvVars = [
    'DATABASE_HOST',
    'DATABASE_USERNAME', 
    'DATABASE_PASSWORD',
    'DATABASE_NAME'
  ];
  
  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
  }
}

// Validate environment on module load
try {
  validateEnvironment();
} catch (error) {
  console.error('Environment validation error:', error.message);
}
