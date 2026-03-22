import { Router } from 'express';
import bcrypt from 'bcryptjs';
import db from '../db.js';
import { authMiddleware, signToken } from '../middleware/auth.js';

const router = Router();

const COOKIE_OPTS = {
  httpOnly: true,
  sameSite: 'strict',
  secure: process.env.NODE_ENV === 'production',
  maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
};

// First-run: set initial password (only if none exists yet)
router.post('/setup', async (req, res) => {
  const existing = db.prepare('SELECT value FROM settings WHERE key = ?').get('password_hash');
  if (existing) return res.status(403).json({ error: 'Password already set' });

  const { password } = req.body;
  if (!password || password.length < 4) {
    return res.status(400).json({ error: 'Password must be at least 4 characters' });
  }

  const hash = await bcrypt.hash(password, 10);
  db.prepare('INSERT INTO settings (key, value) VALUES (?, ?)').run('password_hash', hash);

  const token = signToken();
  res.cookie('token', token, COOKIE_OPTS).json({ ok: true });
});

// Login
router.post('/login', async (req, res) => {
  const { password } = req.body;
  const row = db.prepare('SELECT value FROM settings WHERE key = ?').get('password_hash');
  if (!row) return res.status(400).json({ error: 'No password set. Use /setup first.' });

  const valid = await bcrypt.compare(password, row.value);
  if (!valid) return res.status(401).json({ error: 'Wrong password' });

  const token = signToken();
  res.cookie('token', token, COOKIE_OPTS).json({ ok: true });
});

// Logout
router.post('/logout', (_req, res) => {
  res.clearCookie('token').json({ ok: true });
});

// Check auth status
router.get('/me', authMiddleware, (_req, res) => {
  res.json({ authenticated: true });
});

// Check if setup is needed
router.get('/status', (_req, res) => {
  const row = db.prepare('SELECT value FROM settings WHERE key = ?').get('password_hash');
  res.json({ needsSetup: !row });
});

export default router;
