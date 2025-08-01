-- Initialize database with extensions and setup
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Create indexes for better performance
-- These will be created by Prisma migrations, but included here for reference

-- Example data for templates (will be replaced by seed script)
-- This is just for initial database setup