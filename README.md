# GG Software — project template

Next.js + Prisma + PostgreSQL (Neon) template with the company CI/CD standard
pre-wired: GitHub Actions quality gates on every PR, staged deploys through
Vercel, branch-isolated databases on Neon, formatting and pre-commit hooks,
env validation, and production-ready Docker setup.

**Read [`docs/CI.md`](docs/CI.md) before the first deploy — it explains the
whole pipeline, required secrets, and the per-repo setup checklist.**

## Pipeline at a glance

```
PR open      → CI: lint, format, typecheck, tests, build, security + CodeQL
                + Vercel preview + E2E smoke + Neon branch per PR
merge→staging→ migrate Neon staging → prebuilt Vercel deploy → smoke test
merge→main   → approval gate → migrate Neon primary → Vercel prod → smoke test
```

## Local development

```bash
pnpm install                 # also installs lefthook git hooks
cp .env.example .env         # local DATABASE_URL
docker compose up -d         # Postgres 17 on localhost:5432 (with healthchecks)
pnpm db:migrate:dev          # apply migrations locally
pnpm dev
```

`http://localhost:3000/api/health` is the liveness probe (add `?db=1` to also
verify the database connection). It is used by CI smoke tests, Docker
HEALTHCHECK and uptime monitors.

## Scripts

| Script                                            | What it does                                                          |
| ------------------------------------------------- | --------------------------------------------------------------------- |
| `pnpm dev`                                        | dev server                                                            |
| `pnpm lint` / `pnpm format` / `pnpm format:check` | ESLint / Prettier write / check                                       |
| `pnpm typecheck`                                  | `tsc --noEmit`                                                        |
| `pnpm test` / `pnpm test:watch`                   | unit + component tests (Vitest)                                       |
| `pnpm test:e2e`                                   | E2E tests (Playwright; runs against `E2E_BASE_URL` or localhost:3000) |
| `pnpm build`                                      | `prisma generate` + `next build`                                      |
| `pnpm db:migrate`                                 | apply committed migrations (`prisma migrate deploy`)                  |
| `pnpm db:migrate:dev`                             | create/apply a migration locally, updates schema                      |

## What's wired in

- **Env validation** — `app/lib/env.ts` (zod) fails fast on missing/invalid vars; add new server variables there.
- **Prisma 7** — driver adapter (`@prisma/adapter-pg`) + singleton in `app/lib/db.ts`; generated client in `app/generated/prisma` (gitignored, created by `pnpm build`).
- **typedRoutes + security headers** — `next.config.ts`; CSP is deliberately per-project (see comment there).
- **Error/404 pages** — `app/error.tsx`, `app/not-found.tsx` (with a Sentry hook point).
- **Pre-commit** — lefthook runs Prettier + ESLint --fix on staged files (`lefthook.yml`).
- **Component tests** — jsdom via per-file `// @vitest-environment jsdom` docblock (see `tests/unit/heading.test.tsx`).
- **Docker** — multi-stage standalone build, non-root user, HEALTHCHECK; compose waits for a healthy Postgres.

## Conventions

- Never commit `.env` files; never hard-code `DATABASE_URL` in Vercel if the Neon integration manages previews.
- Schema changes always via committed migrations (`pnpm db:migrate:dev`), expand/contract style.
- CI job names (`lint`, `typecheck`, `test`, `build`, `security`, `e2e`) are part of the branch-protection ruleset — keep them stable across repos.
- All GitHub Actions are pinned by commit SHA; Dependabot maintains them.
