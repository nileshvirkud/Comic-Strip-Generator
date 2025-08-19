#!/bin/bash

# Comic Strip Generator - Application Start Script
set -e

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_ROOT"

echo "🚀 Starting Comic Strip Generator Application..."
echo "Project Root: $PROJECT_ROOT"
echo "Timestamp: $(date)"

# Function to check if a port is in use
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        return 0
    else
        return 1
    fi
}

# Function to wait for service to be ready
wait_for_service() {
    local service_name=$1
    local url=$2
    local max_attempts=30
    local attempt=1
    
    echo "⏳ Waiting for $service_name to be ready..."
    while [ $attempt -le $max_attempts ]; do
        if curl -s "$url" >/dev/null 2>&1; then
            echo "✅ $service_name is ready"
            return 0
        fi
        echo "   Attempt $attempt/$max_attempts - $service_name not ready yet..."
        sleep 2
        attempt=$((attempt + 1))
    done
    
    echo "❌ $service_name failed to start within timeout"
    return 1
}

# Step 1: Stop any existing processes
echo ""
echo "📊 Step 1: Cleaning up existing processes..."
./scripts/stop.sh

# Step 2: Start Docker services (Database & Redis)
echo ""
echo "🐳 Step 2: Starting Docker services..."
docker-compose up -d db redis

echo "⏳ Waiting for Docker services to be healthy..."
sleep 5

# Check Docker services health
max_wait=60
waited=0
while [ $waited -lt $max_wait ]; do
    db_health=$(docker inspect --format='{{.State.Health.Status}}' comic-strip-generator_db_1 2>/dev/null || echo "unknown")
    redis_health=$(docker inspect --format='{{.State.Health.Status}}' comic-strip-generator_redis_1 2>/dev/null || echo "unknown")
    
    if [ "$db_health" = "healthy" ] && [ "$redis_health" = "healthy" ]; then
        echo "✅ Docker services are healthy"
        break
    fi
    
    echo "   Waiting for services... DB: $db_health, Redis: $redis_health"
    sleep 3
    waited=$((waited + 3))
done

if [ $waited -ge $max_wait ]; then
    echo "❌ Docker services failed to become healthy"
    exit 1
fi

# Step 3: Run database migrations
echo ""
echo "📊 Step 3: Running database migrations..."
cd backend
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/comic_strip_generator_dev" npx prisma migrate deploy
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/comic_strip_generator_dev" npx prisma generate
cd ..

# Step 4: Start Backend Server
echo ""
echo "⚙️ Step 4: Starting Backend Server..."
cd backend

# Check if backend is already running
if check_port 3001; then
    echo "⚠️  Port 3001 is already in use, attempting to stop existing backend..."
    pkill -f "ts-node-dev.*index.ts" || true
    sleep 2
fi

# Start backend in background
nohup npm run dev > ../logs/backend.log 2>&1 &
BACKEND_PID=$!
echo "Backend started with PID: $BACKEND_PID"
echo $BACKEND_PID > ../logs/backend.pid

cd ..

# Wait for backend to be ready
wait_for_service "Backend API" "http://localhost:3001/api/health"

# Step 5: Start Frontend Server
echo ""
echo "🎨 Step 5: Starting Frontend Server..."
cd frontend

# Check if frontend is already running
if check_port 3000; then
    echo "⚠️  Port 3000 is already in use, attempting to stop existing frontend..."
    pkill -f "react-scripts start" || true
    sleep 2
fi

# Start frontend in background
nohup npm start > ../logs/frontend.log 2>&1 &
FRONTEND_PID=$!
echo "Frontend started with PID: $FRONTEND_PID"
echo $FRONTEND_PID > ../logs/frontend.pid

cd ..

# Wait for frontend to be ready
wait_for_service "Frontend" "http://localhost:3000"

# Step 6: Final verification
echo ""
echo "🔍 Step 6: Final verification..."
./scripts/test-services.sh

echo ""
echo "🎉 Comic Strip Generator Application Started Successfully!"
echo "----------------------------------------"
echo "Frontend: http://localhost:3000"
echo "Backend:  http://localhost:3001"
echo "Health:   http://localhost:3001/api/health"
echo "----------------------------------------"
echo "Logs:"
echo "  Backend:  logs/backend.log"
echo "  Frontend: logs/frontend.log"
echo "PIDs:"
echo "  Backend:  $(cat logs/backend.pid 2>/dev/null || echo 'N/A')"
echo "  Frontend: $(cat logs/frontend.pid 2>/dev/null || echo 'N/A')"
echo "----------------------------------------"
echo "To stop: ./scripts/stop.sh"
echo "To test: ./scripts/test-services.sh"