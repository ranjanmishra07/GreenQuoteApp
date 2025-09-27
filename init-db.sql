-- GreenQuote Database Initialization Script
-- This script creates the greenquote database and sets up initial configuration
-- Used by Docker PostgreSQL container during initialization

-- Note: This script runs in the context of the default 'postgres' database
-- The greenquote database is already created via POSTGRES_DB environment variable

-- Connect to the greenquote database (created by POSTGRES_DB)
\c greenquote;

-- Create extensions that might be useful
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Set timezone
SET timezone = 'UTC';

-- Create a comment on the database
COMMENT ON DATABASE greenquote IS 'GreenQuote Application Database - Solar Quote Management System';

-- Grant permissions to postgres user (already has superuser privileges)
-- This is mainly for documentation purposes
GRANT ALL PRIVILEGES ON DATABASE greenquote TO postgres;

-- Create a schema for the application (optional, but good practice)
CREATE SCHEMA IF NOT EXISTS public;

-- Set search path to include public schema
ALTER DATABASE greenquote SET search_path TO public;

-- Set some useful database parameters
ALTER DATABASE greenquote SET log_statement = 'mod';
ALTER DATABASE greenquote SET log_min_duration_statement = 1000;

-- Create a function to get current timestamp in UTC
CREATE OR REPLACE FUNCTION get_utc_timestamp()
RETURNS TIMESTAMP WITH TIME ZONE AS $$
BEGIN
    RETURN NOW() AT TIME ZONE 'UTC';
END;
$$ LANGUAGE plpgsql;

-- Log the successful creation
DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'GreenQuote Database Initialized Successfully!';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Database: greenquote';
    RAISE NOTICE 'Owner: postgres';
    RAISE NOTICE 'Timezone: UTC';
    RAISE NOTICE 'Extensions: uuid-ossp';
    RAISE NOTICE 'Schema: public';
    RAISE NOTICE 'Logging: Enabled for modifications';
    RAISE NOTICE '========================================';
END $$;
