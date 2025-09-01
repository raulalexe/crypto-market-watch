-- Initialize the crypto_market_watch database
-- This script runs when the PostgreSQL container starts for the first time

-- Create the database if it doesn't exist (though it should already exist from POSTGRES_DB)
-- SELECT 'CREATE DATABASE crypto_market_watch' WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'crypto_market_watch')\gexec

-- Connect to the database
\c crypto_market_watch;

-- Create extensions if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- The tables will be created by the Node.js application on startup
-- This file is here for any additional database setup if needed

-- Create a simple test to verify the database is working
DO $$
BEGIN
    RAISE NOTICE 'Crypto Market Watch database initialized successfully!';
END $$;
