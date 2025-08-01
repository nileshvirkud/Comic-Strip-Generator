#!/bin/bash

# Comic Strip Generator Start Script

set -e

echo "🚀 Starting Comic Strip Generator..."

# Check if .env file exists
if [ ! -f .env ]; then
    echo "❌ .env file not found. Please run ./scripts/setup.sh first."
    exit 1
fi

# Start services
echo "🐳 Starting Docker containers..."
docker-compose up -d

# Wait for database to be ready
echo "⏳ Waiting for database to be ready..."
timeout 60 bash -c 'until docker-compose exec db pg_isready -U postgres; do sleep 2; done'

# Run database migrations
echo "🗄️  Running database migrations..."
docker-compose exec backend npx prisma migrate deploy

# Generate Prisma client
echo "🔧 Generating Prisma client..."
docker-compose exec backend npx prisma generate

# Seed database if needed
echo "🌱 Seeding database..."
docker-compose exec backend npm run db:seed || echo "⚠️  Seeding failed or already seeded"

echo "✅ Comic Strip Generator is now running!"
echo ""
echo "🌐 Access the application:"
echo "- Frontend: http://localhost:3000"
echo "- Backend API: http://localhost:3001"
echo "- API Documentation: http://localhost:3001/health"
echo ""
echo "📊 Monitor services:"
echo "- View logs: docker-compose logs -f"
echo "- Check status: docker-compose ps"
echo "- Stop services: docker-compose down"