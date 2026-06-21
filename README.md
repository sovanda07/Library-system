# Library System - Microservices Architecture

A cloud-native, microservices-based Library Management System built with Node.js, Express, MongoDB, and Docker. The system demonstrates modern distributed architecture patterns with API Gateway routing, service-to-service communication, and role-based access control.

## 📋 Table of Contents

- [Quick Start](#-quick-start)
- [Architecture Overview](#architecture-overview)
- [Services](#services)
- [Technology Stack](#technology-stack)
- [Prerequisites](#prerequisites)
- [Setup & Installation](#setup--installation)
- [Running the Project](#running-the-project)
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
# Book Service: http://localhost:8080
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

This is a **microservices architecture** with the following components:

```
┌─────────────┐
│   Client    │
└──────┬──────┘
       │
       ▼
┌──────────────────┐
│  API Gateway     │ (Port 4000)
│  (Express)       │
└──────┬──────────┬┬──────────┐
       │          ││          │
       ▼          ▼▼          ▼
┌────────────┐ ┌─────────────┐ ┌────────────┐
│   Auth     │ │   Nginx     │ │   Borrow   │
│  Service   │ │ Load Bal.   │ │  Service   │
│(Port 3000) │ │(Port 8080)  │ │(Port 5000) │
└────────────┘ │             │ └────────────┘
               │  ┌─────────┐│
               │  │ Book    ││
               │  │Service 1││
               │  │(Port 5001)│
               │  └─────────┘│
               │  ┌─────────┐│
               │  │ Book    ││
               │  │Service 2││
               │  │(Port 5002)││
               │  └─────────┘│
               └─────────────┘
       │
       ▼
┌──────────────────┐
│  MongoDB         │
│  (Database)      │
└──────────────────┘
       │
       ▼
┌──────────────────┐
│  Redis           │
│  (Cache)         │
└──────────────────┘
```

### Key Design Patterns

- **API Gateway Pattern**: Single entry point for all client requests
- **Load Balancing**: Nginx distributes traffic across multiple Book Service instances
- **Service-to-Service Communication**: Direct HTTP calls between services
- **Authentication**: JWT token-based authentication with role-based access control (RBAC)
- **Containerization**: Docker containers for each service with Docker Compose orchestration
- **Caching**: Redis for performance optimization in Book Service
- **Data Persistence**: MongoDB for all services

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

### 3. **Book Service** (Dual instances - Ports 5001 & 5002)
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

---

### 4. **Borrow Service** (Port 5000)
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

### 6. **Nginx Load Balancer** (Port 8080)
**Purpose**: Distributes traffic across multiple Book Service instances.

**Configuration**: 
- Upstream balancing across Book Service instances
- Round-robin request distribution
- Reverse proxy to backend services

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
| **Load Balancing** | Nginx |
| **Environment Management** | dotenv |

## 📋 Prerequisites

Before starting, ensure you have:

- **Node.js** (v18+)
- **npm** (v8+)
- **Docker** (v20.10+)
- **Docker Compose** (v1.29+)
- **MongoDB** (v5.0+) - or use Docker
- **Redis** (v6.0+) - or use Docker
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

### Option 1: Using Docker Compose (Recommended)

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

---

### Option 2: Running Locally (Development)

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

### Service-Specific Environment Variables

**Auth Service & All Services**:
- `MONGO_URI` - MongoDB connection string
- `JWT_SECRET` - JWT token secret

**Book Service**:
- `REDIS_HOST` - Redis server host (default: `redis`)
- `REDIS_PORT` - Redis server port (default: `6379`)

**Borrow Service**:
- `BOOK_SERVICE_URL` - URL to Book Service (default: `http://nginx:8080`)

**API Gateway**:
- `JWT_SECRET` - JWT secret for token verification

---

## 📁 Project Structure

```
Library_System/
├── API_Gateway/              # API Gateway Service
│   ├── Dockerfile
│   ├── index.js             # Gateway routing logic
│   ├── package.json
│   └── README.md
│
├── Auth_service/            # Authentication Service
│   ├── Dockerfile
│   ├── server.js
│   ├── package.json
│   ├── config/
│   │   └── db.js           # MongoDB connection
│   ├── models/
│   │   └── Users.js        # User schema
│   └── routes/
│       ├── login.js        # Login endpoint
│       ├── registration.js # Register endpoint
│       └── resetPassword.js # Password reset endpoint
│
├── Book_service/            # Book Management Service
│   ├── Dockerfile
│   ├── server.js
│   ├── package.json
│   ├── config/
│   │   ├── db.js           # MongoDB connection
│   │   └── redis.js        # Redis connection
│   ├── models/
│   │   └── Books.js        # Book schema
│   ├── controllers/
│   │   ├── librarian.js    # Librarian operations
│   │   └── member.js       # Member operations
│   └── routes/
│       └── books.js        # Book routes
│
├── Borrow_service/          # Borrow Management Service
│   ├── Dockerfile
│   ├── server.js
│   ├── package.json
│   ├── config/
│   │   └── db.js           # MongoDB connection
│   ├── models/
│   │   └── Borrow.js       # Borrow schema
│   ├── controllers/
│   │   ├── librarian.js    # Librarian operations
│   │   └── member.js       # Member operations
│   └── routes/
│       └── borrow.js       # Borrow routes
│
├── shared/                  # Shared Middleware & Utilities
│   ├── package.json
│   └── middleware/
│       ├── verifyToken.js  # JWT verification middleware
│       └── authorizeRole.js # Role authorization middleware
│
├── docker-compose.yml       # Docker Compose configuration
├── nginx.conf              # Nginx load balancer config
├── .env                    # Environment variables
├── .env.example            # Example environment variables
├── README.md               # This file
└── .gitignore
```

---

## 👨‍💻 Development Workflow

### 1. Local Development Setup

```bash
# Install all dependencies
npm install --prefix API_Gateway
npm install --prefix Auth_service
npm install --prefix Book_service
npm install --prefix Borrow_service
npm install --prefix shared
```

### 2. Start Services Locally

**Using multiple terminals:**
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

Use tools like:
- **Postman** - GUI-based API testing
- **cURL** - Command-line API testing
- **Insomnia** - Alternative to Postman
- **VS Code REST Client** - Inline REST requests

Example with cURL:
```bash
# Register
curl -X POST http://localhost:4000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123",
    "name": "John Doe",
    "role": "member"
  }'

# Login
curl -X POST http://localhost:4000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'

# Get Books (with token)
curl -X GET http://localhost:4000/books \
  -H "Authorization: Bearer <TOKEN>"
```

### 4. Docker Development

```bash
# Build images
docker compose build

# Start services with logs
docker compose up

# Run in background
docker compose up -d

# View logs
docker compose logs -f <service-name>

# Stop services
docker compose down

# Remove volumes (reset database)
docker compose down -v
```

### 5. Debugging

**View service logs:**
```bash
docker compose logs -f auth_service
docker compose logs -f book_service_1
docker compose logs -f api_gateway
```

**Check service health:**
```bash
docker compose ps
```

**Access service container:**
```bash
docker compose exec auth_service sh
```

---

## 🔍 Key Features

✅ **Microservices Architecture** - Independent, scalable services  
✅ **API Gateway Pattern** - Centralized request routing  
✅ **JWT Authentication** - Secure token-based authentication  
✅ **Role-Based Access Control** - Member and Librarian roles  
✅ **Load Balancing** - Nginx distributes traffic  
✅ **Caching Layer** - Redis for performance  
✅ **Service-to-Service Communication** - Direct HTTP calls  
✅ **Docker Containerization** - Consistent deployment  
✅ **MongoDB Persistence** - Document-based database  
✅ **Error Handling** - Graceful error responses  

---

## 📝 Notes

- **JWT Secret**: Change the `JWT_SECRET` in production to a strong, random value
- **MongoDB Connection**: Ensure MongoDB is running and accessible at the configured URI
- **Redis Cache**: Book Service requires Redis for optimal performance
- **Network Isolation**: Services communicate through a Docker bridge network
- **Port Mapping**: Only API Gateway exposes a port (4000) to the host

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

### Port Already in Use
```bash
# Find process using port
lsof -i :4000

# Kill process
kill -9 <PID>
```

### MongoDB Connection Error
```bash
# Ensure MongoDB is running
mongod

# Or start with Docker
docker run -d -p 27017:27017 mongo
```

### Redis Connection Error
```bash
# Start Redis locally
redis-server

# Or start with Docker
docker run -d -p 6379:6379 redis
```

### Service Not Communicating
```bash
# Check Docker network
docker network ls
docker network inspect library-network

# Check service connectivity
docker compose exec api_gateway ping auth_service
```

---

**Last Updated**: June 21, 2026  
**Version**: 1.0.0

For issues or questions, please open an issue on the repository.
