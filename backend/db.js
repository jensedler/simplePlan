import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = process.env.DB_PATH || path.join(__dirname, '..', 'data', 'simplePlan.db');

const db = new Database(DB_PATH);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS settings (
    key   TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS rows (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    sort_order REAL NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS projects (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    name        TEXT    NOT NULL DEFAULT 'Neues Projekt',
    color       TEXT    NOT NULL DEFAULT '#4f86c6',
    start_year  INTEGER NOT NULL,
    start_month INTEGER NOT NULL CHECK (start_month BETWEEN 1 AND 12),
    end_year    INTEGER NOT NULL,
    end_month   INTEGER NOT NULL CHECK (end_month BETWEEN 1 AND 12),
    lead_months INTEGER NOT NULL DEFAULT 0,
    description TEXT    NOT NULL DEFAULT '',
    responsible TEXT    NOT NULL DEFAULT '',
    row_id      INTEGER NOT NULL REFERENCES rows(id) ON DELETE CASCADE,
    sort_order  REAL    NOT NULL DEFAULT 0
  );
`);

// Seed default rows if none exist yet
const rowCount = db.prepare('SELECT COUNT(*) as n FROM rows').get().n;
if (rowCount === 0) {
  const insertRow = db.prepare('INSERT INTO rows (sort_order) VALUES (?)');
  const seedRows = db.transaction(() => {
    for (let i = 1; i <= 10; i++) insertRow.run(i);
  });
  seedRows();
}

export default db;
