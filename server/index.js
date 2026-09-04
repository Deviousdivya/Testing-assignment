import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import { attachCurrentUser } from './middleware/auth.js';
import { errorHandler, notFound } from './middleware/errors.js';
import clientRoutes from './routes/clients.js';
import invoiceRoutes from './routes/invoices.js';
import profileRoutes from './routes/profile.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 4000;
const clientOrigin = process.env.CLIENT_ORIGIN || 'http://localhost:5173';

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({ origin: clientOrigin }));
app.use(express.json({ limit: '1mb' }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(attachCurrentUser);

app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

app.use('/api/clients', clientRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/profile', profileRoutes);
app.use(notFound);
app.use(errorHandler);

mongoose
  .connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/invoice_studio', {
    serverSelectionTimeoutMS: 5000
  })
  .then(() => {
    app.listen(port, () => {
      console.log(`API listening on http://localhost:${port}`);
    });
  })
  .catch((error) => {
    console.error('MongoDB connection failed:', error.message);
    process.exit(1);
  });
