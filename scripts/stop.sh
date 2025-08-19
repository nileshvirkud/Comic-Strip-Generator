#!/bin/bash

# Comic Strip Generator - Application Stop Script
set -e

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_ROOT"

echo "🛑 Stopping Comic Strip Generator Application..."
echo "Project Root: $PROJECT_ROOT"
echo "Timestamp: $(date)"

# Function to check if process is running
is_process_running() {
    local pid=$1
    if [ -z "$pid" ]; then
        return 1
    fi
    if ps -p "$pid" > /dev/null 2>&1; then
        return 0
    else
        return 1
    fi
}

# Function to stop process gracefully
stop_process() {
    local name=$1
    local pid_file=$2
    local process_pattern=$3
    
    echo "⏳ Stopping $name..."
    
    # Try to read PID from file
    if [ -f "$pid_file" ]; then
        PID=$(cat "$pid_file" 2>/dev/null || echo "")
        if is_process_running "$PID"; then
            echo "   Stopping $name (PID: $PID) gracefully..."
            kill -TERM "$PID" 2>/dev/null || true
            
            # Wait up to 10 seconds for graceful shutdown
            for i in {1..10}; do
                if ! is_process_running "$PID"; then
                    echo "✅ $name stopped gracefully"
                    rm -f "$pid_file"
                    return 0
                fi
                sleep 1
            done
            
            # Force kill if still running
            echo "   Force killing $name (PID: $PID)..."
            kill -KILL "$PID" 2>/dev/null || true
            sleep 2
        fi
        rm -f "$pid_file"
    fi
    
    # Kill by process pattern as fallback
    if [ -n "$process_pattern" ]; then
        PIDS=$(pgrep -f "$process_pattern" 2>/dev/null || echo "")
        if [ -n "$PIDS" ]; then
            echo "   Force killing $name processes by pattern..."
            pkill -f "$process_pattern" || true
            sleep 2
        fi
    fi
    
    echo "✅ $name stopped"
}

# Step 1: Stop Frontend Server
echo ""
echo "🎨 Step 1: Stopping Frontend Server..."
stop_process "Frontend" "logs/frontend.pid" "react-scripts start"

# Step 2: Stop Backend Server  
echo ""
echo "⚙️ Step 2: Stopping Backend Server..."
stop_process "Backend" "logs/backend.pid" "ts-node-dev.*index.ts"

# Additional cleanup for any remaining Node processes
echo ""
echo "🧹 Step 3: Additional cleanup..."
pkill -f "npm run dev" || true
pkill -f "npm start" || true
pkill -f "node.*index.js" || true

# Step 4: Stop Docker services
echo ""
echo "🐳 Step 4: Stopping Docker services..."
docker-compose down || true

# Wait for Docker containers to stop
echo "⏳ Waiting for Docker containers to stop..."
sleep 3

# Step 5: Verify all services are stopped
echo ""
echo "🔍 Step 5: Verifying all services are stopped..."

# Check ports
FRONTEND_PORT_CHECK=$(lsof -Pi :3000 -sTCP:LISTEN -t 2>/dev/null || echo "")
BACKEND_PORT_CHECK=$(lsof -Pi :3001 -sTCP:LISTEN -t 2>/dev/null || echo "")

if [ -n "$FRONTEND_PORT_CHECK" ]; then
    echo "⚠️  Port 3000 still in use by PID: $FRONTEND_PORT_CHECK"
    kill -KILL $FRONTEND_PORT_CHECK || true
else
    echo "✅ Port 3000 is free"
fi

if [ -n "$BACKEND_PORT_CHECK" ]; then
    echo "⚠️  Port 3001 still in use by PID: $BACKEND_PORT_CHECK"  
    kill -KILL $BACKEND_PORT_CHECK || true
else
    echo "✅ Port 3001 is free"
fi

# Check Docker containers
DOCKER_STATUS=$(docker-compose ps --services --filter "status=running" 2>/dev/null || echo "")
if [ -n "$DOCKER_STATUS" ]; then
    echo "⚠️  Some Docker services still running: $DOCKER_STATUS"
    docker-compose kill || true
    docker-compose down || true
else
    echo "✅ All Docker services stopped"
fi

# Clean up PID files
rm -f logs/frontend.pid logs/backend.pid

echo ""
echo "✅ Comic Strip Generator Application Stopped Successfully!"
echo "----------------------------------------"
echo "All services have been stopped:"
echo "  ✅ Frontend (port 3000)"
echo "  ✅ Backend (port 3001)"
echo "  ✅ PostgreSQL Database"
echo "  ✅ Redis"
echo "----------------------------------------"
echo "To start: ./scripts/start.sh"