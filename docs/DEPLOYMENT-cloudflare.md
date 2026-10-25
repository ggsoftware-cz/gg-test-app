# Deployment — Cloudflare Pages

This project deploys to **Cloudflare Pages** with the native Git integration.
There is no separate CI deploy job: **every push to `main` is built and
deployed to production by Cloudflare**, and every PR / non-production branch
gets an automatic preview deployment.

- Production URL: https://gg-test-app.pages.dev
- Repo: https://github.com/ggsoftware-cz/gg-test-app

## Cloudflare Pages project settings

| Setting | Value |
| --- | --- |
| Production branch | `main` |
| Build command | `npx pnpm install --frozen-lockfile && npx pnpm exec prisma generate && npx @cloudflare/next-on-pages@latest` |
| Build output directory | `.vercel/output/static` |
| Environment variable | `NODE_VERSION` = `22` |
| Compatibility flag | `nodejs_compat` |
| Compatibility date | `2024-09-23` or newer |

`@cloudflare/next-on-pages` runs its own `next build` internally, so the build
command must generate the Prisma client first but must NOT run `pnpm build`.

## Template changes for Cloudflare (vs. the Vercel-oriented template)

- `app/api/health/route.ts` exports `runtime = "edge"` — required by
  next-on-pages for every non-static route.
- Vercel/Neon GitHub workflows were removed
  (`deploy-production.yml`, `deploy-staging.yml`, `e2e-preview.yml`,
  `cleanup-neon-preview.yml`); `ci.yml` (lint/typecheck/test/build) and
  `codeql.yml` remain — the Neon-dependent steps skip gracefully without
  secrets.
- The `?db=1` health probe uses the node-postgres driver, which cannot open
  TCP sockets on the Workers runtime. Without `DATABASE_URL` the base health
  check still returns `{"status":"ok"}`; `?db=1` degrades gracefully. To make
  DB checks work on Cloudflare, switch to `@prisma/adapter-neon` (HTTP
  transport) + Hyperdrive or a Neon connection string, set as a Pages
  environment variable.

## Daily flow

1. Commit and push to `main` → Cloudflare builds and deploys automatically
   (~2–4 min). Progress: dash.cloudflare.com → Workers & Pages → gg-test-app →
   Deployments.
2. PRs get a unique `*.pages.dev` preview URL per branch, posted in the PR
   checks.
3. Rollback: Deployments list → previous deployment → "Rollback to this
   deployment".
