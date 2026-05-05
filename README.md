# AutoStocker Smart Inventory System

This project uses:

- React + Vite for the frontend
- Node.js + Express for the backend API
- MongoDB + Mongoose for persistence
- JWT authentication for protected app access

## Setup

1. Install dependencies:

```bash
npm install
```

2. Copy the example environment file and adjust values if needed:

```bash
copy .env.example .env
```

3. Make sure MongoDB is running locally on:

```text
mongodb://127.0.0.1:27017/smart-inventory
```

You can also change `MONGODB_URI` in `.env`.

## Run In Development

```bash
npm run dev
```

This starts:

- the Vite frontend on its default dev port
- the Express API on `http://localhost:5000`

The frontend proxies `/api` requests to the backend during development.

## Default Admin Login

- Email: `admin@smartinventory.in`
- Password: `Admin@123`

Change this after first use if you extend the auth system.

## Production Build

```bash
npm run build
```

## Backend Deployment

This repo is prepared for backend deployment with [render.yaml](./render.yaml).

### Deploy backend on Render

1. Push this repo to GitHub.
2. In Render, create a new `Web Service` from the GitHub repo.
3. Render can detect `render.yaml`, or you can use these values manually:

```text
Build Command: npm install
Start Command: npm run server
```

4. Add these environment variables in Render:

```text
MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>/<db>?retryWrites=true&w=majority
JWT_SECRET=<your-strong-secret>
CORS_ORIGIN=https://your-vercel-app.vercel.app
PORT=5000
```

If you use a custom frontend domain, add it to `CORS_ORIGIN`. For multiple frontend origins, separate them with commas.

### Deploy database on MongoDB Atlas

1. Create a MongoDB Atlas cluster.
2. Create a database user.
3. Allow Render access in Atlas Network Access.
4. Copy the Atlas connection string into `MONGODB_URI` on Render.

### Connect frontend on Vercel

Set this environment variable in Vercel and redeploy the frontend:

```text
VITE_API_BASE_URL=https://your-render-service.onrender.com/api
```

Without this, the frontend will try to call `/api` on the Vercel domain and login will fail.

## Backend Notes

- The backend seeds the database automatically the first time it starts.
- Inventory actions such as add stock, record sale, and cart checkout persist to MongoDB.
- Each checkout/manual sale also creates a bill record in the `bills` collection.
- Dashboard, analytics, alerts, and recommendations are generated from backend data.
- Currency is presented in Indian Rupees.
