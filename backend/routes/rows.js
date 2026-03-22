import { Router } from 'express';
import db from '../db.js';

const router = Router();

const getAll = db.prepare('SELECT * FROM rows ORDER BY sort_order ASC, id ASC');
const getById = db.prepare('SELECT * FROM rows WHERE id = ?');
const insert = db.prepare('INSERT INTO rows (sort_order) VALUES (?)');
const update = db.prepare('UPDATE rows SET sort_order = ? WHERE id = ?');
const remove = db.prepare('DELETE FROM rows WHERE id = ?');
const updateOrder = db.prepare('UPDATE rows SET sort_order = ? WHERE id = ?');

const reorderAll = db.transaction((items) => {
  for (const { id, sort_order } of items) {
    updateOrder.run(sort_order, id);
  }
});

// GET all rows
router.get('/', (_req, res) => {
  res.json(getAll.all());
});

// POST create row
router.post('/', (req, res) => {
  const allRows = getAll.all();
  const maxOrder = allRows.length > 0 ? Math.max(...allRows.map(r => r.sort_order)) : 0;
  const result = insert.run(maxOrder + 1);
  res.status(201).json(getById.get(result.lastInsertRowid));
});

// PATCH update row (sort_order)
router.patch('/:id', (req, res) => {
  const { sort_order } = req.body;
  const row = getById.get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Row not found' });

  update.run(sort_order ?? row.sort_order, req.params.id);
  res.json(getById.get(req.params.id));
});

// DELETE row (cascades to projects)
router.delete('/:id', (req, res) => {
  const row = getById.get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Row not found' });
  remove.run(req.params.id);
  res.json({ ok: true });
});

// PUT bulk reorder
router.put('/reorder', (req, res) => {
  const items = req.body;
  if (!Array.isArray(items)) return res.status(400).json({ error: 'Expected array' });
  reorderAll(items);
  res.json({ ok: true });
});

export default router;
