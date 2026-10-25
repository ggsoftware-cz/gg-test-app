# Deployment — Cloudflare Pages

This project deploys to **Cloudflare Pages** as a direct-upload project named
`gg-test-app`, deployed from `main`.

- Production URL: https://gg-test-app.pages.dev
- Repo: https://github.com/ggsoftware-cz/gg-test-app

## Current pipeline (2026-10-25)

1. Push to `main` as usual (CI runs lint/typecheck/test/build/security).
2. The **auto-deploy watcher** (scheduled job on the GG assistant machine,
   every 15 min) detects the new commit, builds with
   `@cloudflare/next-on-pages` and deploys with `wrangler pages deploy`
   using its own OAuth — no secrets in the repo.
3. The watcher posts the deployment SHA and a health-check result
   (`/api/health` must return `{"status":"ok"}`).

Manual deploy from a machine with `wrangler` OAuth:

```sh
pnpm install --frozen-lockfile
pnpm exec prisma generate
npx @cloudflare/next-on-pages@latest
wrangler pages deploy .vercel/output/static --project-name=gg-test-app --branch=main
```

## Upgrading to a GitHub-native pipeline (optional)

Two equivalent options, both need one owner action:

- **Cloudflare Git integration** (no secrets at all): approve the pending
  "Cloudflare Workers and Pages" GitHub App request for the org
  (github.com/organizations/ggsoftware-cz/settings/installations), then
  recreate the Pages project as Git-connected. Because the project is
  direct-upload today, that means deleting and recreating it in the
  dashboard first.
- **GitHub Actions + API token**: create a custom API token
  (Account → Cloudflare Pages → Edit), store it as the repo secret
  `CLOUDFLARE_API_TOKEN` (plus `CLOUDFLARE_ACCOUNT_ID`), then add
  `.github/workflows/deploy-pages.yml` with a `push: branches: [main]`
  trigger using `cloudflare/wrangler-action@v3`.

## Cloudflare Pages project settings (reference)

| Setting            | Value                                                                                                                  |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------- |
| Production branch  | `main`                                                                                                                 |
| Build command      | `npx pnpm install --frozen-lockfile && npx pnpm exec prisma generate && npx @cloudflare/next-on-pages@latest`          |
| Build output       | `.vercel/output/static`                                                                                                |
| Environment        | `NODE_VERSION` = `22`                                                                                                  |
| Compatibility flag | `nodejs_compat` (current Pages defaults already served this build correctly — set explicitly only if behavior differs) |

`@cloudflare/next-on-pages` runs its own `next build` internally, so the
build command must generate the Prisma client first but must NOT run
`pnpm build`.

## Template changes for Cloudflare (vs. the Vercel-oriented template)

- `app/api/health/route.ts` exports `runtime = "edge"` — required by
  next-on-pages for every non-static route.
- Vercel/Neon GitHub workflows were removed
  (`deploy-production.yml`, `deploy-staging.yml`, `e2e-preview.yml`,
  `cleanup-neon-preview.yml`); `ci.yml` (lint/typecheck/test/build/security)
  and `codeql.yml` remain — the Neon-dependent steps skip gracefully without
  secrets.
- The `?db=1` health probe uses the node-postgres driver, which cannot open
  TCP sockets on the Workers runtime. Without `DATABASE_URL` the base health
  check still returns `{"status":"ok"}`; `?db=1` degrades gracefully. To make
  DB checks work on Cloudflare, switch to `@prisma/adapter-neon` (HTTP
  transport) + Hyperdrive or a Neon connection string, set as a Pages
  environment variable.
