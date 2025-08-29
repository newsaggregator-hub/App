-- NewsLens Database Schema for PlanetScale
-- Multi-perspective news aggregation platform signup table

-- Create the signups table
CREATE TABLE signups (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  topics JSON NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  -- Indexes for better performance
  INDEX idx_email (email),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Sample data for testing (optional)
-- INSERT INTO signups (email, topics) VALUES 
-- ('test@example.com', '["Politics", "Technology"]'),
-- ('demo@example.com', '["Business", "Politics"]'),
-- ('sample@example.com', '["Technology"]');

-- Query to check table structure
-- DESCRIBE signups;

-- Query to view all signups
-- SELECT 
--   id,
--   email,
--   JSON_UNQUOTE(JSON_EXTRACT(topics, '$')) as topics,
--   created_at,
--   updated_at
-- FROM signups 
-- ORDER BY created_at DESC;

-- Query to get signup statistics
-- SELECT 
--   COUNT(*) as total_signups,
--   COUNT(DISTINCT email) as unique_emails,
--   DATE(created_at) as signup_date,
--   COUNT(*) as daily_signups
-- FROM signups 
-- GROUP BY DATE(created_at)
-- ORDER BY signup_date DESC;

-- Query to analyze topic preferences
-- SELECT 
--   topic_value as topic,
--   COUNT(*) as count
-- FROM signups
-- CROSS JOIN JSON_TABLE(
--   topics, 
--   '$[*]' COLUMNS (topic_value VARCHAR(50) PATH '$')
-- ) as topics_table
-- GROUP BY topic_value
-- ORDER BY count DESC;

-- Instructions for PlanetScale setup:
-- 1. Create a new database in PlanetScale dashboard
-- 2. Connect to your database using the PlanetScale CLI or web console
-- 3. Run the CREATE TABLE statement above
-- 4. Copy the connection details to your environment variables
-- 5. Test the connection with a simple SELECT query

-- Connection string format for PlanetScale:
-- mysql://username:password@host/database?ssl={"rejectUnauthorized":true}

-- Environment variables needed:
-- DATABASE_HOST=your-host.connect.psdb.cloud
-- DATABASE_USERNAME=your-username  
-- DATABASE_PASSWORD=your-password
-- DATABASE_NAME=your-database-name
