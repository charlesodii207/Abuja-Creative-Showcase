# Abuja Creative Showcase — Website & Registration System

Split-stack build: **`frontend/`** (React + Vite + TypeScript + Tailwind) and
**`backend/`** (FastAPI + PostgreSQL). This README covers Phase 0 and Phase 1
of the build plan — landing page live, backend connected to a real database.

---

## 1. Prerequisites

Install these once, before anything else:

- **Node.js** 20+ — https://nodejs.org (check with `node -v`)
- **Python** 3.11+ — https://python.org (check with `python3 --version`)
- **PostgreSQL** 16 — https://www.postgresql.org/download/
  - Windows/Mac: the installer includes everything you need
  - Mac (Homebrew): `brew install postgresql@16 && brew services start postgresql@16`
  - Ubuntu/WSL: `sudo apt install postgresql postgresql-contrib`
- **VS Code** with the **Python** and **ES7+ React/Redux/React-Native snippets**
  extensions (optional but helpful)

---

## 2. Backend setup (`backend/`)

Open a terminal **inside the `backend/` folder** for all of this.

### a) Create the database

Open `psql` (or a GUI tool like pgAdmin / TablePlus) and run:

```sql
CREATE USER acs_user WITH PASSWORD 'password';
CREATE DATABASE acs_db OWNER acs_user;
GRANT ALL PRIVILEGES ON DATABASE acs_db TO acs_user;
```

Use a real password if this is ever going near production — `password` is a
placeholder for local development only.

### b) Create a virtual environment and install dependencies

```bash
python3 -m venv venv

# Activate it — you'll need to do this every time you open a new terminal:
source venv/bin/activate        # Mac/Linux
venv\Scripts\activate           # Windows

pip install -r requirements.txt
```

### c) Configure environment variables

```bash
cp .env.example .env
```

Open `.env` and make sure `DATABASE_URL` matches what you created in step (a).

### d) Run the server

```bash
uvicorn app.main:app --reload
```

Visit **http://localhost:8000/api/health** — you should see
`{"status":"ok","environment":"development"}`. The `registrants` table is
created automatically on first startup.

Interactive API docs are auto-generated at **http://localhost:8000/docs**.

---

## 3. Frontend setup (`frontend/`)

Open a **second terminal**, inside the `frontend/` folder.

```bash
npm install
npm run dev
```

Visit **http://localhost:5173** — you should see the landing page. Calls from
the frontend to `/api/*` are automatically proxied to the backend on port
8000 (configured in `vite.config.ts`), so you don't need to worry about CORS
during local development.

---

## 4. Project structure

```
abuja-creative-showcase/
├── backend/
│   ├── app/
│   │   ├── main.py         # FastAPI app, CORS, health check
│   │   ├── config.py        # Settings (reads .env)
│   │   ├── database.py     # SQLAlchemy engine/session
│   │   └── models.py       # Registrant table definition
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── components/     # Header, Hero, sections, Footer
│   │   ├── pages/          # LandingPage, RegisterPage
│   │   ├── lib/content.ts  # All editable event copy lives here
│   │   ├── App.tsx         # Routes
│   │   └── index.css       # Brand colors, fonts, design tokens
│   └── package.json
└── README.md               # This file
```

**To change event copy** (dates, venue, FAQ answers, programme detail):
edit `frontend/src/lib/content.ts` — nothing else needs to change.

**To change brand colors:** edit the `--red` / `--gold` / `--teal` values in
`frontend/src/index.css`.

---

## 5. Where this stands vs. the full build plan

Done:
- **Phase 0** — brand colors set as design tokens; backend/database
  connected and verified
- **Phase 1** — landing page live: hero, about, programme, speaker/exhibitor
  teaser, sponsors, FAQ
- **Phase 6 (partial)** — `Registrant` database table defined and tested
  against a real Postgres database

Not built yet (next in the plan):
- **Phase 2** — category selection page
- **Phase 3** — the actual registration forms per category
- **Phase 4** — save-on-submit + reference number generation + email
- **Phase 5** — shared ticket-number lookup screen
- **Phase 7** — admin dashboard
- Everything from Phase 8 onward

---

## 6. Common issues

**`ModuleNotFoundError` when running uvicorn** — your virtual environment
isn't activated. Run the `source venv/bin/activate` command from step 2b
again (you need to do this every new terminal session).

**Frontend shows a blank page / import errors** — delete `node_modules` and
run `npm install` again.

**Backend can't connect to Postgres** — confirm Postgres is actually running
(`pg_isready` on Mac/Linux, or check Services on Windows), and that the
`DATABASE_URL` in `.env` matches the user/password/database you created.
