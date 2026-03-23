# simplePlan

Web-basiertes Tool für visuelle Team-Jahresplanung mit interaktiver Timeline. Projekte werden als farbige Balken auf einer scrollbaren Monats-Timeline dargestellt und können per Drag & Drop angelegt, verschoben und umsortiert werden.

---

## Features

- **Horizontale Timeline** – monatsgenau, Quartale farblich gruppiert, frei scrollbar über mehrere Jahre
- **Drag-to-Create** – Plus-Button aktivieren, dann auf der Timeline ziehen → Dialog öffnet sich mit vorausgefülltem Zeitraum
- **Balken verschieben & skalieren** – im Bearbeitungsmodus Projekte horizontal verschieben oder an den Rändern ziehen
- **Vorlaufzeiten** – N Monate vor Projektstart in abgehellter Farbe; global ein-/ausblendbar
- **8 Farben** pro Projekt für visuelle Orientierung
- **Zeilen** – beliebig viele, per Drag & Drop umsortierbar, mehrere Projekte pro Zeile möglich
- **Bearbeitungsmodus-Toggle** – verhindert versehentliche Änderungen beim Scrollen
- **Passwortschutz** – einfaches geteiltes Passwort, wird beim ersten Aufruf festgelegt
- **Projektfelder**: Name, Farbe, Vorlaufzeit, Verantwortliche, Beschreibung

---

## Lokale Entwicklung

### Voraussetzungen
- Node.js 20+
- npm

### Backend starten

```bash
cd backend
npm install
node server.js
# läuft auf http://localhost:3000
```

### Frontend starten (separates Terminal)

```bash
cd frontend
npm install
npm run dev
# läuft auf http://localhost:5173 (Vite proxied /api → Port 3000)
```

Beim ersten Aufruf erscheint ein Formular zum Festlegen des Passworts.

---

## Produktion mit Docker

```bash
# Einmalig: JWT-Secret generieren und in .env speichern
echo "JWT_SECRET=$(openssl rand -hex 32)" > .env

# Build & Start
docker-compose up -d --build

# App läuft auf http://localhost:80
```

Die SQLite-Datenbank wird im Verzeichnis `./storage/` persistent gespeichert (Docker Volume).

### Umgebungsvariablen

| Variable        | Standard                          | Beschreibung                                      |
|-----------------|-----------------------------------|---------------------------------------------------|
| `JWT_SECRET`    | `change-me-in-production`         | Secret für JWT-Signierung – in Produktion ändern! |
| `DB_PATH`       | `/storage/simplePlan.db`          | Pfad zur SQLite-Datenbank                         |
| `PORT`          | `80`                              | HTTP-Port des Servers                             |
| `COOKIE_SECURE` | `false`                           | Auf `true` setzen wenn HTTPS direkt am Node-Server terminiert wird |

---

## ONCE-Deployment (Basecamp)

Die App erfüllt alle ONCE-Anforderungen:

- **Port 80** – Server lauscht auf Port 80
- **`/up` Healthcheck** – gibt `{"ok":true}` zurück (kein Auth erforderlich)
- **`/storage` Volume** – persistente Daten unter `/storage/simplePlan.db`

```bash
# Standard docker-compose reicht für ONCE
docker-compose up -d --build
```

---

## Projektstruktur

```
simplePlan/
├── backend/
│   ├── server.js              # Express-Einstiegspunkt
│   ├── db.js                  # SQLite-Schema + Seeding (10 Zeilen bei Erststart)
│   ├── middleware/auth.js     # JWT-Cookie-Validierung
│   └── routes/
│       ├── auth.js            # Login, Logout, Setup, /me, /status
│       ├── rows.js            # Zeilen CRUD + Reorder
│       └── projects.js        # Projekte CRUD
├── frontend/src/
│   ├── store.ts               # Zustand-Store (Auth, Projekte, Drag-State)
│   ├── types.ts               # Gemeinsame TypeScript-Typen
│   ├── dateUtils.ts           # Monatsindex-Mathe (Kernlogik aller Positionsberechnungen)
│   ├── api.ts                 # Fetch-Wrapper für alle API-Calls
│   └── components/
│       ├── Login.tsx          # Passwortformular + Ersteinrichtung
│       ├── Toolbar.tsx        # Obere Leiste mit Toggles
│       ├── Timeline.tsx       # Scroll-Container + globaler Drag-Handler
│       ├── TimelineHeader.tsx # Quartal/Monat-Beschriftungen
│       ├── TimelineRow.tsx    # Einzelne Zeile mit Create-Drag
│       ├── ProjectBar.tsx     # Projektbalken mit Move/Resize-Drag
│       └── ProjectDialog.tsx  # Erstellen/Bearbeiten-Modal
├── Dockerfile                 # Multi-Stage Build (Frontend → Backend)
├── docker-compose.yml
└── .dockerignore              # Wichtig: node_modules ausschließen
```
