# ClusterOps Backend — Phase 1

This is the Phase 1 backend for **ClusterOps**, an HPC Cluster Management Dashboard.

## What Phase 1 includes

- Node.js + Express + TypeScript backend
- MongoDB + Mongoose models
- JWT authentication
- bcrypt password hashing
- Role-based access control
- Users, Jobs, Nodes, Audit Logs models
- REST API routes
- Basic metrics endpoint
- Prometheus-style `/metrics` endpoint
- Security middleware with Helmet, CORS, and auth rate limiting
- Centralized error handling

## Folder structure

```text
backend/
├── src/
│   ├── app.ts
│   ├── server.ts
│   ├── config/
│   ├── models/
│   ├── routes/
│   ├── controllers/
│   ├── services/
│   ├── middleware/
│   ├── utils/
│   └── types/
├── .env.example
├── package.json
└── tsconfig.json
```

## Setup

```bash
cd backend
npm install
cp .env.example .env
```

Edit `.env`:

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/clusterops
JWT_SECRET=replace_this_with_a_long_random_secret
JWT_EXPIRES_IN=7d
NODE_ENV=development
CLIENT_URL=http://localhost:3000
```

Start MongoDB locally, then run:

```bash
npm run dev
```

Check health:

```bash
curl http://localhost:5000/health
```

## Main API endpoints

### Auth

```http
POST /api/auth/register
POST /api/auth/login
GET  /api/auth/me
```

### Jobs

```http
GET   /api/jobs
POST  /api/jobs
GET   /api/jobs/:id
PATCH /api/jobs/:id/cancel
```

### Nodes

```http
GET   /api/nodes
POST  /api/nodes
PATCH /api/nodes/:id/status
```

### Metrics

```http
GET /api/metrics/overview
GET /metrics
```

### Admin

```http
GET /api/admin/users
GET /api/admin/audit-logs
```

## Example requests

### Register admin

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Moustafa Admin",
    "email": "admin@example.com",
    "password": "password123",
    "role": "admin"
  }'
```

### Login

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "password123"
  }'
```

Copy the token from the response.

### Create node

```bash
curl -X POST http://localhost:5000/api/nodes \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "name": "compute-01",
    "totalCpus": 32,
    "totalMemoryGb": 128,
    "totalGpus": 2
  }'
```

### Submit job

```bash
curl -X POST http://localhost:5000/api/jobs \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "jobName": "test-simulation",
    "script": "#!/bin/bash\necho Running simulation",
    "cpus": 4,
    "memoryGb": 8,
    "gpus": 1,
    "estimatedRuntimeSeconds": 60
  }'
```

## Notes

Phase 1 only creates the backend foundation. Jobs are submitted as `queued`, but they do not automatically move to `running` or `completed` yet. That will be implemented in Phase 2 using the scheduler service and Slurm-inspired simulator.
