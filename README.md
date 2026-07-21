# Military Mess Warehouse Management System (MMWMS)

Batch-based inventory and meal management system for a military mess.
Simple MVC architecture: **Node.js + Express + MongoDB (Mongoose)** on the
backend, **React + TypeScript + Tailwind** on the frontend.

## Stack

- **Backend**: Node.js, Express, MongoDB, Mongoose, JavaScript (CommonJS), JWT (httpOnly cookies), Joi
- **Frontend**: React, Vite, TypeScript, Tailwind CSS, Axios, TanStack Query, React Router

Architecture (backend): `Controller → Service → Repository → Model`.
Only repositories touch Mongoose models. All business logic lives in services.

## Prerequisites

- Node.js 18+
- A running MongoDB instance (local or Atlas)

## Setup

```bash
# 1. Install everything (root, server, client)
npm run install:all

# 2. Configure the backend environment
cp server/.env.example server/.env
# edit server/.env if your MongoDB URI, port, or JWT secret differ

# 3. Seed initial roles/permissions/admin user
npm run seed
# creates username: admin / password: Admin@12345 — change it after first login

# 4. Run both apps together
npm run dev
```

- API: http://localhost:5000/api/v1
- Web app: http://localhost:5173

You can also run each app independently with `npm run dev:server` or `npm run dev:client`.

## Project structure

```
server/
  src/
    config/         env + MongoDB connection
    models/         Mongoose schemas
    repositories/   only layer allowed to query models
    services/       business logic
    controllers/    HTTP request/response only
    routes/
    middlewares/    auth (JWT cookie), permission checks, validation, error handler
    validations/    Joi schemas
    utils/
    seed.js         initial roles/permissions/admin user

client/
  src/
    components/     ui/ (buttons, inputs, cards) and layout/ (sidebar, header, shell)
    contexts/       AuthContext (login/logout/me, permission checks)
    pages/
    routes/
    lib/            axios instance, query client
```

## Status

Implemented so far: **Auth, Users, Roles, Permissions** (backend + basic frontend shell
with login and a protected dashboard). Remaining domains (Products, Batches, Inventory
Transactions, Goods Receiving, Excel Import, Transfers, Returns, Waste, Stock Count,
Menus, Recipes, Meal Attendance, Meal Requests, Reservations, Notifications, Dashboard
metrics, Reports, Settings) are being built module by module.
