# Comic Strip Generator 🎨

**Transform your ideas into stunning comic strips with the power of AI!**

The Comic Strip Generator is a production-ready web application that leverages cutting-edge AI services (OpenAI GPT-4, Midjourney, RunwayML) to automatically generate professional-quality comic strips from simple text prompts. Whether you're a content creator, educator, marketer, or just someone with a story to tell, this platform makes comic creation accessible to everyone.

## 📖 What is Comic Strip Generator?

Comic Strip Generator is an intelligent platform that combines the creativity of AI with user-friendly tools to create engaging visual narratives. Simply describe your story or idea, and watch as advanced AI algorithms:

1. **Generate compelling storylines** with GPT-4's natural language processing
2. **Create consistent character artwork** using Midjourney's image generation
3. **Enhance visual quality** with RunwayML's style transfer technology
4. **Provide interactive editing tools** for fine-tuning your comic

Perfect for:
- 🎓 **Educators** creating engaging learning materials
- 📱 **Content Creators** developing social media content  
- 🏢 **Businesses** crafting marketing narratives
- 🎨 **Artists** exploring AI-assisted creativity
- 📚 **Writers** visualizing their stories

## 🌟 Features

### 🎯 Core Functionality
- **🤖 AI-Powered Story Generation**: GPT-4 creates compelling storylines and dialogue from your prompts
- **🎨 Professional Artwork**: Midjourney generates consistent, high-quality comic panels
- **✨ Image Enhancement**: RunwayML provides style transfer and character consistency
- **📝 Interactive Panel Editor**: Drag-and-drop interface for customizing layouts and dialogue
- **📄 Print-Ready Export**: Generate high-resolution PDFs optimized for professional printing
- **⚡ Real-Time Progress**: WebSocket-based live updates during comic generation
- **🎭 Multiple Art Styles**: Choose from various comic styles and themes
- **👥 Character Consistency**: AI maintains character appearance across panels
- **📱 Responsive Design**: Works seamlessly on desktop and mobile devices

### 🏗️ Technical Features
- **🔧 Enterprise-Grade Architecture**: Microservices with proper separation of concerns
- **📊 Scalable Queue System**: Redis-based job processing for AI generation tasks
- **🔐 JWT Authentication**: Secure user authentication and authorization
- **🐳 Docker Containerization**: Complete containerized setup for all services
- **☸️ Kubernetes Ready**: Production-ready K8s manifests with auto-scaling
- **🚀 CI/CD Pipeline**: Automated testing, building, and deployment
- **🛡️ Security Scanning**: Integrated vulnerability scanning and code analysis
- **📈 Performance Monitoring**: Built-in health checks and monitoring
- **🔄 Automated Scripts**: One-command start/stop with comprehensive testing

## 🚀 Quick Start

### Prerequisites

- **Docker & Docker Compose**: For containerized development
- **Node.js 18+**: For local development (optional)
- **Git**: For cloning the repository

### API Keys Required

- **OpenAI API Key**: For GPT-4 story generation (required)
- **Midjourney API Key**: For image generation (optional - mock service available)
- **RunwayML API Key**: For image enhancement (optional - mock service available)

### ⚡ One-Command Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/comic-strip-generator.git
   cd comic-strip-generator
   ```

2. **Configure environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your API keys and configuration
   ```

3. **Start everything with one command**
   ```bash
   ./scripts/start.sh
   ```

That's it! The script will:
- 🐳 Start Docker services (PostgreSQL, Redis)
- 📊 Run database migrations
- ⚙️ Start the backend server (port 3001)
- 🎨 Start the frontend server (port 3000)  
- 🧪 Run comprehensive health checks
- ✅ Provide you with access URLs

### 🎯 Application Access

Once started, access your application at:
- **🌐 Frontend**: http://localhost:3000 (Main application)
- **🔧 Backend API**: http://localhost:3001 (REST API)
- **📊 Health Check**: http://localhost:3001/api/health (Service status)

### 🛑 Stopping the Application

```bash
./scripts/stop.sh
```

This will gracefully stop all services:
- Frontend and Backend servers
- Docker containers (PostgreSQL, Redis)
- Clean up all processes and ports

### 🧪 Testing All Services

```bash
./scripts/test-services.sh
```

Runs comprehensive tests for:
- Docker container health
- Port availability  
- HTTP endpoints
- Authentication system
- Application test suites

## 🏗️ Architecture

### 🎯 System Overview

Comic Strip Generator follows a modern microservices architecture with clear separation of concerns:

```
                     🌐 USER INTERACTION
                            │
              ┌─────────────▼──────────────┐
              │     Frontend (React)       │ ← 🎨 User Interface
              │     Port: 3000             │
              └─────────────┬──────────────┘
                            │ HTTP/WebSocket
              ┌─────────────▼──────────────┐
              │    Backend (Node.js)       │ ← ⚙️ API & Business Logic
              │     Port: 3001             │
              └─────┬──────────────┬───────┘
                    │              │
          ┌─────────▼─────────┐   │   ┌──────▼───────┐
          │   Database        │   │   │ Queue System │ ← 📊 Job Processing
          │   (PostgreSQL)    │   │   │ (Redis/Bull) │
          │   Port: 5432      │   │   │ Port: 6379   │
          └───────────────────┘   │   └──────────────┘
                                  │
               ┌──────────────────▼──────────────────┐
               │           AI Services              │ ← 🤖 AI Processing
               ├─────────────────────────────────────┤
               │  • GPT-4 (Story Generation)        │
               │  • Midjourney (Image Creation)     │
               │  • RunwayML (Image Enhancement)    │
               └─────────────────────────────────────┘
```

### 🔄 Data Flow

1. **User Request** → Frontend captures user input (story prompt)
2. **API Call** → Frontend sends request to Backend API
3. **Job Queue** → Backend creates AI generation jobs in Redis
4. **AI Processing** → Workers process jobs using AI services
5. **Real-time Updates** → WebSocket sends progress to Frontend
6. **Data Storage** → Results stored in PostgreSQL
7. **User Response** → Generated comic displayed to user

### 💻 Technology Stack

#### **🎨 Frontend Layer**
```
React 18 + TypeScript
├── 🎨 Tailwind CSS (Styling)
├── 🖱️ React DnD (Drag & Drop)
├── 📡 Socket.IO Client (Real-time)
├── 📝 React Hook Form (Forms)
├── 🧪 Jest + Testing Library (Testing)
└── ⚡ Vite/CRA (Build Tool)
```

#### **⚙️ Backend Layer**
```
Node.js + Express + TypeScript
├── 🗃️ Prisma ORM (Database)
├── 📊 Bull Queue (Job Processing)
├── 🔐 JWT (Authentication)
├── 📡 Socket.IO (Real-time)
├── 🛡️ Helmet (Security)
├── 📝 Morgan (Logging)
└── 🧪 Jest + Supertest (Testing)
```

#### **🗄️ Data Layer**
```
PostgreSQL 15 (Primary Database)
├── 👤 Users & Authentication
├── 📚 Comics & Panels
├── 🎭 Templates & Layouts
└── 📊 Generation Jobs

Redis 7 (Cache & Queues)
├── 📊 Job Queues
├── 💾 Session Storage
├── ⚡ Caching Layer
└── 🔄 Rate Limiting
```

#### **🤖 AI Services Integration**
```
External AI APIs
├── 🧠 OpenAI GPT-4
│   ├── Story generation
│   ├── Dialogue creation  
│   └── Character development
├── 🎨 Midjourney API
│   ├── Panel artwork
│   ├── Character images
│   └── Background scenes
└── ✨ RunwayML API
    ├── Style transfer
    ├── Image enhancement
    └── Consistency checks
```

#### **🐳 Infrastructure Layer**
```
Containerization & Orchestration
├── 🐳 Docker (Containerization)
├── 🏗️ Docker Compose (Local Dev)
├── ☸️ Kubernetes (Production)
├── 🚀 GitHub Actions (CI/CD)
└── 📊 Monitoring & Logging
```

## 🎮 Application Management

### 🚀 Start/Stop Commands

Comic Strip Generator includes comprehensive automation scripts for easy application management:

#### **⚡ Quick Commands**

```bash
# 🚀 Start everything (one command setup)
./scripts/start.sh

# 🛑 Stop everything (graceful shutdown)
./scripts/stop.sh

# 🧪 Test all services (health check)
./scripts/test-services.sh
```

#### **📋 What Each Script Does**

**🚀 `./scripts/start.sh`** - Complete Application Startup
```
1. 🧹 Cleanup any existing processes
2. 🐳 Start Docker services (PostgreSQL + Redis)
3. ⏳ Wait for services to become healthy
4. 📊 Run database migrations
5. ⚙️ Start Backend server (Port 3001)
6. 🎨 Start Frontend server (Port 3000)
7. 🧪 Run comprehensive health checks
8. ✅ Display access URLs and service status
```

**🛑 `./scripts/stop.sh`** - Graceful Application Shutdown
```
1. 🎨 Stop Frontend server gracefully
2. ⚙️ Stop Backend server gracefully  
3. 🧹 Clean up remaining Node processes
4. 🐳 Stop Docker containers
5. 🔍 Verify all ports are freed
6. 📄 Clean up PID files
```

**🧪 `./scripts/test-services.sh`** - Comprehensive Service Testing
```
1. 🐳 Test Docker container health
2. 🔌 Verify port availability (3000, 3001, 5432, 6379)
3. 🌐 Test HTTP endpoints (Frontend, Backend API)
4. 🔐 Test authentication system (Register/Login)
5. ✅ Run application test suites
6. 📊 Generate test report with pass/fail status
```

### 🎯 Service Status Monitoring

#### **Quick Health Check**
```bash
# Check all services at once
./scripts/test-services.sh

# Check individual service health
curl http://localhost:3001/api/health    # Backend health
curl http://localhost:3000              # Frontend status  
docker-compose ps                        # Container status
```

#### **Service URLs**
| Service | URL | Purpose |
|---------|-----|---------|
| 🌐 **Frontend** | http://localhost:3000 | Main application interface |
| 🔧 **Backend API** | http://localhost:3001 | REST API endpoints |
| 📊 **Health Check** | http://localhost:3001/api/health | Service status monitoring |
| 🗄️ **Database** | localhost:5432 | PostgreSQL (Docker internal) |
| 🔄 **Redis** | localhost:6379 | Cache & queues (Docker internal) |

### 🔧 Development Workflow

#### **Daily Development**
```bash
# Morning startup
./scripts/start.sh

# Work on your features...
# Frontend: http://localhost:3000
# Backend: http://localhost:3001

# Check everything is working
./scripts/test-services.sh

# End of day shutdown  
./scripts/stop.sh
```

#### **Testing & Debugging**
```bash
# Run comprehensive tests
./scripts/test-services.sh

# View logs
tail -f logs/frontend.log    # Frontend logs
tail -f logs/backend.log     # Backend logs

# Check service status
docker-compose ps            # Container status
lsof -i :3000               # Frontend port
lsof -i :3001               # Backend port
```

#### **Troubleshooting**
```bash
# If services won't start
./scripts/stop.sh           # Force cleanup
docker system prune         # Clean Docker (optional)
./scripts/start.sh          # Fresh start

# If ports are blocked
sudo lsof -i :3000         # Check what's using port
sudo lsof -i :3001         # Check what's using port
./scripts/stop.sh          # Should clean up automatically
```

### ⚡ Performance & Reliability

- **🚀 Fast Startup**: Complete application ready in ~60 seconds
- **🛡️ Error Handling**: Comprehensive error detection and recovery
- **🔄 Auto-Recovery**: Automatic cleanup of failed processes
- **📊 Health Monitoring**: Real-time service health verification
- **⏱️ Timeout Management**: Prevents hanging processes
- **🧪 Test Coverage**: End-to-end service validation

### API Endpoints

#### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/users/profile` - Get user profile

#### Comics
- `POST /api/comics/generate` - Start comic generation
- `GET /api/comics` - List user comics
- `GET /api/comics/:id` - Get comic details
- `GET /api/comics/:id/status` - Get generation status
- `PUT /api/comics/:id` - Update comic
- `DELETE /api/comics/:id` - Delete comic
- `POST /api/comics/:id/export` - Export comic

#### Templates
- `GET /api/templates` - List available layouts
- `GET /api/templates/:id` - Get template details

## 🔧 Configuration

### Environment Variables

```bash
# Database
DATABASE_URL=postgresql://postgres:password@localhost:5432/comic_strip_generator
REDIS_URL=redis://localhost:6379

# JWT Authentication
JWT_SECRET=your-super-secure-jwt-secret
JWT_EXPIRES_IN=7d

# AI Services
OPENAI_API_KEY=sk-your-openai-api-key
MIDJOURNEY_API_KEY=your-midjourney-api-key
RUNWAYML_API_KEY=your-runwayml-api-key

# AWS/S3 (Optional)
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
S3_BUCKET_NAME=your-s3-bucket

# Application Settings
NODE_ENV=production
PORT=3001
MAX_FILE_SIZE=10485760
CORS_ORIGIN=https://your-domain.com
```

## 🚢 Deployment

### Docker Deployment

1. **Production deployment**
   ```bash
   docker-compose -f docker-compose.prod.yml up -d
   ```

2. **Development deployment**
   ```bash
   docker-compose -f docker-compose.dev.yml up -d
   ```

### Kubernetes Deployment

1. **Configure secrets**
   ```bash
   # Edit k8s/secrets/app-secrets.yaml with your values
   kubectl apply -f k8s/secrets/
   ```

2. **Deploy to cluster**
   ```bash
   cd k8s
   ./deploy.sh
   ```

3. **Monitor deployment**
   ```bash
   kubectl get pods -n comic-strip-generator
   kubectl logs -f deployment/backend -n comic-strip-generator
   ```

### Production Considerations

- **SSL/TLS**: Configure certificates in `k8s/ingress/ingress.yaml`
- **Domain**: Update domain settings in ingress configuration
- **Scaling**: Horizontal Pod Autoscaler is configured for auto-scaling
- **Monitoring**: Set up monitoring and alerting for production
- **Backups**: Configure automated database backups

## 🧪 Testing

### Running Tests

```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test

# E2E tests
npm run test:e2e
```

### Test Coverage

- **Backend**: Unit tests for services, controllers, and middleware
- **Frontend**: Component tests and hook tests with React Testing Library
- **Integration**: API endpoint testing with supertest
- **Security**: Automated vulnerability scanning

## 📚 Development Guide

### Project Structure

```
comic-strip-generator/
├── frontend/                 # React frontend application
│   ├── src/
│   │   ├── components/      # Reusable React components
│   │   ├── pages/           # Page components
│   │   ├── hooks/           # Custom React hooks
│   │   ├── services/        # API and socket services
│   │   └── types/           # TypeScript type definitions
│   └── public/              # Static assets
├── backend/                 # Node.js backend application
│   ├── src/
│   │   ├── controllers/     # HTTP request handlers
│   │   ├── services/        # Business logic services
│   │   ├── models/          # Database models
│   │   ├── middleware/      # Express middleware
│   │   ├── routes/          # API routes
│   │   ├── workers/         # Queue job processors
│   │   └── utils/           # Utility functions
│   └── prisma/              # Database schema and migrations
├── k8s/                     # Kubernetes manifests
├── .github/workflows/       # CI/CD pipelines
└── scripts/                 # Deployment and setup scripts
```

### Adding New Features

1. **Backend API**
   - Add route in `backend/src/routes/`
   - Implement controller in `backend/src/controllers/`
   - Add business logic in `backend/src/services/`
   - Write tests in `backend/src/__tests__/`

2. **Frontend Component**
   - Create component in `frontend/src/components/`
   - Add types in `frontend/src/types/`
   - Implement API calls in `frontend/src/services/`
   - Write tests in `frontend/src/__tests__/`

3. **Database Changes**
   - Update schema in `backend/prisma/schema.prisma`
   - Generate migration: `npx prisma migrate dev`
   - Update seed data if needed

### Code Style

- **ESLint**: Enforced linting rules for both frontend and backend
- **Prettier**: Code formatting (configured in CI)
- **TypeScript**: Strict mode enabled for type safety
- **Conventional Commits**: Standardized commit messages

## 🔒 Security

### Security Measures

- **Input Validation**: All user inputs validated and sanitized
- **SQL Injection Protection**: Prisma ORM with parameterized queries
- **XSS Protection**: Helmet.js security headers
- **CSRF Protection**: SameSite cookies and CSRF tokens
- **Rate Limiting**: API rate limiting to prevent abuse
- **JWT Security**: Secure token generation and validation
- **File Upload Security**: File type and size validation
- **Dependency Scanning**: Automated vulnerability scanning

### Security Headers

```javascript
// Implemented via Helmet.js
- X-Frame-Options: SAMEORIGIN
- X-XSS-Protection: 1; mode=block
- X-Content-Type-Options: nosniff
- Referrer-Policy: no-referrer-when-downgrade
- Content-Security-Policy: Configured for security
```

## 📊 Monitoring & Logging

### Application Monitoring

- **Health Checks**: Built-in health check endpoints
- **Request Logging**: Morgan HTTP request logging
- **Error Tracking**: Comprehensive error logging
- **Performance Metrics**: Response time and throughput monitoring

### Queue Monitoring

- **Job Status**: Track generation job progress
- **Queue Health**: Monitor Redis queue performance
- **Failed Jobs**: Automatic retry and error handling

## 🤝 Contributing

### Development Workflow

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. **Make your changes**
4. **Add tests for new functionality**
5. **Ensure all tests pass**
   ```bash
   npm test
   ```
6. **Commit with conventional commits**
   ```bash
   git commit -m "feat: add amazing feature"
   ```
7. **Push to your fork**
8. **Create a Pull Request**

### Contribution Guidelines

- Follow the existing code style and conventions
- Write tests for new features and bug fixes
- Update documentation for API changes
- Ensure CI pipeline passes
- Add appropriate commit messages

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

### Common Issues

**Database Connection Issues**
```bash
# Check if PostgreSQL is running
docker-compose ps
# Reset database
docker-compose down -v
docker-compose up -d
```

**Redis Connection Issues**
```bash
# Check Redis status
docker-compose exec redis redis-cli ping
# Should return PONG
```

**AI Service Errors**
- Verify API keys are correctly set in `.env`
- Check API key permissions and usage limits
- Review service-specific documentation

### Getting Help

- **Documentation**: Check the `/docs` directory for detailed guides
- **Issues**: Create an issue on GitHub for bugs or feature requests
- **Discussions**: Use GitHub Discussions for questions and community support

### Useful Commands

```bash
# View application logs
docker-compose logs -f

# Access database
docker-compose exec db psql -U postgres -d comic_strip_generator

# Access Redis CLI
docker-compose exec redis redis-cli

# Run database migrations
docker-compose exec backend npx prisma migrate deploy

# Generate Prisma client
docker-compose exec backend npx prisma generate

# Seed database
docker-compose exec backend npm run db:seed
```

## 🎯 Roadmap

### Planned Features

- **Advanced Editing**: More sophisticated panel editing tools
- **Style Templates**: Pre-defined art styles and themes
- **Collaboration**: Multi-user comic creation
- **API Integration**: Third-party service integrations
- **Mobile App**: React Native mobile application
- **Marketplace**: User-generated template marketplace

### Version History

- **v1.0.0**: Initial release with core functionality
- **v1.1.0**: Enhanced editing capabilities (planned)
- **v1.2.0**: Mobile responsiveness improvements (planned)
- **v2.0.0**: Advanced AI features and collaboration (planned)

---

Built with ❤️ using modern web technologies and AI services.

For more information, visit our [documentation](./docs/) or contact the development team.
