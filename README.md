# ShelfStore

College library management: members browse and request books, librarians run the desk (holds, issues, returns, fines).

- `src/`: React + Vite + TypeScript frontend. All data goes through `src/services/api.ts`.
- `server/`: Express + TypeScript + Mongoose API on MongoDB Atlas. All business rules live here.
- `src/data/`: the original mock data, now used only as the seed source.

## Prerequisites

- Node.js 20 or newer
- pnpm (`npm install -g pnpm`), or use npm in its place
- A MongoDB Atlas cluster (the free M0 tier is fine). The server uses multi-document transactions, which need a replica set. Every Atlas cluster is one; a plain local `mongod` is not.

## 1. Install

```sh
# frontend, from the repo root
pnpm install

# backend
cd server
npm install
```

## 2. Configure `.env`

```sh
cd server
cp .env.example .env
```

Edit `server/.env`:

| Variable      | Value                                                                                                          |
| ------------- | -------------------------------------------------------------------------------------------------------------- |
| `MONGODB_URI` | Your Atlas connection string. Include a database name, e.g. `.../shelfstore?retryWrites=true&w=majority`         |
| `JWT_SECRET`  | Any long random string                                                                                           |
| `PORT`        | API port, default `4000`                                                                                         |
| `CORS_ORIGIN` | Optional extra origins, comma-separated. Any localhost port is allowed in development                           |

In Atlas, under Network Access, allow your current IP address.

The frontend calls `http://localhost:4000` by default. To point it somewhere else, copy the root `.env.example` to `.env` and set `VITE_API_URL`.

Both `.env` files are gitignored. Only the `.env.example` files are committed.

## 3. Seed the database

```sh
cd server
npm run seed
```

This drops and recreates every collection, builds the indexes, and loads everything from `src/data/`. Dates are relative to the moment you seed, so you always get the same mix:

- active loans, including one due in 2 days and several overdue
- an approved hold waiting for collection
- pending requests (one waitlisted, one over the book limit, one over the fine limit)
- returned history, including returns from today and a collected fine

Run it again any time you want a clean demo state.

## 4. Run both servers

In two terminals:

```sh
# terminal 1: API on http://localhost:4000
cd server
npm run dev
```

```sh
# terminal 2: frontend on http://localhost:8443
pnpm dev
```

### Demo sign-in

Sign in with any valid email and a password of at least 6 characters. Unknown emails get a new account, and an email containing "admin" gets the librarian role.

| Who                         | Email                 |
| --------------------------- | --------------------- |
| Student with loans and a hold | `keshav@vvce.ac.in`   |
| Student at the book limit     | `divya@vvce.ac.in`    |
| Librarian                     | `admin@shelfstore.in` |

## API notes

- `POST /api/auth/login` returns `{ token, user }`. Send the token as `Authorization: Bearer <token>`. The frontend keeps it in memory only, so reloading the page signs you out.
- `/api/users/:userId/...` routes are member routes. A student can only reach their own; a librarian can reach anyone's.
- `/api/admin/...` routes require the admin role.
- Errors come back as `{ "error": "message" }`.
- Fines are never stored. They are computed on every read from the due date and `finePerDay`, minus any settlements in `finePayments`.
- `books.availableCopies` and `books.totalCopies` are updated in the same transaction as every copy status change.
- Approved holds past `holdExpiresAt` are expired, and their copies released, before each API request is handled.

## Scripts

| Where     | Command             | What it does                    |
| --------- | ------------------- | ------------------------------- |
| root      | `pnpm dev`          | Vite dev server                 |
| root      | `pnpm build`        | Production build                |
| `server/` | `npm run dev`       | API with reload on change       |
| `server/` | `npm start`         | API without watch               |
| `server/` | `npm run seed`      | Reset and seed the database     |
| `server/` | `npm run typecheck` | Type-check the server           |
