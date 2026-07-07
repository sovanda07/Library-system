# Library System - Microservices Architecture

A cloud-native, microservices-based Library Management System built with Node.js, Express, MongoDB, and Docker. The system demonstrates modern distributed architecture patterns with API Gateway routing, Kubernetes orchestration, and service-to-service communication.

## 📋 Table of Contents

- [Quick Start](#-quick-start)
- [Architecture Overview](#architecture-overview)
- [Services](#services)
- [Technology Stack](#technology-stack)
- [Prerequisites](#prerequisites)
- [Setup & Installation](#setup--installation)
- [Running the Project](#running-the-project)
- [Load Balancing](#load-balancing)
- [API Documentation](#api-documentation)
- [Environment Variables](#environment-variables)
- [Project Structure](#project-structure)
- [Development Workflow](#development-workflow)

## ⚡ Quick Start

Get the Library System running in 3 minutes:

### With Docker (Recommended)
```bash
# 1. Clone and navigate to project
git clone <repository-url>
cd Library_System

# 2. Create environment file
cat > .env << EOF
JWT_SECRET=your-secret-key-change-in-production
MONGO_URI=mongodb://mongo:27017/library_system
DOCKER_USERNAME=your-docker-username
EOF

# 3. Build and start all services
docker compose up --build

# 4. Access the API
# Gateway: http://localhost:4000
```

### With Kubernetes
```bash
# 1. Create namespace and secrets
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/secrets.yaml
kubectl apply -f k8s/configmap.yaml

# 2. Deploy databases
kubectl apply -f k8s/mongo.yaml
kubectl apply -f k8s/redis.yaml

# 3. Deploy services
kubectl apply -f k8s/auth-service.yaml
kubectl apply -f k8s/book-service.yaml
kubectl apply -f k8s/borrow-service.yaml
kubectl apply -f k8s/api-gateway.yaml

# 4. Deploy ingress
kubectl apply -f k8s/ingress.yaml

# 5. Get API endpoint
kubectl get ingress -n library-system
```

### Without Docker (Local Development)
```bash
# Install all dependencies
npm install --prefix API_Gateway
npm install --prefix Auth_service
npm install --prefix Book_service
npm install --prefix Borrow_service
npm install --prefix shared

# Start MongoDB and Redis
mongod &
redis-server &

# Start each service in separate terminals
npm run dev --prefix Auth_service          # Port 3000
npm start --prefix Book_service             # Port 5001
npm start --prefix Borrow_service           # Port 5000
npm start --prefix API_Gateway              # Port 4000
```

### Test It Out
```bash
# 1. Register a user
curl -X POST http://localhost:4000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"user@test.com","password":"test123","name":"Test User","role":"member"}'

# 2. Login
curl -X POST http://localhost:4000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@test.com","password":"test123"}'

# 3. Get books (replace TOKEN with the token from login response)
curl -X GET http://localhost:4000/books \
  -H "Authorization: Bearer TOKEN"
```

For detailed setup instructions, see [Setup & Installation](#setup--installation).

---

## 🏗️ Architecture Overview

### Docker Compose Architecture
```
                      ┌──────────────────┐
                      │   API Gateway    │
                      └────────┬─────────┘
                               │
         ┌─────────────────────┼─────────────────────┐
         ▼                     ▼                     ▼
  ┌──────────────┐      ┌──────────────┐      ┌──────────────┐
  │ Auth Service │      │ Book Service │      │Borrow Service│
  └──────┬───────┘      └──────┬───────┘      └──────┬───────┘
         │                     │                     │
         │                     │ (Uses Cache)        │
         │                     ▼                     │
         │              ┌──────────────┐             │
         │              │ Redis Cache  │             │
         │              └──────────────┘             │
         │                     │                     │
         ▼                     ▼                     ▼
┌────────────────────────────────────────────────────────────┐
│         MongoDB (Core Shared Database - Port 27017)        │
└────────────────────────────────────────────────────────────┘
```

### Kubernetes Architecture
```
                          ┌─────────────┐
                          │   Client    │
                          └──────┬──────┘
                                 │
                                 ▼
┌───────────────────────────────────────────────────────────────────────────┐
│  Kubernetes Cluster (namespace: library-system)                           │
│                                                                           │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │                     Ingress (External LB)                           │  │
│  └──────────────────────────────────┬──────────────────────────────────┘  │
│                                     │                                     │
│                                     ▼                                     │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │ API Gateway Service (ClusterIP - Port 4000)                         │  │
│  │ ┌─────────────────────────┐             ┌─────────────────────────┐ │  │
│  │ │       Pod Rep 1         │             │       Pod Rep 2         │ │  │
│  │ └─────────────────────────┘             └─────────────────────────┘ │  │
│  └──────┬───────────────────────────┬───────────────────────────┬──────┘  │
│         │ (Proxies Auth traffic)    │ (Routes Book traffic)     │         │
│         ▼                           ▼                           │         │
│  ┌──────────────┐            ┌──────────────┐                   │         │
│  │ Auth Service │            │ Book Service │                   │         │
│  │ Service      │            │ Service+HPA  │                   │         │
│  │ ClusterIP    │            │ ClusterIP    │                   │         │
│  │ (Port 3000)  │            │ (Port 3001)  │                   │         │
│  │ ┌──────────┐ │            │ ┌──────────┐ │                   │         │
│  │ │Pod Rep 1 │ │            │ │Pod Rep 1 │ │                   │         │
│  │ └──────────┘ │            │ └──────────┘ │                   │         │
│  │ ┌──────────┐ │            │ ┌──────────┐ │                   │         │
│  │ │Pod Rep 2 │ │            │ │Pod Rep 2 │ │                   │         │
│  │ └──────────┘ │            │ └────┬─────┘ │                   │         │
│  └──────┬───────┘            └──────┼───────┘                   │         │
│         │                           │ ▲                         │         │
│         │                           │ │ (Internal HTTP Call)    │         │
│         │                           │ └──────────────────┐      │ (Routes)│
│         │                           │                    │      ▼         │
│         │                           │             ┌──────────────┐        │
│         │                           │             │Borrow Service│        │
│         │                           │             │Service       │        │
│         │                           │             │ClusterIP     │        │
│         │                           │             │(Port 5000)   │        │
│         │                           │             │ ┌──────────┐ │        │
│         │                           │             │ │Pod Rep 1 │ │        │
│         │                           │             │ └──────────┘ │        │
│         │                           │             │ ┌──────────┐ │        │
│         │                           │             │ │Pod Rep 2 │ │        │
│         │                           │             └──────┬───────┘        │
│         │                           ▼                    │                │
│         │                    ┌──────────────┐            │                │
│         │                    │ Redis        │            │                │
│         │                    │ Deployment   │            │                │
│         │                    │ Cache        │            │                │
│         │                    │ ┌──────────┐ │            │                │
│         │                    │ │Pod + PVC │ │            │                │
│         │                    │ └──────────┘ │            │                │
│         │                    └──────────────┘            │                │
│         ▼                                                ▼                │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │ MongoDB StatefulSet (Primary Database - Port 27017)                 │  │
│  │ ┌─────────────────────────────────────────────────────────────────┐ │  │
│  │ │                            Pod + PVC                            │ │  │
│  │ └─────────────────────────────────────────────────────────────────┘ │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│                                                                           │
└───────────────────────────────────────────────────────────────────────────┘
```

### Key Design Patterns

- **API Gateway Pattern**: Single entry point for all client requests
- **Kubernetes Orchestration**: Container orchestration with auto-scaling
- **Service-to-Service Communication**: Direct HTTP calls between services
- **Authentication**: JWT token-based authentication with role-based access control (RBAC)
- **Containerization**: Docker containers for each service
- **Caching**: Redis for performance optimization in Book Service
- **Data Persistence**: MongoDB with StatefulSet for data durability
- **Service Discovery**: Kubernetes DNS for automatic service discovery
- **Load Balancing**: Nginx (Docker), Kubernetes Services (K8s)

## 📦 Services

### 1. **API Gateway** (Port 4000)
**Purpose**: Single entry point for all client requests; handles routing, authentication verification, and role-based authorization.

**Responsibilities**:
- Route requests to appropriate services
- Verify JWT tokens
- Enforce role-based access control
- Handle proxy errors gracefully

**Technology**: Express.js, http-proxy, JWT

---

### 2. **Auth Service** (Port 3000)
**Purpose**: User authentication and registration management.

**Endpoints**:
- `POST /auth/register` - Register a new user
- `POST /auth/login` - User login with JWT token generation
- `POST /auth/reset-password` - Reset user password

**Features**:
- User registration with email validation
- Secure password hashing with bcrypt
- JWT token generation
- Password reset functionality
- Role assignment (member/librarian)

**Technology**: Express.js, MongoDB, JWT, Bcrypt

---

### 3. **Book Service** (Multiple instances - 2 replicas) (Port 3001)
**Purpose**: Manage library book catalog with search, filtering, and book operations.

**Routes**:
- `GET /books` - Retrieve all books (cached with Redis)
- `GET /books/search` - Search and filter books
- `GET /books/:bookId` - Get specific book details
- `POST /books` - Add new book (Librarian only)
- `PATCH /books/:bookId` - Update book details (Librarian only)

**Features**:
- Redis caching for frequently accessed data
- Role-based operations (members view, librarians manage)
- Book inventory management
- Search and filtering capabilities
- Book metadata (title, author, ISBN, count, etc.)

**Technology**: Express.js, MongoDB, Redis (ioredis), JWT

**Load Balancing**:
- **Docker**: 2 instances behind Nginx load balancer (round-robin)
- **Kubernetes**: 2 replicas managed by Kubernetes Service + HPA

---

### 4. **Borrow Service** (Port 3002)
**Purpose**: Manage book borrowing and return operations for members.

**Endpoints**:
- `POST /borrow` - Create a borrow record
- `GET /borrow` - View borrowing history
- `PATCH /borrow/:borrowId` - Return a book

**Features**:
- Create borrow transactions
- Track borrowed books
- Manage due dates
- Process book returns
- Communicate with Book Service for inventory updates

**Technology**: Express.js, MongoDB, JWT

---

### 5. **Shared Middleware**
**Location**: `shared/middleware/`

**Components**:
- `verifyToken.js` - JWT token validation middleware
- `authorizeRole.js` - Role-based access control middleware

**Purpose**: Centralized authentication and authorization logic used across services.

---

### 6. **MongoDB** (Port 27017)
**Purpose**: Primary data persistence layer for all services.

**Kubernetes**: StatefulSet with persistent volumes for data durability

---

### 7. **Redis** (Port 6379)
**Purpose**: Caching and session storage for performance optimization.

**Kubernetes**: Deployment with persistent volume for cache data

---

## 🛠️ Technology Stack

| Layer | Technology |
|-------|-----------|
| **API Gateway** | Express.js, http-proxy |
| **Services** | Node.js, Express.js 5.x |
| **Database** | MongoDB 9.x |
| **Caching** | Redis |
| **Authentication** | JWT (jsonwebtoken), Bcrypt |
| **Containerization** | Docker, Docker Compose |
| **Orchestration** | Kubernetes 1.28+ |
| **Load Balancing** | Nginx (Docker), Kubernetes Services (K8s) |
| **Environment Management** | dotenv, ConfigMaps, Secrets |

## 📋 Prerequisites

Before starting, ensure you have:

- **Node.js** (v18+)
- **npm** (v8+)
- **Docker** (v20.10+)
- **Docker Compose** (v1.29+) - for Docker deployment
- **Kubernetes** (v1.28+) - for K8s deployment
- **kubectl** (v1.28+) - Kubernetes CLI
- **MongoDB** (v5.0+) - or use Docker/Kubernetes
- **Redis** (v6.0+) - or use Docker/Kubernetes
- **Git**

## 🚀 Setup & Installation

### 1. Clone the Repository

```bash
git clone <repository-url>
cd Library_System
```

### 2. Install Dependencies

Install dependencies for all services:

```bash
# API Gateway
cd API_Gateway && npm install && cd ..

# Auth Service
cd Auth_service && npm install && cd ..

# Book Service
cd Book_service && npm install && cd ..

# Borrow Service
cd Borrow_service && npm install && cd ..

# Shared middleware
cd shared && npm install && cd ..
```

### 3. Configure Environment Variables

Create a `.env` file in the root directory with the following variables:

```bash
# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this

# MongoDB Connection
MONGO_URI=mongodb://localhost:27017/library_system

# Docker Registry (if using Docker Hub)
DOCKER_USERNAME=your-docker-username
```

For **development** without Docker, also add:
```bash
# Auth Service
PORT=3000

# Book Service
PORT=5001
REDIS_HOST=localhost
REDIS_PORT=6379

# Borrow Service
PORT=5000
BOOK_SERVICE_URL=http://localhost:5001
```

### 4. Create `.env` File

```bash
cat > .env << EOF
JWT_SECRET=your-super-secret-jwt-key-change-this
MONGO_URI=mongodb://localhost:27017/library_system
DOCKER_USERNAME=your-docker-username
EOF
```

## ▶️ Running the Project

### Option 1: Using Docker Compose (Recommended for Local Testing)

```bash
# Build and start all services
docker compose up --build

# Run in background
docker compose up -d --build

# View logs
docker compose logs -f

# Stop services
docker compose down
```

The API Gateway will be available at `http://localhost:4000`

**Note**: Docker Compose includes an Nginx reverse proxy that load balances the Book Service (2 instances).

---

### Option 2: Kubernetes Deployment

#### Prerequisites
- Kubernetes cluster running (local: Minikube, Kind; cloud: EKS, GKE, AKS)
- kubectl configured and connected to your cluster
- Persistent volume provisioner available (for MongoDB and Redis)

#### Deployment Steps

**Step 1: Create Namespace**
```bash
kubectl apply -f k8s/namespace.yaml
```

**Step 2: Create Secrets and ConfigMaps**
```bash
kubectl apply -f k8s/secrets.yaml
kubectl apply -f k8s/configmap.yaml
```

**Step 3: Deploy Databases**
```bash
kubectl apply -f k8s/mongo.yaml
kubectl apply -f k8s/redis.yaml

# Wait for databases to be ready
kubectl rollout status statefulset/mongo -n library-system
kubectl rollout status deployment/redis -n library-system
```

**Step 4: Deploy Microservices**
```bash
kubectl apply -f k8s/auth-service.yaml
kubectl apply -f k8s/book-service.yaml
kubectl apply -f k8s/borrow-service.yaml
kubectl apply -f k8s/api-gateway.yaml

# Wait for services to be ready
kubectl rollout status deployment/auth-service -n library-system
kubectl rollout status deployment/book-service -n library-system
kubectl rollout status deployment/borrow-service -n library-system
kubectl rollout status deployment/api-gateway -n library-system
```

**Step 5: Deploy Ingress**
```bash
kubectl apply -f k8s/ingress.yaml

# Get Ingress URL
kubectl get ingress -n library-system
kubectl describe ingress api-gateway-ingress -n library-system
```

#### Accessing the Application

```bash
# Get service endpoints
kubectl get svc -n library-system

# Port forward to access locally (alternative to Ingress)
kubectl port-forward svc/api-gateway 4000:4000 -n library-system

# Then access at http://localhost:4000
```

#### Monitoring and Debugging

```bash
# View pod status
kubectl get pods -n library-system

# View pod logs
kubectl logs -f pod/auth-service-xyz -n library-system

# Describe pod for events
kubectl describe pod auth-service-xyz -n library-system

# Access pod shell
kubectl exec -it pod/auth-service-xyz -n library-system -- sh

# Check resource usage
kubectl top pods -n library-system
```

#### Scaling Services

```bash
# Scale auth-service to 5 replicas
kubectl scale deployment auth-service --replicas=5 -n library-system

# Check HPA (Horizontal Pod Autoscaler)
kubectl get hpa -n library-system
kubectl describe hpa book-service-hpa -n library-system
```

#### Cleanup

```bash
# Delete all resources in namespace
kubectl delete namespace library-system

# Or delete individual components
kubectl delete -f k8s/
```

---

### Option 3: Running Locally (Development)

#### Terminal 1: Auth Service
```bash
cd Auth_service
npm install
npm run dev
# Runs on http://localhost:3000
```

#### Terminal 2: Book Service (Instance 1)
```bash
cd Book_service
npm install
npm start
# Runs on http://localhost:5001
```

#### Terminal 3: Borrow Service
```bash
cd Borrow_service
npm install
npm start
# Runs on http://localhost:5000
```

#### Terminal 4: API Gateway
```bash
cd API_Gateway
npm install
npm start
# Runs on http://localhost:4000
```

**Prerequisites for local setup**:
- Ensure MongoDB is running: `mongod`
- Ensure Redis is running: `redis-server`

---

## ⚖️ Load Balancing

The system uses different load balancing strategies depending on the deployment method:

### Docker Compose: Nginx Load Balancer

**What**: Nginx reverse proxy distributes traffic across multiple Book Service instances

**How it works**:
```
Borrow Service → http://nginx:80 → [Nginx Round-Robin] → Book Service 1 (port 3001)
                                                        → Book Service 2 (port 3001)
```

**Configuration** (`nginx.conf`):
```nginx
upstream book_service {
  server book_service_1:3001;
  server book_service_2:3001;
}

server {
  listen 80;
  location / {
    proxy_pass http://book_service;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
  }
}
```

**Usage in `docker-compose.yml`**:
- Nginx service runs on port 8080
- Borrow Service environment: `BOOK_SERVICE_URL=http://nginx:80`
- Nginx forwards requests to Book Service instances using round-robin

**Benefits**:
- Simple round-robin load balancing
- Easy to add/remove book service instances
- Traffic distribution across replicas
- Reliable for container-based deployments

---

### Kubernetes: Native Service Load Balancing

**What**: Kubernetes Services provide built-in load balancing (no Nginx needed)

**How it works**:
```
Borrow Service → http://book-service:3001 → [K8s Service ClusterIP] → Book Service Pod 1
                                                                    → Book Service Pod 2
```

**Service Configuration** (`k8s/book-service.yaml`):
```yaml
apiVersion: v1
kind: Service
metadata:
  name: book-service
  namespace: library-system
spec:
  selector:
    app: book-service
  ports:
    - port: 3001
      targetPort: 3001
  type: ClusterIP
```

**Usage in services**:
- Services use Kubernetes DNS: `http://book-service:3001`
- Kubernetes automatically routes to available pods
- Default algorithm: round-robin

**Benefits**:
- Native Kubernetes load balancing (no external components)
- Automatic failover if pods crash
- Service discovery via DNS (no hardcoding IPs)
- HPA automatically scales pods based on metrics
- Built-in health checks (liveness & readiness probes)

---

### Comparison: Docker vs Kubernetes Load Balancing

| Feature | Docker (Nginx) | Kubernetes |
|---------|---|---|
| **Load Balancer** | Nginx container | Kubernetes Service (ClusterIP) |
| **Discovery** | Manual DNS (nginx container name) | Automatic DNS (service name) |
| **Scaling** | Manual pod addition | HPA auto-scaling |
| **Failover** | Manual restart required | Automatic pod restart |
| **Config** | nginx.conf file | Service manifest (YAML) |
| **Setup** | Simple, one config file | More infrastructure, more powerful |
| **Port** | Port 8080 | Port 3001 (internal) |
| **External Access** | Via API Gateway | Via Ingress or port-forward |

---

## 📡 API Documentation

### Authentication Endpoints

**Register New User**
```http
POST /auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securePassword123",
  "name": "John Doe",
  "role": "member"  // or "librarian"
}

Response: 201 Created
{
  "message": "User registered successfully",
  "user": {
    "_id": "...",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "member"
  }
}
```

**Login**
```http
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securePassword123"
}

Response: 200 OK
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Reset Password**
```http
POST /auth/reset-password
Content-Type: application/json

{
  "email": "user@example.com",
  "newPassword": "newSecurePassword123"
}

Response: 200 OK
{
  "message": "Password reset successfully"
}
```

---

### Book Management Endpoints

**Get All Books**
```http
GET /books
Authorization: Bearer <token>

Response: 200 OK
[
  {
    "_id": "...",
    "title": "The Great Gatsby",
    "author": "F. Scott Fitzgerald",
    "isbn": "978-0743273565",
    "count": 5,
    "availableCount": 3
  }
]
```

**Search Books**
```http
GET /books/search?query=gatsby&author=Fitzgerald
Authorization: Bearer <token>

Response: 200 OK
[
  {
    "_id": "...",
    "title": "The Great Gatsby",
    "author": "F. Scott Fitzgerald",
    "isbn": "978-0743273565",
    "count": 5,
    "availableCount": 3
  }
]
```

**Get Book by ID**
```http
GET /books/:bookId
Authorization: Bearer <token>

Response: 200 OK
{
  "_id": "...",
  "title": "The Great Gatsby",
  "author": "F. Scott Fitzgerald",
  "isbn": "978-0743273565",
  "count": 5,
  "availableCount": 3
}
```

**Add New Book** (Librarian only)
```http
POST /books
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "1984",
  "author": "George Orwell",
  "isbn": "978-0451524935",
  "count": 10
}

Response: 201 Created
{
  "_id": "...",
  "title": "1984",
  "author": "George Orwell",
  "isbn": "978-0451524935",
  "count": 10,
  "availableCount": 10
}
```

**Update Book** (Librarian only)
```http
PATCH /books/:bookId
Authorization: Bearer <token>
Content-Type: application/json

{
  "count": 15,
  "title": "1984 - Updated Edition"
}

Response: 200 OK
{
  "_id": "...",
  "title": "1984 - Updated Edition",
  "author": "George Orwell",
  "isbn": "978-0451524935",
  "count": 15,
  "availableCount": 12
}
```

---

### Borrow Management Endpoints

**Borrow a Book**
```http
POST /borrow
Authorization: Bearer <token>
Content-Type: application/json

{
  "bookId": "...",
  "memberId": "...",
  "dueDate": "2026-07-21"
}

Response: 201 Created
{
  "_id": "...",
  "bookId": "...",
  "memberId": "...",
  "borrowDate": "2026-06-21",
  "dueDate": "2026-07-21",
  "status": "active"
}
```

**Get Borrow History**
```http
GET /borrow
Authorization: Bearer <token>

Response: 200 OK
[
  {
    "_id": "...",
    "bookId": "...",
    "memberId": "...",
    "borrowDate": "2026-06-21",
    "dueDate": "2026-07-21",
    "status": "active"
  }
]
```

**Return a Book**
```http
PATCH /borrow/:borrowId
Authorization: Bearer <token>
Content-Type: application/json

{
  "returnDate": "2026-06-25",
  "status": "returned"
}

Response: 200 OK
{
  "_id": "...",
  "bookId": "...",
  "memberId": "...",
  "borrowDate": "2026-06-21",
  "dueDate": "2026-07-21",
  "returnDate": "2026-06-25",
  "status": "returned"
}
```

---

## 🔐 Environment Variables

### Root `.env` File

| Variable | Description | Example |
|----------|-------------|---------|
| `JWT_SECRET` | Secret key for JWT token signing | `your-super-secret-key` |
| `MONGO_URI` | MongoDB connection string | `mongodb://localhost:27017/library_system` |
| `DOCKER_USERNAME` | Docker Hub username for image registry | `your-docker-username` |

### Kubernetes Configuration

**ConfigMap** (`k8s/configmap.yaml`):
- `MONGO_URI`: `mongodb://mongo:27017/library_system`
- `REDIS_HOST`: `redis`
- `REDIS_PORT`: `6379`

**Secrets** (`k8s/secrets.yaml`):
- `JWT_SECRET`: Base64 encoded secret key

### Service-Specific Environment Variables

**Auth Service & All Services**:
- `MONGO_URI` - MongoDB connection string
- `JWT_SECRET` - JWT token secret

**Book Service**:
- `REDIS_HOST` - Redis server host (default: `redis`)
- `REDIS_PORT` - Redis server port (default: `6379`)

**Borrow Service**:
- **Docker**: `BOOK_SERVICE_URL=http://nginx:80` (routes through Nginx)
- **Kubernetes**: `BOOK_SERVICE_URL=http://book-service:3001` (routes through K8s Service)

---

## 📁 Project Structure

```
Library_System/
├── API_Gateway/              # API Gateway Service
│   ├── Dockerfile
│   ├── index.js
│   ├── package.json
│   └── README.md
│
├── Auth_service/             # Authentication Service
│   ├── Dockerfile
│   ├── server.js
│   ├── package.json
│   ├── config/
│   ├── models/
│   └── routes/
│
├── Book_service/             # Book Management Service
│   ├── Dockerfile
│   ├── server.js
│   ├── package.json
│   ├── config/
│   ├── models/
│   ├── controllers/
│   └── routes/
│
├── Borrow_service/           # Borrow Management Service
│   ├── Dockerfile
│   ├── server.js
│   ├── package.json
│   ├── config/
│   ├── models/
│   ├── controllers/
│   └── routes/
│
├── shared/                   # Shared Middleware
│   ├── package.json
│   └── middleware/
│
├── k8s/                      # Kubernetes Manifests
│   ├── README.md
│   ├── namespace.yaml
│   ├── secrets.yaml
│   ├── configmap.yaml
│   ├── mongo.yaml
│   ├── redis.yaml
│   ├── auth-service.yaml
│   ├── book-service.yaml
│   ├── borrow-service.yaml
│   ├── api-gateway.yaml
│   └── ingress.yaml
│
├── docker-compose.yml        # Docker Compose (with Nginx)
├── nginx.conf                # Nginx load balancer config
├── .env                      # Environment variables
├── .env.example
├── README.md
└── .gitignore
```

---

## 👨‍💻 Development Workflow

### 1. Local Development Setup

```bash
npm install --prefix API_Gateway
npm install --prefix Auth_service
npm install --prefix Book_service
npm install --prefix Borrow_service
npm install --prefix shared
```

### 2. Start Services Locally

```bash
# Terminal 1
npm run dev --prefix Auth_service

# Terminal 2
npm start --prefix Book_service

# Terminal 3
npm start --prefix Borrow_service

# Terminal 4
npm start --prefix API_Gateway
```

### 3. Testing API Endpoints

```bash
# Register
curl -X POST http://localhost:4000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123","name":"John Doe","role":"member"}'

# Login
curl -X POST http://localhost:4000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}'

# Get Books
curl -X GET http://localhost:4000/books \
  -H "Authorization: Bearer <TOKEN>"
```

### 4. Docker Development

```bash
# Build and start
docker compose up --build

# View logs
docker compose logs -f

# Stop
docker compose down
```

### 5. Kubernetes Development

```bash
# Deploy
kubectl apply -f k8s/

# Check status
kubectl get pods -n library-system

# View logs
kubectl logs -f deployment/auth-service -n library-system

# Port forward
kubectl port-forward svc/api-gateway 4000:4000 -n library-system

# Clean up
kubectl delete namespace library-system
```

### 6. Debugging

**Docker Compose logs:**
```bash
docker compose logs -f auth_service
docker compose logs -f book_service_1
docker compose logs -f nginx
```

**Kubernetes pod logs:**
```bash
kubectl logs -f pod/auth-service-xyz -n library-system
kubectl exec -it pod/auth-service-xyz -n library-system -- sh
```

---

## 🔍 Key Features

✅ **Microservices Architecture** - Independent, scalable services  
✅ **API Gateway Pattern** - Centralized request routing  
✅ **JWT Authentication** - Secure token-based auth  
✅ **Role-Based Access Control** - Member and Librarian roles  
✅ **Load Balancing** - Nginx (Docker) + Kubernetes Services (K8s)  
✅ **Auto-scaling** - HPA in Kubernetes  
✅ **Service Discovery** - DNS-based discovery  
✅ **Caching Layer** - Redis for performance  
✅ **Data Persistence** - MongoDB with StatefulSet  
✅ **Docker Containerization** - Consistent deployment  
✅ **Error Handling** - Graceful error responses  

---

## 📝 Notes

- **JWT Secret**: Change in production to a strong, random value
- **MongoDB Connection**: Ensure MongoDB is running and accessible
- **Redis Cache**: Book Service requires Redis for optimal performance
- **Nginx (Docker only)**: Used for load balancing Book Service instances (2 replicas)
- **Kubernetes**: Uses native Services for load balancing (no Nginx needed)
- **Book Service**: 2 replicas in both Docker and Kubernetes, can be scaled with HPA in K8s
- **Port Mapping**: API Gateway on 4000, other services internal

---

## 🤝 Contributing

1. Create a feature branch: `git checkout -b feature/your-feature`
2. Commit changes: `git commit -am 'Add your feature'`
3. Push to branch: `git push origin feature/your-feature`
4. Submit a pull request

---

## 📄 License

This project is licensed under the ISC License.

---

## ❓ Troubleshooting

### Docker Issues

**Port Already in Use**
```bash
lsof -i :4000
kill -9 <PID>
```

**MongoDB Connection Error**
```bash
mongod
# or
docker run -d -p 27017:27017 mongo
```

**Redis Connection Error**
```bash
redis-server
# or
docker run -d -p 6379:6379 redis
```

**Nginx not forwarding requests**
```bash
docker compose logs nginx
docker compose exec nginx curl http://book_service_1:3001
```

### Kubernetes Issues

**Pod Not Starting**
```bash
kubectl describe pod <pod-name> -n library-system
kubectl logs <pod-name> -n library-system
```

**Service Not Accessible**
```bash
kubectl get svc -n library-system
kubectl port-forward svc/api-gateway 4000:4000 -n library-system
```

**Persistent Volume Issues**
```bash
kubectl get pvc -n library-system
kubectl describe pvc <pvc-name> -n library-system
```

---

**Last Updated**: July 6, 2026  
**Version**: 2.0.0 (with Kubernetes support)

For issues or questions, please open an issue on the repository.
