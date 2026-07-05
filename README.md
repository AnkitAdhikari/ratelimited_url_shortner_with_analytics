# Rate-Limited URL Shortener

### Live link: https://3-6-177-143.sslip.io/

A URL shortener with a custom rate limiter and a click-analytics dashboard. TypeScript end to end — Express on the back, React + Vite on the front, Postgres for storage, all in a single pnpm workspace.

Two things I actually cared about building here:

- **A rate limiter I wrote myself** instead of reaching for `express-rate-limit`, with the algorithm and the storage kept behind interfaces so either can be swapped later.
- **A shortener** that turns a long URL into a 6-character alias and redirects on the way back out, recording a click each time so the dashboard has something to chart.

## Stack

- **Backend** — Node 20+, Express 5, TypeScript (ESM), Sequelize + Postgres, Zod, Pino, Swagger UI (OpenAPI generated from JSDoc)
- **Frontend** — React 18, Vite, Ant Design 6, Chart.js
- **Tooling** — pnpm workspace, Docker / Compose, Caddy for TLS in prod, ESLint + Prettier

## How it works

### Shortening

`POST /api/urls?longURL=<url>` creates a short link. The alias is just the row's primary key encoded in base62 and left-padded to 6 characters, which I generate inside a transaction: insert the row to get its id, encode that id, then write the alias back. Six base62 characters cover ~56 billion links, which is plenty for this.

It's idempotent. If the same long URL was shortened before, you get the existing alias back with a `200` instead of a duplicate row — a brand-new one comes back as `201`.

Validation runs on both ends. Zod checks the URL is well-formed, and a second check refuses to shorten a link that points back at the shortener's own host, because that only ever produces a redirect loop. Same rule lives in the client so you get the error before the request even leaves the browser.

One tradeoff I'm aware of: the aliases are sequential, so they're enumerable. For an anonymous shortener that's acceptable. If it mattered I'd move to a hash with collision resolution (and probably a bloom filter to keep the existence check off the disk) — the base62 function is isolated enough to swap without touching the controller.

### Redirecting

`GET /:alias` is a catch-all resolver: it looks up the alias, records a click (IP + timestamp), and issues a `302` to the original URL. It's mounted last so it never shadows `/api/*`, `/live`, or `/docs`. The redirect is deliberately a `302` and not a `301` — a cached permanent redirect would swallow every click after the first, and then the analytics would be lying.

### Rate limiting

A fixed-window counter, keyed on client IP, applied to the create endpoint. Default is 5 requests per 60 seconds, both configurable.

I went with fixed-window on purpose and I know its weak spot: a client can fire `max` requests at the tail of one window and `max` more at the head of the next, so you can see up to 2× the limit across a boundary. That's the price for how cheap and simple it is to reason about.

Two things sit behind interfaces so this isn't a dead end:

- `RateLimitStrategy` — the algorithm itself. A sliding-window version can drop in later without the middleware noticing.
- `RateLimitStore` — the backing store. It's an in-memory `Map` today (with a background sweep that evicts expired windows), and the interface is shaped to match Redis for when more than one instance needs to share counters.

Every response carries the usual `X-RateLimit-*` headers, and a `429` includes `Retry-After`. The frontend reads that header to run a live countdown and keep the form disabled until the window resets, instead of letting you hammer a button that'll only bounce.

### Analytics

Every redirect writes a row into `clicks` — which URL, the IP, and when. The dashboard then asks for a 7-day daily series, either for one alias or across everything.

The series is built in SQL with `generate_series` and a `LEFT JOIN`, so days with no clicks still come back as zero rather than dropping out of the result set — otherwise the chart would have holes in it instead of flat spots. The raw query uses bind parameters, not string interpolation, so it isn't an injection hole.

## API

| Method | Path                         | What it does                                                                                    |
| ------ | ---------------------------- | ----------------------------------------------------------------------------------------------- |
| `POST` | `/api/urls?longURL=<url>`    | Create a short URL. Rate limited. `201` when new, `200` when the long URL already had an alias. |
| `GET`  | `/api/urls`                  | List every short URL with its total click count, newest first.                                  |
| `GET`  | `/api/urls/:alias/analytics` | 7-day daily click series for a single alias.                                                    |
| `GET`  | `/api/analytics/overview`    | 7-day daily click series aggregated across all URLs.                                            |
| `GET`  | `/:alias`                    | Resolve an alias — records a click and `302`-redirects to the original URL.                     |
| `GET`  | `/live`                      | Liveness probe.                                                                                 |

Interactive docs live at `/docs` (Swagger UI); the raw OpenAPI spec is at `/docs.json`.

## Running locally

You'll need Node 20+, pnpm, and a Postgres you can reach.

**1. Install everything from the repo root:**

```bash
pnpm install
```

**2. Start Postgres** — any instance works. The one I used:

```bash
docker run --name rlus-postgres \
  -e POSTGRES_USER=root -e POSTGRES_PASSWORD=root -e POSTGRES_DB=rlus \
  -p 5432:5432 -v pgdata:/var/lib/postgresql/data -d postgres:16
```

**3. Backend env** — create `backend/.env`:

```env
PORT=3000
PUBLIC_BASE_URL=http://localhost:3000
DATABASE_URL=postgres://root:root@localhost:5432/rlus
CORS_ORIGIN=http://localhost:5173
RATE_LIMIT_MAX_REQUESTS=5
RATE_LIMIT_WINDOW_SECONDS=60
```

**4. Frontend env:**

```bash
cp frontend/.env.example frontend/.env   # defaults to http://localhost:3000
```

**5. Run both:**

```bash
pnpm --filter @rlus/backend dev    # API on http://localhost:3000
pnpm --filter @rlus/frontend dev   # UI  on http://localhost:5173
```

On boot the backend runs `sequelize.sync({ alter: true })`, so it creates and reconciles the tables for you — no migration step to run. That's a development convenience and it's flagged in the code for removal in favour of real migrations before this goes anywhere production-shaped.

## Running with Docker

**Local full stack** — Postgres, the API on `:3000`, and the built frontend behind nginx on `:80`:

```bash
cp .env.example .env      # POSTGRES_USER / POSTGRES_PASSWORD / POSTGRES_DB
docker compose up --build
```

**Production stack** (`docker-compose.prod.yml`) puts everything behind a single origin and adds Caddy for automatic TLS. nginx serves the compiled frontend and proxies `/api`, the short links, and `/docs` back to the API, so there's no CORS to deal with. Point `SITE_ADDRESS` at your host (the example uses an [sslip.io](https://sslip.io) name derived from an EC2 IP) and:

```bash
docker compose -f docker-compose.prod.yml up -d --build
```

## Configuration

**Backend**

| Variable                    | Required | Default                 | Notes                                   |
| --------------------------- | -------- | ----------------------- | --------------------------------------- |
| `PUBLIC_BASE_URL`           | yes      | —                       | Base of the generated short links.      |
| `DATABASE_URL`              | yes      | —                       | Postgres connection string.             |
| `PORT`                      | no       | `3000`                  |                                         |
| `CORS_ORIGIN`               | no       | `http://localhost:5173` | Browser origin allowed to call the API. |
| `RATE_LIMIT_MAX_REQUESTS`   | no       | `5`                     | Requests allowed per window.            |
| `RATE_LIMIT_WINDOW_SECONDS` | no       | `60`                    | Window length in seconds.               |
| `NODE_ENV`                  | no       | `development`           |                                         |

**Frontend**

| Variable            | Default                 | Notes                                 |
| ------------------- | ----------------------- | ------------------------------------- |
| `VITE_API_BASE_URL` | `http://localhost:3000` | API base URL, baked in at build time. |

**Compose** (`.env` at the repo root)

| Variable                                              | Notes                                              |
| ----------------------------------------------------- | -------------------------------------------------- |
| `POSTGRES_USER` / `POSTGRES_PASSWORD` / `POSTGRES_DB` | Database credentials.                              |
| `SITE_ADDRESS`                                        | Prod only — public hostname Caddy gets a cert for. |

## Project layout

```
backend/
  src/
    controllers/   # request handlers (url, redirect, analytics, health)
    routes/        # one router per area, wired up in routes/index.ts
    ratelimit/     # strategy + store interfaces, fixed-window implementation
    middleware/    # rate limiter, error handler
    validations/   # zod schemas + validate() wrapper
    services/      # the raw-SQL daily-clicks query
    db/            # sequelize client + Url / Click models
    docs/          # swagger setup
    utils/         # base62, error types
frontend/
  src/
    features/
      creator/     # shorten form, client-side validation, rate-limit countdown
      dashboard/   # URL table + 7-day clicks chart
    api/           # fetch wrappers
    providers/     # antd theme (Grepsr brand font/colour)
docker-compose.yml        # local full stack
docker-compose.prod.yml   # + Caddy/TLS, single origin
```

On the frontend I stuck with the plain `fetch` API rather than a data-fetching library. For this surface area the caching and invalidation machinery would've been more config than it saved.
