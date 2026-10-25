## What & why

<!-- What does this PR change and why? Link the issue/task if there is one. -->

## Checklist

- [ ] Changes are covered by tests (unit in `tests/unit`, E2E in `tests/e2e` if user-facing)
- [ ] Database changes use a committed migration (`pnpm db:migrate:dev`) and are expand/contract-safe
- [ ] No secrets or `.env` files committed
- [ ] Staging verified if the change is risky (deploy `staging` branch first)
