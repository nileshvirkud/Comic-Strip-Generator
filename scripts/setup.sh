#!/bin/bash

# Comic Strip Generator Setup Script

set -e

echo "🎨 Setting up Comic Strip Generator..."

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file from example..."
    cp .env.example .env
    echo "⚠️  Please update the .env file with your actual API keys and configuration."
fi

# Create necessary directories
echo "📁 Creating necessary directories..."
mkdir -p uploads
mkdir -p nginx/ssl

# Set permissions
chmod 755 uploads

# Pull Docker images
echo "🐳 Pulling Docker images..."
docker-compose pull

# Build images
echo "🔨 Building Docker images..."
docker-compose build

echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Update .env file with your API keys"
echo "2. Run 'docker-compose up -d' to start the application"
echo "3. Run 'docker-compose exec backend npm run migrate' to setup the database"
echo "4. Run 'docker-compose exec backend npm run db:seed' to seed initial data"
echo ""
echo "The application will be available at:"
echo "- Frontend: http://localhost:3000"
echo "- Backend API: http://localhost:3001"
echo "- Database: localhost:5432"
echo "- Redis: localhost:6379"