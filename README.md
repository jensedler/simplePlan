# simplePlan

Web-basiertes Tool für visuelle Team-Jahresplanung mit interaktiver Timeline.

## Entwicklung (lokal)

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
# läuft auf http://localhost:5173
```

Beim ersten Aufruf wirst du nach einem Passwort gefragt (Ersteinrichtung).

---

## Produktion (Docker)

```bash
# .env anlegen (optional, aber empfohlen)
echo "JWT_SECRET=$(openssl rand -hex 32)" > .env

# Build & Start
docker-compose up -d --build

# App läuft auf http://localhost:3000
```

Die SQLite-Datenbank wird im `./data/` Verzeichnis persistent gespeichert.

---

## Features

- Horizontale scrollbare Timeline (monatsgenau, Quartalsgruppierung)
- Drag-to-Create: Plus-Button aktivieren, dann ziehen
- Projekte verschieben und Größe ändern (Bearbeitungsmodus aktivieren)
- Vorlaufzeiten (N Monate vor Projektstart, in abgehellter Farbe)
- Globaler Toggle für Vorlaufzeiten
- Edit-Mode Toggle (verhindert versehentliche Änderungen)
- 8 Farben pro Projekt
- Zeilen per Drag & Drop umsortieren
- Passwortschutz beim ersten Aufruf
