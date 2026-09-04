# Modern Invoicing System

A simplified full-stack invoicing system built with React, Express, and MongoDB/Mongoose.

## Features

- Client create, edit, delete, and list scoped to the current mock user
- Invoice create, list, status/client/date filters, detail view, and paid status action
- Dynamic invoice line items with subtotal, tax, and total calculation
- Premium-only logo upload and invoice branding
- Basic validation, error handling, CORS, Helmet, upload limits, and user scoping

## Tech Stack

- Frontend: React + Vite + plain CSS
- Backend: Node.js + Express
- Database: MongoDB with Mongoose
- Uploads: Multer with image-only validation and 2MB limit

## Mock Users

The app uses request headers instead of full authentication so the assignment can focus on full-stack fundamentals.

- Free user: `x-user-id: demo-owner`, `x-user-role: free`
- Premium user: `x-user-id: demo-owner`, `x-user-role: premium`

The UI has a Free/Premium toggle in the header.

## Run Backend Locally

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy environment values:

   ```bash
   cp .env.example .env
   ```

3. Start MongoDB locally or set `MONGODB_URI` to a MongoDB Atlas connection string.

4. Start the backend:

   ```bash
   npm start
   ```

The API runs on `http://localhost:4000`.

## Run Full App Locally

Start MongoDB locally or set `MONGODB_URI`, then run:

```bash
npm run dev
```

Open `http://localhost:5173`.

## Environment Variables

Backend:

```bash
PORT=4000
MONGODB_URI=mongodb://127.0.0.1:27017/invoice_studio
CLIENT_ORIGIN=http://localhost:5173
```

Frontend build:

```bash
VITE_API_URL=http://localhost:4000
```

When deploying only the frontend, keep the backend running locally and build the frontend with `VITE_API_URL=http://localhost:4000`.

## Frontend Deployment

This repo includes both `vercel.json` and `netlify.toml`.

Vercel:

1. Import the GitHub repository.
2. Framework preset: Vite.
3. Build command: `npm run build`.
4. Output directory: `dist`.
5. Environment variable: `VITE_API_URL=http://localhost:4000`.

Netlify:

1. Import the GitHub repository.
2. Build command: `npm run build`.
3. Publish directory: `dist`.
4. Environment variable: `VITE_API_URL=http://localhost:4000`.

## API

- `GET /api/clients`
- `POST /api/clients`
- `PATCH /api/clients/:id`
- `DELETE /api/clients/:id`
- `GET /api/invoices?status=&clientId=&from=&to=`
- `POST /api/invoices`
- `GET /api/invoices/:id`
- `PATCH /api/invoices/:id/status`
- `GET /api/profile`
- `POST /api/profile/logo`

## Data Model Notes

- `Client` documents are scoped by `userId`.
- `Invoice` documents reference `Client` by ObjectId and store line items as embedded subdocuments.
- Invoice totals are calculated server-side in a Mongoose validation hook.
- Invoice numbers are unique per user with a compound index on `{ userId, invoiceNumber }`.
- `UserProfile` stores the current user role and premium logo metadata.

## Security And Scope Notes

- This project uses mock header-based auth for assessment simplicity, but all database queries are scoped to `req.user.id`.
- Premium logo upload is enforced by backend middleware, not only by hiding the frontend control.
- Uploaded logo files are limited by MIME type and file size.
- Client and invoice inputs are validated on both frontend and backend.

## Submission Links

- GitHub repo: add your repository URL here after pushing.
- Deployed frontend: add your Vercel, Netlify, or GitHub Pages URL here after deployment.
