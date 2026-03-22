import express from 'express';
import cookieParser from 'cookie-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import { mkdirSync } from 'fs';

import authRouter from './routes/auth.js';
import rowsRouter from './routes/rows.js';
import projectsRouter from './routes/projects.js';
import { authMiddleware } from './middleware/auth.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 3000;

// Ensure data directory exists
const dataDir = process.env.DB_PATH
  ? path.dirname(process.env.DB_PATH)
  : path.join(__dirname, '..', 'data');
mkdirSync(dataDir, { recursive: true });

const app = express();

app.use(express.json());
app.use(cookieParser());

// API routes
app.use('/api/auth', authRouter);
app.use('/api/rows', authMiddleware, rowsRouter);
app.use('/api/projects', authMiddleware, projectsRouter);

// Serve built frontend (production)
const publicDir = path.join(__dirname, 'public');
app.use(express.static(publicDir));
app.get('*', (_req, res) => {
  res.sendFile(path.join(publicDir, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`simplePlan running on http://localhost:${PORT}`);
});
