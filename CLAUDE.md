# simplePlan – Entwicklungshinweise für Claude

## Tech Stack
- **Backend**: Node.js + Express + better-sqlite3 (ESM, `"type": "module"`)
- **Frontend**: React 18 + TypeScript + Vite + Zustand
- **Datenbank**: SQLite unter `/storage/simplePlan.db` (Docker) bzw. `./data/simplePlan.db` (lokal)
- **Auth**: Einzelnes geteiltes Passwort (bcrypt), JWT als httpOnly-Cookie (30 Tage)
- **Deployment**: Docker (Single Container, Port 80), ONCE-kompatibel

## Lokaler Dev-Start
```bash
# Terminal 1
cd backend && node server.js        # Port 3000

# Terminal 2
cd frontend && npm run dev          # Port 5173, proxied zu 3000
```

## Wichtige Architekturentscheidungen

### Drag-System
Alle Drag-Interaktionen laufen über **document-level Pointer Events**, die in `Timeline.tsx` (`useEffect` mit `document.addEventListener`) registriert werden. Komponenten initiieren Drags nur per `setDrag(...)` im Zustand-Store. Das verhindert Event-Capture-Konflikte und ermöglicht Row-Wechsel während eines Move-Drags.

- `Timeline.tsx` – globaler Move/Resize/Create-Commit
- `TimelineRow.tsx` – initiiert Create-Drag (pointerdown auf Canvas)
- `ProjectBar.tsx` – initiiert Move/Resize-Drag (pointerdown auf Balken/Handles)

### Koordinatensystem
`dateUtils.ts::monthIndex(year, month)` ist die Grundlage aller Positionsberechnungen:
```
pixelX = (monthIndex(year, month) - timelineStartIdx) * monthColWidth
```
`pixelX` ist immer relativ zum linken Rand des Timeline-Inner-Div, **inklusive scrollLeft** des Scroll-Containers.

### Cookie-Sicherheit
`COOKIE_SECURE` ist standardmäßig `false`. SSL wird in Produktion extern (ONCE/Reverse Proxy) terminiert. Nur auf `true` setzen wenn Node direkt HTTPS terminiert.

## Häufige Fallstricke

### `.dockerignore` ist kritisch
`node_modules` **muss** in `.dockerignore` stehen. Sonst kopiert `COPY backend/ .` die lokal auf macOS kompilierten Mach-O Binaries von `better-sqlite3` in den Linux-Container → `Exec format error` beim Start.

### better-sqlite3 Build in Docker
Das native `.node`-Binary muss im Ziel-Container kompiliert werden. Im Dockerfile:
```dockerfile
RUN apk add --no-cache python3 make g++
RUN npm ci --omit=dev
RUN apk del python3 make g++
```
Build-Tools in **derselben** Stage installieren und entfernen – nicht per Multi-Stage-Copy des node_modules übertragen (Architektur-Mismatch).

### Monatsgranularität
Projekte snappen immer auf volle Monate. `end_month` ist **inklusiv**: ein Projekt von Jan bis Jan = 1 Monat Breite. Formel: `span = endIdx - startIdx + 1`.

## API-Übersicht

| Methode | Pfad                  | Auth | Beschreibung                    |
|---------|-----------------------|------|---------------------------------|
| GET     | `/up`                 | –    | ONCE Healthcheck                |
| GET     | `/api/auth/status`    | –    | Prüft ob Setup nötig            |
| POST    | `/api/auth/setup`     | –    | Erstes Passwort setzen          |
| POST    | `/api/auth/login`     | –    | Login → setzt JWT-Cookie        |
| POST    | `/api/auth/logout`    | –    | Cookie löschen                  |
| GET     | `/api/auth/me`        | JWT  | Auth-Check                      |
| GET     | `/api/rows`           | JWT  | Alle Zeilen (sortiert)          |
| POST    | `/api/rows`           | JWT  | Neue Zeile                      |
| PATCH   | `/api/rows/:id`       | JWT  | Zeile aktualisieren             |
| DELETE  | `/api/rows/:id`       | JWT  | Zeile + Projekte löschen        |
| PUT     | `/api/rows/reorder`   | JWT  | Bulk-Reorder                    |
| GET     | `/api/projects`       | JWT  | Alle Projekte                   |
| POST    | `/api/projects`       | JWT  | Projekt erstellen               |
| PATCH   | `/api/projects/:id`   | JWT  | Projekt aktualisieren (partial) |
| DELETE  | `/api/projects/:id`   | JWT  | Projekt löschen                 |

## Datenbank-Schema
```sql
settings  (key TEXT PK, value TEXT)           -- Passwort-Hash
rows      (id, sort_order REAL)               -- Zeilen
projects  (id, name, color, start_year, start_month, end_year, end_month,
           lead_months, description, responsible, row_id FK, sort_order REAL)
```
Beim ersten Start werden automatisch 10 leere Zeilen geseed (wenn `rows` leer ist).
