#!/bin/bash

# Kubernetes Production Deployment Script
# This script deploys the application using Kubernetes for production with fail-safe nodes

set -e

echo "☸️  Starting Kubernetes Production Environment"
echo "============================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if kubectl is installed
check_kubectl() {
    print_status "Checking kubectl..."
    if ! command -v kubectl &> /dev/null; then
        print_error "kubectl is not installed. Please install kubectl and configure your cluster."
        exit 1
    fi
    print_success "kubectl is available"
}

# Check if cluster is accessible
check_cluster() {
    print_status "Checking Kubernetes cluster..."
    if ! kubectl cluster-info &> /dev/null; then
        print_error "Cannot connect to Kubernetes cluster. Please check your kubeconfig."
        exit 1
    fi
    
    # Check if we have at least 2 nodes
    node_count=$(kubectl get nodes --no-headers | wc -l)
    if [ $node_count -lt 2 ]; then
        print_warning "Cluster has only $node_count node(s). For production, recommend at least 2 nodes for fail-safe operation."
    else
        print_success "Cluster has $node_count nodes - suitable for production"
    fi
}

# Check environment variables
check_env() {
    print_status "Checking environment variables..."
    
    if [ ! -f .env.k8s ]; then
        print_error "Kubernetes environment file (.env.k8s) not found!"
        print_status "Please create .env.k8s with the following variables:"
        echo "   DATABASE_URL=postgresql://user:password@host:port/db"
        echo "   SECRET_KEY=your-secret-key"
        echo "   ALLOWED_HOSTS=your-domain.com"
        echo "   DEBUG=false"
        echo "   K8S_NAMESPACE=cashflow-prod"
        echo "   K8S_REPLICAS=2"
        exit 1
    fi
    
    print_success "Environment variables configured"
}

# Create namespace
create_namespace() {
    print_status "Creating Kubernetes namespace..."
    
    kubectl create namespace cashflow-prod --dry-run=client -o yaml | kubectl apply -f -
    
    print_success "Namespace 'cashflow-prod' created/verified"
}

# Create ConfigMap and Secret
create_configs() {
    print_status "Creating ConfigMaps and Secrets..."
    
    # Create ConfigMap for non-sensitive data
    kubectl create configmap cashflow-config \
        --from-file=.env.k8s \
        --namespace=cashflow-prod \
        --dry-run=client -o yaml | kubectl apply -f -
    
    # Create Secret for sensitive data
    kubectl create secret generic cashflow-secrets \
        --from-literal=secret-key=$(openssl rand -hex 32) \
        --from-literal=database-url="postgresql://cashflow:password@cashflow-postgres:5432/cashflow" \
        --namespace=cashflow-prod \
        --dry-run=client -o yaml | kubectl apply -f -
    
    print_success "ConfigMaps and Secrets created"
}

# Deploy PostgreSQL
deploy_database() {
    print_status "Deploying PostgreSQL database..."
    
    # Create PostgreSQL StatefulSet
    cat <<EOF | kubectl apply -f -
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: cashflow-postgres
  namespace: cashflow-prod
spec:
  serviceName: cashflow-postgres
  replicas: 1
  selector:
    matchLabels:
      app: cashflow-postgres
  template:
    metadata:
      labels:
        app: cashflow-postgres
    spec:
      containers:
      - name: postgres
        image: postgres:16-alpine
        env:
        - name: POSTGRES_DB
          value: "cashflow"
        - name: POSTGRES_USER
          value: "cashflow"
        - name: POSTGRES_PASSWORD
          value: "password"
        ports:
        - containerPort: 5432
        volumeMounts:
        - name: postgres-storage
          mountPath: /var/lib/postgresql/data
  volumeClaimTemplates:
  - metadata:
      name: postgres-storage
    spec:
      accessModes: [ "ReadWriteOnce" ]
      resources:
        requests:
          storage: 10Gi
EOF

    # Create PostgreSQL Service
    cat <<EOF | kubectl apply -f -
apiVersion: v1
kind: Service
metadata:
  name: cashflow-postgres
  namespace: cashflow-prod
spec:
  selector:
    app: cashflow-postgres
  ports:
  - port: 5432
    targetPort: 5432
  type: ClusterIP
EOF

    print_success "PostgreSQL deployed"
}

# Deploy Backend
deploy_backend() {
    print_status "Deploying Backend API..."
    
    # Create Backend Deployment
    cat <<EOF | kubectl apply -f -
apiVersion: apps/v1
kind: Deployment
metadata:
  name: cashflow-backend
  namespace: cashflow-prod
spec:
  replicas: 2
  selector:
    matchLabels:
      app: cashflow-backend
  template:
    metadata:
      labels:
        app: cashflow-backend
    spec:
      containers:
      - name: backend
        image: cashflow-backend:latest
        ports:
        - containerPort: 8000
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: cashflow-secrets
              key: database-url
        - name: SECRET_KEY
          valueFrom:
            secretKeyRef:
              name: cashflow-secrets
              key: secret-key
        - name: DEBUG
          value: "false"
        livenessProbe:
          httpGet:
            path: /health
            port: 8000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health
            port: 8000
          initialDelaySeconds: 5
          periodSeconds: 5
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
EOF

    # Create Backend Service
    cat <<EOF | kubectl apply -f -
apiVersion: v1
kind: Service
metadata:
  name: cashflow-backend
  namespace: cashflow-prod
spec:
  selector:
    app: cashflow-backend
  ports:
  - port: 8000
    targetPort: 8000
  type: ClusterIP
EOF

    print_success "Backend deployed with 2 replicas"
}

# Deploy Frontend
deploy_frontend() {
    print_status "Deploying Frontend..."
    
    # Create Frontend Deployment
    cat <<EOF | kubectl apply -f -
apiVersion: apps/v1
kind: Deployment
metadata:
  name: cashflow-frontend
  namespace: cashflow-prod
spec:
  replicas: 2
  selector:
    matchLabels:
      app: cashflow-frontend
  template:
    metadata:
      labels:
        app: cashflow-frontend
    spec:
      containers:
      - name: frontend
        image: cashflow-frontend:latest
        ports:
        - containerPort: 80
        env:
        - name: VITE_API_URL
          value: "http://cashflow-backend:8000"
        resources:
          requests:
            memory: "128Mi"
            cpu: "100m"
          limits:
            memory: "256Mi"
            cpu: "200m"
EOF

    # Create Frontend Service
    cat <<EOF | kubectl apply -f -
apiVersion: v1
kind: Service
metadata:
  name: cashflow-frontend
  namespace: cashflow-prod
spec:
  selector:
    app: cashflow-frontend
  ports:
  - port: 80
    targetPort: 80
  type: LoadBalancer
EOF

    print_success "Frontend deployed with 2 replicas"
}

# Wait for deployments
wait_for_deployments() {
    print_status "Waiting for deployments to be ready..."
    
    kubectl wait --for=condition=available --timeout=300s deployment/cashflow-backend -n cashflow-prod
    kubectl wait --for=condition=available --timeout=300s deployment/cashflow-frontend -n cashflow-prod
    kubectl wait --for=condition=ready --timeout=300s pod -l app=cashflow-postgres -n cashflow-prod
    
    print_success "All deployments are ready"
}

# Show status
show_status() {
    echo ""
    echo "🎉 Cashflow Kubernetes Production Environment Started Successfully!"
    echo "=================================================================="
    echo ""
    echo "☸️  Kubernetes Resources:"
    kubectl get all -n cashflow-prod
    echo ""
    echo "📊 Pod Status:"
    kubectl get pods -n cashflow-prod
    echo ""
    echo "🌐 Services:"
    kubectl get services -n cashflow-prod
    echo ""
    echo "📝 Useful Commands:"
    echo "   - View logs: kubectl logs -f deployment/cashflow-backend -n cashflow-prod"
    echo "   - Scale backend: kubectl scale deployment cashflow-backend --replicas=3 -n cashflow-prod"
    echo "   - Access database: kubectl exec -it cashflow-postgres-0 -n cashflow-prod -- psql -U cashflow -d cashflow"
    echo "   - Port forward: kubectl port-forward service/cashflow-frontend 8080:80 -n cashflow-prod"
    echo ""
    echo "⚠️  Production Features:"
    echo "   - High availability with 2 replicas"
    echo "   - Automatic failover"
    echo "   - Load balancing"
    echo "   - Health monitoring"
    echo "   - Resource limits"
    echo "   - Persistent storage"
    echo ""
}

# Main execution
main() {
    check_kubectl
    check_cluster
    check_env
    create_namespace
    create_configs
    deploy_database
    deploy_backend
    deploy_frontend
    wait_for_deployments
    show_status
}

# Run main function
main "$@"
