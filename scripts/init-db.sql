-- Initialize databases for each microservice
-- This script runs automatically when PostgreSQL container starts

-- Create databases for each service
CREATE DATABASE user_db;
CREATE DATABASE tool_db;
CREATE DATABASE lending_db;
CREATE DATABASE neighborhood_db;
CREATE DATABASE notification_db;

-- Grant privileges to the default user
GRANT ALL PRIVILEGES ON DATABASE user_db TO neighbortools;
GRANT ALL PRIVILEGES ON DATABASE tool_db TO neighbortools;
GRANT ALL PRIVILEGES ON DATABASE lending_db TO neighbortools;
GRANT ALL PRIVILEGES ON DATABASE neighborhood_db TO neighbortools;
GRANT ALL PRIVILEGES ON DATABASE notification_db TO neighbortools;
