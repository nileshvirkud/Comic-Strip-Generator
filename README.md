# Comic Strip Generator 🎨

A production-ready web application that uses AI services (GPT-4, Midjourney, RunwayML) to generate professional comic strips from user prompts. Built with React, Node.js, PostgreSQL, and Redis, fully containerized with Docker and deployable to Kubernetes.

## 🌟 Features

### Core Functionality
- **AI-Powered Story Generation**: GPT-4 creates compelling storylines and dialogue
- **Professional Artwork**: Midjourney generates consistent, high-quality comic panels
- **Image Enhancement**: RunwayML provides style transfer and character consistency
- **Interactive Panel Editor**: Drag-and-drop interface for customizing layouts
- **Print-Ready Export**: Generate PDFs optimized for professional printing
- **Real-Time Progress**: WebSocket-based generation progress updates

### Technical Features
- **Enterprise-Grade Architecture**: Microservices with proper separation of concerns
- **Scalable Queue System**: Redis-based job processing for AI generation
- **JWT Authentication**: Secure user authentication and authorization
- **Docker Containerization**: Complete containerized setup for all services
- **Kubernetes Ready**: Production-ready K8s manifests with auto-scaling
- **CI/CD Pipeline**: Automated testing, building, and deployment
- **Security Scanning**: Integrated vulnerability scanning and code analysis

## 🚀 Quick Start

### Prerequisites

- **Docker & Docker Compose**: For containerized development
- **Node.js 18+**: For local development
- **PostgreSQL 15+**: Database
- **Redis 7+**: Queue system

### API Keys Required

- **OpenAI API Key**: For GPT-4 story generation
- **Midjourney API Key**: For image generation (optional for development)
- **RunwayML API Key**: For image enhancement (optional for development)

### Development Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/comic-strip-generator.git
   cd comic-strip-generator
   ```

2. **Setup environment**
   ```bash
   ./scripts/setup.sh
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your API keys and configuration
   ```

4. **Start the application**
   ```bash
   ./scripts/start.sh
   ```

5. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:3001
   - Database: localhost:5432
   - Redis: localhost:6379

## 🏗️ Architecture

### System Overview

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend       │    │   AI Services   │
│   (React)       │◄──►│   (Node.js)      │◄──►│   GPT-4         │
└─────────────────┘    └──────────────────┘    │   Midjourney    │
                                │               │   RunwayML      │
                                ▼               └─────────────────┘
┌─────────────────┐    ┌──────────────────┐    
│   Database      │    │   Queue System   │    
│   (PostgreSQL)  │◄──►│   (Redis/Bull)   │    
└─────────────────┘    └──────────────────┘    
```

### Technology Stack

**Frontend**
- React 18 with TypeScript
- Tailwind CSS for styling
- React DnD for drag-and-drop
- Socket.IO for real-time updates
- React Hook Form for form handling

**Backend**
- Node.js with Express
- TypeScript for type safety
- Prisma ORM for database
- Bull/Redis for job queues
- JWT for authentication
- Socket.IO for real-time communication

**Infrastructure**
- PostgreSQL for data persistence
- Redis for caching and queues
- Docker for containerization
- Kubernetes for orchestration
- GitHub Actions for CI/CD

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
