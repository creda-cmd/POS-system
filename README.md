# SmartBiz POS

A modern, full-stack Point of Sale and business management system for small and medium businesses in Kenya.

## Tech Stack

- Frontend: React + Vite + Tailwind CSS + Recharts
- Backend: Node.js + Express + Knex + PostgreSQL
- Auth: JWT + bcrypt

## Quick Start

### Backend

```bash
cd backend
cp .env.example .env
npm install
npm run migrate
npm run seed
npm run dev
```

Local PostgreSQL via Docker:

```bash
docker-compose up -d
```

### Frontend

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).
