# CI/CD setup guide (GitHub Actions + Vercel + Neon)

This template implements the GG Software deployment standard:

```
PR open      → CI (lint, typecheck, tests, build, security, CodeQL)
                + Vercel preview deploy (automatic via Git integration)
                + Neon branch per PR (migration rehearsal + test DB)
                + E2E smoke against the preview URL
merge→staging→ migrate Neon staging branch → prebuilt Vercel deploy → smoke test
merge→main   → approval gate → migrate Neon primary → prebuilt Vercel deploy → smoke test
PR closed    → Neon preview branch deleted
```

Everything in this template runs on **free tiers** except where marked ⚠️ below.

## Free vs paid — honest summary

| Piece                                                     | Free? | Notes                                                                                                                                                                                                                         |
| --------------------------------------------------------- | ----- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| GitHub Actions (private repos)                            | ✅    | ~2000 free minutes/month on the org's Free plan; this pipeline is ~5–8 min per PR                                                                                                                                             |
| GitHub environments, branch rulesets, CODEOWNERS          | ✅    |                                                                                                                                                                                                                               |
| CodeQL, Dependabot, actionlint, zizmor, gitleaks (binary) | ✅    | gitleaks is run as a pinned binary because the _action_ requires a paid license for orgs — the binary is MIT                                                                                                                  |
| Vitest, Playwright                                        | ✅    |                                                                                                                                                                                                                               |
| Neon Free plan                                            | ✅    | commercial use allowed; limits (storage/compute hours) apply per project — one Neon project per client app keeps you inside them                                                                                              |
| Vercel Hobby                                              | ⚠️    | free plan exists but **commercial client work is against its ToS** — client projects need Vercel Pro ($20/user/mo). The workflows here work on both; Pro additionally unlocks a real `staging` Custom Environment (see below) |
| AI code review (Copilot / CodeRabbit)                     | ⚠️    | Copilot code review needs Copilot seats; CodeRabbit is free for public repos only. `.coderabbit.yaml` is committed and ready if/when you enable either                                                                        |

## One-time setup per client repo

### 1. Branches

- `main` — production. Protected (step 6). If the repo was created with a `master` branch, rename it to `main` first (Settings → Branches → rename; open PRs are retargeted automatically).
- `staging` — staging environment. Create it: `git branch staging main && git push origin staging`. Protected (step 6).
- Feature work → PR into `staging`; `staging` → PR into `main`.

### 2. Neon project

1. Create one Neon project per client app (isolates billing and blast radius).
2. The **primary branch** = production DB. Create a persistent branch named **`staging`**.
3. Note connection strings (both **direct**, `-direct` hostnames — migrations must bypass PgBouncer):
   - primary → `PROD_DATABASE_URL`
   - `staging` branch → `STAGING_DATABASE_URL`
4. Runtime (app) connections use the **pooled** URLs — set those in Vercel (step 3).
5. Optional but recommended: install the Neon Vercel integration so PR previews get a database branch automatically. Do **not** hard-code `DATABASE_URL` in the Vercel project's Preview env if you do this (a hard-coded variable overrides the integration's per-preview URL).

### 3. Vercel project

1. Create the project, link it to this GitHub repo (Framework: Next.js, detected automatically).
2. Env vars (Production and Preview environments):
   - `DATABASE_URL` = **pooled** runtime connection string for that environment (production primary / staging branch)
   - any other app secrets per environment
3. The committed `vercel.json` disables Vercel's own deployments for `main` and `staging` — GitHub Actions owns those (migrations must run before the code goes live). PR previews stay automatic.
4. Optional: a custom staging domain (e.g. `staging.client.cz`) → store just the hostname in the `STAGING_DOMAIN` secret; the staging workflow aliases every deploy to it.
5. If you have Pro: create a Custom Environment named `staging` (branch rule: `staging`), set its env vars/domain, and change `VERCEL_STAGING_TARGET` in `.github/workflows/deploy-staging.yml` from `preview` to `staging`.

### 4. GitHub secrets

| Secret                            | Scope                         | Value                                                                           |
| --------------------------------- | ----------------------------- | ------------------------------------------------------------------------------- |
| `NEON_API_KEY`                    | repo                          | Neon API key (minimal access)                                                   |
| `NEON_PROJECT_ID`                 | repo                          | Neon project id                                                                 |
| `VERCEL_TOKEN`                    | `staging` + `production` envs | Vercel token scoped to the team                                                 |
| `VERCEL_ORG_ID`                   | `staging` + `production` envs | from Vercel project settings                                                    |
| `VERCEL_PROJECT_ID`               | `staging` + `production` envs | from Vercel project settings                                                    |
| `PROD_DATABASE_URL`               | `production` env              | Neon primary **direct** URL                                                     |
| `STAGING_DATABASE_URL`            | `staging` env                 | Neon `staging` branch **direct** URL                                            |
| `STAGING_DOMAIN`                  | `staging` env                 | optional, e.g. `staging.client.cz`                                              |
| `SLACK_WEBHOOK_URL`               | `staging` + `production` envs | optional deploy notifications                                                   |
| `VERCEL_PROTECTION_BYPASS_SECRET` | repo                          | optional; lets E2E test private previews while keeping Deployment Protection on |

Production secrets live in the `production` GitHub environment, so a PR-triggered workflow can never read them until a human approves the deployment.

### 5. Run the bootstrap script

```bash
gh auth login   # once
./scripts/bootstrap-github.sh
```

It creates the `staging`/`production` environments, sets branch-allow policies, and installs the branch ruleset (required PR, 1 approval, required checks `lint`, `typecheck`, `test`, `build`, `security`, up-to-date branches). Secrets from step 4 it can set for you if exported as env vars first — see the script header.

### 6. Remaining UI clicks (script can't or shouldn't do these)

- Settings → Environments → `production` → **Required reviewers** (add the client's responsible devs; 1 approval suffices).
- Settings → Environments → `production`/`staging` → add the secrets from step 4 (or via `gh secret set ... --env production`).
- Organization → Settings → Code security → enable **secret scanning + push protection** (free for public repos; on private repos enable what your plan allows — gitleaks in CI covers you either way).
- AI review: enable Copilot code review (repo Settings → Copilot → Code review) if you have seats, and/or install CodeRabbit — `.coderabbit.yaml` is already committed. AI is a _second_ reviewer only; branch rulesets still require one human approval.

### 7. Verify

1. Open a PR → CI goes green, Vercel preview URL appears, `e2e` job runs against it, Neon branch `pr-<n>` exists.
2. Merge to `staging` → deploy workflow runs: migrate → deploy → smoke.
3. PR `staging` → `main`, merge → production workflow **waits for approval** → migrate → deploy → smoke.
4. Close the PR → Neon branch disappears.

## How the pieces fit (implementation notes)

- **Migration safety**: migrations are generated locally (`pnpm db:migrate:dev`), committed, and applied in CI (`prisma migrate deploy`) against the **direct** (unpooled) connection — PgBouncer's transaction mode breaks DDL. The PR `test` job applies them to a throwaway Neon branch first (real rehearsal) and fails on schema drift. Write migrations **expand/contract**: additive change → deploy → remove usage → drop column in a later release.
- **Prebuilt deploys**: `vercel pull → vercel build → vercel deploy --prebuilt` means the exact artifact tested in CI is what goes live, and Vercel never races us with its own build for `main`/`staging`.
- **Rollback**: `npx vercel rollback <deployment-url> --token=$VERCEL_TOKEN` (the production workflow prints the exact command in its summary on failure).
- **Smoke tests** hit `/api/health` (liveness probe with optional `?db=1` database check) — extend that route if a client project has cheap readiness signals.
- **Action pinning**: all third-party actions are pinned to commit SHAs; Dependabot opens PRs against the version comments. The workflow files themselves are linted by actionlint + zizmor on every PR.
- **Node version**: `.nvmrc` pins it for CI and Vercel alike; keep them in sync when bumping.

## Rolling this out to a new client repo

1. Clone this template, rename, push to the new repo under `ggsoftware-cz`.
2. Follow "One-time setup per client repo" above (≈30 min once you have the accounts).
3. Adjust: CODEOWNERS team, staging domain, Vercel/Neon project, secrets, required reviewers.
4. Optional later: extract the workflows into a `ggsoftware-cz/.github` repo as reusable workflows (`workflow_call`) so client repos hold ~15-line callers instead of copies — the job names (`lint`, `typecheck`, `test`, `build`, `security`, `e2e`) are deliberately identical across repos to make that migration and branch-protection templates painless.

## Optional upgrades (not enabled by default)

- **size-limit** bundle budget comment on PRs
- **Lighthouse CI + axe-core** against the preview URL (perf/a11y budget for marketing sites)
- **Terraform/gh script** full codification of repo settings
