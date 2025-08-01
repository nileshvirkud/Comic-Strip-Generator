#!/bin/bash

# Kubernetes Deployment Script for Comic Strip Generator

set -e

echo "🚀 Deploying Comic Strip Generator to Kubernetes..."

# Check if kubectl is installed
if ! command -v kubectl &> /dev/null; then
    echo "❌ kubectl is not installed. Please install kubectl first."
    exit 1
fi

# Check if connected to cluster
if ! kubectl cluster-info &> /dev/null; then
    echo "❌ Not connected to Kubernetes cluster. Please configure kubectl."
    exit 1
fi

# Create namespace
echo "📦 Creating namespace..."
kubectl apply -f namespace.yaml

# Apply secrets
echo "🔐 Applying secrets..."
echo "⚠️  Make sure to update k8s/secrets/app-secrets.yaml with your actual secrets!"
kubectl apply -f secrets/

# Deploy database and Redis
echo "🗄️  Deploying PostgreSQL..."
kubectl apply -f deployments/postgres.yaml

echo "⚡ Deploying Redis..."
kubectl apply -f deployments/redis.yaml

echo "🌐 Creating services..."
kubectl apply -f services/

# Wait for database to be ready
echo "⏳ Waiting for PostgreSQL to be ready..."
kubectl wait --for=condition=ready pod -l app=postgres -n comic-strip-generator --timeout=300s

echo "⏳ Waiting for Redis to be ready..."
kubectl wait --for=condition=ready pod -l app=redis -n comic-strip-generator --timeout=120s

# Deploy application
echo "🖥️  Deploying backend..."
kubectl apply -f deployments/backend.yaml

echo "🎨 Deploying frontend..."
kubectl apply -f deployments/frontend.yaml

# Wait for application to be ready
echo "⏳ Waiting for backend to be ready..."
kubectl wait --for=condition=ready pod -l app=backend -n comic-strip-generator --timeout=300s

echo "⏳ Waiting for frontend to be ready..."
kubectl wait --for=condition=ready pod -l app=frontend -n comic-strip-generator --timeout=180s

# Apply ingress
echo "🌍 Setting up ingress..."
kubectl apply -f ingress/

# Apply HPA
echo "📊 Setting up horizontal pod autoscaling..."
kubectl apply -f hpa.yaml

# Run database migrations
echo "🔧 Running database migrations..."
kubectl exec -n comic-strip-generator deployment/backend -- npx prisma migrate deploy

# Seed database
echo "🌱 Seeding database..."
kubectl exec -n comic-strip-generator deployment/backend -- npm run db:seed || echo "⚠️  Seeding failed or already seeded"

echo "✅ Deployment complete!"
echo ""
echo "📊 Check deployment status:"
echo "kubectl get pods -n comic-strip-generator"
echo ""
echo "📝 View logs:"
echo "kubectl logs -f deployment/backend -n comic-strip-generator"
echo "kubectl logs -f deployment/frontend -n comic-strip-generator"
echo ""
echo "🌐 Access the application:"
echo "- Update your domain in k8s/ingress/ingress.yaml"
echo "- Configure SSL certificates"
echo "- Access via your configured domain"
echo ""
echo "🔧 Useful commands:"
echo "kubectl get all -n comic-strip-generator"
echo "kubectl describe hpa -n comic-strip-generator"