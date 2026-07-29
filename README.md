# Rechnungs-Generator — Burschenschaft Kirchbach

Passwortgeschützte Web-App zur Erstellung von Rechnungen und Spendenbestätigungen als A4-PDFs. Eingesetzt von der Burschenschaft Kirchbach für die jährliche Kirchtag-Sponsorenabrechnung und sonstige Vereinsdokumente.

Technologie-Stack: **Next.js 16 · React 19 · TypeScript 5.7 · Tailwind v4 · Supabase · Drizzle ORM · Puppeteer** — deployed auf **Vercel**.

---

## Lokale Entwicklung

```bash
npm install
cp .env.local.example .env.local
# .env.local befüllen (siehe Umgebungsvariablen unten)

npm run db:migrate        # Datenbank-Tabellen anlegen
npm run storage:setup     # Supabase Storage Buckets erstellen
npm run dev               # Entwicklungsserver starten → http://localhost:3000
```

Beim ersten Start: Im Browser einloggen → `/einstellungen` öffnen → Vereinsdaten, IBAN und Logo eintragen.

---

## Umgebungsvariablen

Alle Variablen werden in `.env.local` eingetragen (Vorlage: `.env.local.example`).

| Variable | Beschreibung | Wo finden? |
|---|---|---|
| `DATABASE_URL` | Supabase Supavisor-URL **Port 6543** (für App-Laufzeit) | Supabase Dashboard → Settings → Database → Transaction mode |
| `DIRECT_URL` | Supabase Direct-URL **Port 5432** (nur für Migrationen) | Supabase Dashboard → Settings → Database → Session mode |
| `SUPABASE_URL` | Supabase-Projekt-URL (`https://xxxx.supabase.co`) | Supabase Dashboard → Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Service Role Key — **niemals öffentlich zugänglich machen** | Supabase Dashboard → Settings → API |
| `APP_PASSWORD` | Gemeinsames Passwort für alle Vorstandsmitglieder | Selbst gewählt |
| `SESSION_SECRET` | Zufällige Zeichenkette zum Signieren des Session-Cookies | `openssl rand -hex 32` |
| `CHROME_EXECUTABLE_PATH` | Pfad zu Chrome/Chromium *(nur lokal, leer lassen auf Vercel)* | z. B. `/usr/bin/google-chrome` |

---

## Deployment auf Vercel

1. Repository in Vercel importieren
2. Alle 6 Umgebungsvariablen eintragen (ohne `CHROME_EXECUTABLE_PATH`)
3. Nach dem ersten Deploy — **einmalige Einrichtung**:
   ```bash
   # Lokal mit DIRECT_URL auf Produktion zeigen:
   npm run db:migrate
   npm run storage:setup
   ```
4. Gesundheitscheck aufrufen: `GET /api/health` → Antwort sollte `{ "ok": true, "db": true, "storage": true }` enthalten

---

## Erster Start

1. Unter `/login` einloggen (Passwort = `APP_PASSWORD`)
2. Unter `/einstellungen` ausfüllen:
   - Vereinsname, Straße, PLZ, Ort, ZVR-Zahl
   - Bankname, IBAN, BIC
   - Unterschriften (Name + Rolle für Obmann und Kassier)
   - Logo hochladen (PNG oder JPEG, max. 2 MB)
3. Unter `/kontakte/neu` ersten Kontakt anlegen
4. Unter `/rechnung/neu` eine Test-Rechnung erstellen und herunterladen

---

## Vorhandene Vorlagen

| ID | Bezeichnung | Beschreibung |
|---|---|---|
| `sponsoring` | Sponsoring-Rechnung | Rechnung für Kirchtag-Sponsoren |
| `freie-rechnung` | Freie Rechnung | Rechnung mit beliebigen Positionen |
| `spendenbestaetigung` | Spendenbestätigung | Bestätigung einer erhaltenen Spende |

Neue Vorlagen hinzufügen → siehe [`docs/vorlagen-hinzufuegen.md`](docs/vorlagen-hinzufuegen.md).

---

## CSV-Massenimport

Unter `/import` können mehrere Rechnungen auf einmal aus einer CSV-Datei erstellt werden:
1. Vorlage auswählen und Muster-CSV herunterladen
2. CSV befüllen (Trennzeichen `;`, UTF-8 oder Windows-1252)
3. Hochladen → Vorschau und Fehlerprüfung
4. Erzeugen → alle Rechnungen als ZIP-Archiv herunterladen

---

## Bekannte Einschränkungen

- PDF-Generierung ist auf Vercel durch Chromium-Kaltstart-Zeiten etwas langsam (~5–15 Sek.)
- Keine Umsatzsteuer-Logik (Verein ist Kleinunternehmer)
- Keine Zahlungsverfolgung — das Archiv dient nur der Dokumentation
- Archivierte Rechnungen können nicht gelöscht oder bearbeitet werden (7-jährige Aufbewahrungspflicht)

---

## Skripte

| Befehl | Funktion |
|---|---|
| `npm run dev` | Entwicklungsserver starten |
| `npm run build` | Produktions-Build erstellen |
| `npm test` | Unit-Tests ausführen |
| `npm run db:generate` | Drizzle-Migrationen generieren |
| `npm run db:migrate` | Migrationen anwenden |
| `npm run storage:setup` | Supabase Storage Buckets anlegen |
| `npm run lint` | ESLint ausführen |