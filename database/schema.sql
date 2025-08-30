-- NewsLens Database Schema
-- PostgreSQL database schema for storing waitlist signups

-- Enable UUID extension for unique identifiers
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create waitlist signups table
CREATE TABLE IF NOT EXISTS waitlist_signups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    topics TEXT[] NOT NULL DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_verified BOOLEAN DEFAULT FALSE,
    verification_token UUID DEFAULT uuid_generate_v4(),
    verified_at TIMESTAMP WITH TIME ZONE,
    ip_address VARCHAR(45),
    user_agent TEXT,
    referral_code VARCHAR(50),
    source VARCHAR(100) DEFAULT 'landing_page',
    metadata JSONB DEFAULT '{}'
);

-- Create index for faster email lookups
CREATE INDEX IF NOT EXISTS idx_waitlist_signups_email ON waitlist_signups(email);
CREATE INDEX IF NOT EXISTS idx_waitlist_signups_created_at ON waitlist_signups(created_at);
CREATE INDEX IF NOT EXISTS idx_waitlist_signups_is_verified ON waitlist_signups(is_verified);

-- Create index for array operations on topics
CREATE INDEX IF NOT EXISTS idx_waitlist_signups_topics ON waitlist_signups USING GIN (topics);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_waitlist_signups_updated_at
    BEFORE UPDATE ON waitlist_signups
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create analytics table for tracking signup events
CREATE TABLE IF NOT EXISTS signup_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    signup_id UUID REFERENCES waitlist_signups(id) ON DELETE CASCADE,
    event_type VARCHAR(50) NOT NULL,
    event_data JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    ip_address VARCHAR(45),
    user_agent TEXT
);

-- Index for event analytics
CREATE INDEX IF NOT EXISTS idx_signup_events_signup_id ON signup_events(signup_id);
CREATE INDEX IF NOT EXISTS idx_signup_events_event_type ON signup_events(event_type);
CREATE INDEX IF NOT EXISTS idx_signup_events_created_at ON signup_events(created_at);

-- Create table for email verification tokens
CREATE TABLE IF NOT EXISTS verification_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    signup_id UUID REFERENCES waitlist_signups(id) ON DELETE CASCADE,
    token UUID NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index for verification tokens
CREATE INDEX IF NOT EXISTS idx_verification_tokens_token ON verification_tokens(token);
CREATE INDEX IF NOT EXISTS idx_verification_tokens_signup_id ON verification_tokens(signup_id);
CREATE INDEX IF NOT EXISTS idx_verification_tokens_expires_at ON verification_tokens(expires_at);

-- Create table for free signups (no topics required)
CREATE TABLE IF NOT EXISTS free_signups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    ip_address VARCHAR(45),
    user_agent TEXT,
    source VARCHAR(100) DEFAULT 'landing_page_free',
    metadata JSONB DEFAULT '{}'
);

-- Create index for free signups
CREATE INDEX IF NOT EXISTS idx_free_signups_email ON free_signups(email);
CREATE INDEX IF NOT EXISTS idx_free_signups_created_at ON free_signups(created_at);

-- Create trigger to automatically update updated_at for free_signups
CREATE TRIGGER update_free_signups_updated_at
    BEFORE UPDATE ON free_signups
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create table for analytics and metrics
CREATE TABLE IF NOT EXISTS landing_page_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    metric_type VARCHAR(50) NOT NULL,
    metric_value NUMERIC DEFAULT 0,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB DEFAULT '{}'
);

-- Index for metrics
CREATE INDEX IF NOT EXISTS idx_landing_page_metrics_metric_type ON landing_page_metrics(metric_type);
CREATE INDEX IF NOT EXISTS idx_landing_page_metrics_timestamp ON landing_page_metrics(timestamp);

-- Create view for waitlist statistics
CREATE OR REPLACE VIEW waitlist_stats AS
SELECT 
    COUNT(*) as total_signups,
    COUNT(*) FILTER (WHERE is_verified = TRUE) as verified_signups,
    COUNT(*) FILTER (WHERE is_verified = FALSE) as pending_signups,
    MIN(created_at) as first_signup_date,
    MAX(created_at) as latest_signup_date,
    AVG(EXTRACT(EPOCH FROM (verified_at - created_at))) FILTER (WHERE is_verified = TRUE) as avg_verification_time_seconds
FROM waitlist_signups;

-- Create view for topic popularity
CREATE OR REPLACE VIEW topic_popularity AS
SELECT 
    topic,
    COUNT(*) as signup_count
FROM 
    waitlist_signups,
    UNNEST(topics) as topic
GROUP BY 
    topic
ORDER BY 
    signup_count DESC;

-- Insert sample data for testing (optional)
INSERT INTO waitlist_signups (email, topics, is_verified, created_at) VALUES
('test1@example.com', ARRAY['technology', 'business'], TRUE, NOW() - INTERVAL '2 days'),
('test2@example.com', ARRAY['politics', 'health'], FALSE, NOW() - INTERVAL '1 day'),
('test3@example.com', ARRAY['technology', 'science'], TRUE, NOW() - INTERVAL '3 hours')
ON CONFLICT (email) DO NOTHING;

-- Comments for documentation
COMMENT ON TABLE waitlist_signups IS 'Stores waitlist signup information for NewsLens platform';
COMMENT ON COLUMN waitlist_signups.email IS 'User email address (unique)';
COMMENT ON COLUMN waitlist_signups.topics IS 'Array of topics user is interested in';
COMMENT ON COLUMN waitlist_signups.is_verified IS 'Whether email has been verified';
COMMENT ON COLUMN waitlist_signups.verification_token IS 'Token for email verification';
COMMENT ON COLUMN waitlist_signups.referral_code IS 'Referral code if user was referred';

COMMENT ON TABLE signup_events IS 'Tracks events related to signup process';
COMMENT ON TABLE verification_tokens IS 'Stores email verification tokens with expiration';
COMMENT ON TABLE landing_page_metrics IS 'Tracks landing page performance metrics';

-- Grant permissions (adjust based on your database user)
-- GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA public TO your_app_user;
-- GRANT USAGE ON SCHEMA public TO your_app_user;
