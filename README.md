# Arrow Saga — Drone Fleet Simulation

Arrow Saga is a drone fleet simulation project focused on visualizing drone positions, movement, and telemetry through a web-based dashboard.

## Tech Stack

- React
- Vite
- CesiumJS — 3D globe and geospatial visualization
- Deck.gl — geospatial data visualization layers
- Lucide React — interface icons

## Prerequisites

- Node.js and npm
- Git

## Getting Started

### 1. Clone the repository

```bash
git clone --branch integerate https://github.com/lokeshsenthilkumarl2008-cmyk/AeroSaga.git
cd AeroSaga
```

### 2. Install dependencies

```bash
npm install
```

### 3. Start the development server

```bash
npm run dev
```

Open the local URL printed in your terminal.

### 4. Build for production

```bash
npm run build
```

### 5. Run lint checks

```bash
npm run lint
```

## Project Structure

- `src/` — React application source code
- `public/` — Static assets
- `index.html` — Vite application entry point
- `vite.config.js` — Vite configuration
- `package.json` — Dependencies and npm scripts

## Development Notes

- Do not commit `node_modules/`, build output, or environment secrets.
- Keep simulation data and telemetry clearly separated from future live-drone integrations.
- Coordinate changes to shared files with the team to reduce merge conflicts.

## Backend

The Spring Boot API runs on port `8080` and uses PostgreSQL. Create the `aerosaga_db` database, then provide database credentials through `DB_USERNAME` and `DB_PASSWORD`. `DATABASE_URL` can override the default JDBC URL. The password must be set: PostgreSQL SCRAM authentication fails when `DB_PASSWORD` is empty.

From the repository root, run the API with:

```bash
./mvnw spring-boot:run
```

On Windows, use `mvnw.cmd spring-boot:run`.

In PowerShell, set the credentials in the same terminal before starting the API:

```powershell
$env:DB_USERNAME = "postgres"
$env:DB_PASSWORD = "<your PostgreSQL password>"
mvnw.cmd spring-boot:run
```

The dashboard reads drone, mission, telemetry, and workflow-signal records from the backend. It can register drones, create and start missions, and show persisted workflow progress. By default, Temporal runs in a local in-memory development environment; its execution history is not durable across backend restarts. For durable workflows, run a Temporal server and set `SPRING_PROFILES_ACTIVE=external-temporal` and `TEMPORAL_TARGET=localhost:7233`. Map positions, speed, and heading use simulated values until a telemetry producer posts real readings.

Telemetry producers can submit readings with `POST /api/telemetry/drone/{droneId}` using `batteryLevel`, `latitude`, `longitude`, and `altitude`. Mission workflows are started with `POST /api/missions/{id}/execute`; workflow activity records are available from `/api/workflow-signals`.

## Project Status

The integration branch combines the dashboard, Temporal workflow, telemetry, workflow-signal, and PostgreSQL drone and mission APIs. Map positions use stored telemetry when available and simulation placeholders otherwise.






# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and Oxlint's TypeScript related rules in your project.
