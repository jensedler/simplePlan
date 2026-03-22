import { Router } from 'express';
import db from '../db.js';

const router = Router();

const getAll = db.prepare(`
  SELECT * FROM projects ORDER BY row_id, sort_order ASC
`);
const getById = db.prepare('SELECT * FROM projects WHERE id = ?');
const insert = db.prepare(`
  INSERT INTO projects
    (name, color, start_year, start_month, end_year, end_month,
     lead_months, description, responsible, row_id, sort_order)
  VALUES
    (@name, @color, @start_year, @start_month, @end_year, @end_month,
     @lead_months, @description, @responsible, @row_id, @sort_order)
`);
const remove = db.prepare('DELETE FROM projects WHERE id = ?');

// GET all projects
router.get('/', (_req, res) => {
  res.json(getAll.all());
});

// POST create project
router.post('/', (req, res) => {
  const {
    name = 'Neues Projekt',
    color = '#4f86c6',
    start_year, start_month,
    end_year, end_month,
    lead_months = 0,
    description = '',
    responsible = '',
    row_id,
    sort_order = 0,
  } = req.body;

  if (!start_year || !start_month || !end_year || !end_month || !row_id) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const result = insert.run({
    name, color, start_year, start_month, end_year, end_month,
    lead_months, description, responsible, row_id, sort_order,
  });
  res.status(201).json(getById.get(result.lastInsertRowid));
});

// PATCH update project (partial)
router.patch('/:id', (req, res) => {
  const project = getById.get(req.params.id);
  if (!project) return res.status(404).json({ error: 'Project not found' });

  const fields = [
    'name', 'color', 'start_year', 'start_month', 'end_year', 'end_month',
    'lead_months', 'description', 'responsible', 'row_id', 'sort_order',
  ];

  const updates = fields.filter(f => f in req.body);
  if (updates.length === 0) return res.json(project);

  const setClause = updates.map(f => `${f} = @${f}`).join(', ');
  const stmt = db.prepare(`UPDATE projects SET ${setClause} WHERE id = @id`);
  stmt.run({ ...project, ...req.body, id: req.params.id });

  res.json(getById.get(req.params.id));
});

// DELETE project
router.delete('/:id', (req, res) => {
  const project = getById.get(req.params.id);
  if (!project) return res.status(404).json({ error: 'Project not found' });
  remove.run(req.params.id);
  res.json({ ok: true });
});

export default router;
