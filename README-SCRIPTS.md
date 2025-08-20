# Comic Strip Generator - Application Scripts

This document describes the comprehensive start/stop/test scripts for the Comic Strip Generator application.

## Scripts Overview

### 🚀 `scripts/start.sh`
**Purpose**: Starts the complete application stack
**What it does**:
1. Stops any existing processes (cleanup)
2. Starts Docker services (PostgreSQL & Redis)  
3. Waits for services to be healthy
4. Runs database migrations
5. Starts Backend server (port 3001)
6. Starts Frontend server (port 3000)
7. Runs comprehensive service tests
8. Reports status and provides access URLs

**Usage**:
```bash
./scripts/start.sh
```

### 🛑 `scripts/stop.sh`
**Purpose**: Stops all application services gracefully
**What it does**:
1. Gracefully stops Frontend server
2. Gracefully stops Backend server
3. Kills remaining Node processes
4. Stops Docker containers
5. Verifies all ports are free
6. Cleans up PID files

**Usage**:
```bash
./scripts/stop.sh
```

### 🧪 `scripts/test-services.sh`
**Purpose**: Comprehensive health check and testing
**What it tests**:
1. Docker container health (PostgreSQL & Redis)
2. Port availability (3000, 3001, 5432, 6379)
3. HTTP endpoints (Frontend, Backend health)
4. Authentication system (register/login)
5. Application tests (Frontend & Backend test suites)

**Usage**:
```bash
./scripts/test-services.sh
```

## Application Architecture

```
┌─────────────────┐    ┌─────────────────┐
│  Frontend       │    │  Backend        │
│  (React)        │    │  (Node.js)      │
│  Port: 3000     │◄──►│  Port: 3001     │
└─────────────────┘    └─────────────────┘
                                │
                       ┌────────┴────────┐
                       │                 │
           ┌─────────────────┐  ┌─────────────────┐
           │  PostgreSQL     │  │  Redis          │
           │  (Docker)       │  │  (Docker)       │
           │  Port: 5432     │  │  Port: 6379     │
           └─────────────────┘  └─────────────────┘
```

## Service Dependencies

1. **PostgreSQL Database** - Primary data storage
2. **Redis** - Caching and session management
3. **Backend API** - Business logic and API endpoints
4. **Frontend** - User interface (React application)

## URLs and Access Points

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **Health Check**: http://localhost:3001/api/health
- **API Documentation**: http://localhost:3001/api (if implemented)

## Logs and Debugging

Logs are stored in the `logs/` directory:
- `logs/backend.log` - Backend server logs
- `logs/frontend.log` - Frontend server logs
- `logs/backend.pid` - Backend process ID
- `logs/frontend.pid` - Frontend process ID

## Reboot Testing Results

✅ **Both reboot tests completed successfully**

### Test 1 Results:
- Stop: All services stopped cleanly
- Start: All services started successfully
- Verification: All health checks passed

### Test 2 Results:  
- Stop: All services stopped cleanly
- Start: All services started successfully
- Verification: All health checks passed

## Troubleshooting

### Common Issues:

1. **Port conflicts**:
   - Run `./scripts/stop.sh` to clean up
   - Check with `lsof -i :3000` and `lsof -i :3001`

2. **Docker issues**:
   - Run `docker-compose down` 
   - Run `docker system prune` (if needed)

3. **Database connection issues**:
   - Ensure PostgreSQL container is healthy
   - Check environment variables in `.env`

4. **Permission issues**:
   - Ensure scripts are executable: `chmod +x scripts/*.sh`

### Service Status Commands:
```bash
# Check all services
./scripts/test-services.sh

# Check specific ports
lsof -i :3000  # Frontend
lsof -i :3001  # Backend

# Check Docker containers
docker-compose ps

# Check logs
tail -f logs/backend.log
tail -f logs/frontend.log
```

## Environment Requirements

- Node.js (v16+)
- Docker & Docker Compose
- curl (for health checks)
- lsof (for port checking)

## Quick Start

```bash
# Make scripts executable
chmod +x scripts/*.sh

# Start application
./scripts/start.sh

# Test everything
./scripts/test-services.sh

# Stop application  
./scripts/stop.sh
```

## Integration with CI/CD

These scripts are designed to work in CI/CD pipelines:

```bash
# In your CI/CD pipeline
./scripts/start.sh   # Start all services
./scripts/test-services.sh  # Run tests
./scripts/stop.sh    # Clean shutdown
```

The test script returns appropriate exit codes:
- `0` - All tests passed
- `1` - Some tests failed