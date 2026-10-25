#!/usr/bin/env bash
# One-time GitHub setup for a repo created from this template.
#
# Requires: gh (authenticated), jq.
#
# Creates:
#   - `staging` and `production` environments (with branch allow-policies)
#   - a branch ruleset for main/staging: PR required, 1 approval,
#     required checks (lint, typecheck, test, build, security), up-to-date branches
#   - secrets, for any that are exported as env vars before running:
#       VERCEL_TOKEN VERCEL_ORG_ID VERCEL_PROJECT_ID
#       NEON_API_KEY NEON_PROJECT_ID
#       PROD_DATABASE_URL STAGING_DATABASE_URL STAGING_DOMAIN
#       SLACK_WEBHOOK_URL VERCEL_PROTECTION_BYPASS_SECRET
#
# Not automated (do once in the UI, see docs/CI.md):
#   - production environment required reviewers
#   - environment secrets not exported here
#   - AI code review enablement
set -euo pipefail

command -v gh >/dev/null || { echo "ERROR: install and authenticate the GitHub CLI first (gh auth login)"; exit 1; }
command -v jq >/dev/null || { echo "ERROR: jq is required"; exit 1; }

REPO=$(gh repo view --json nameWithOwner --jq .nameWithOwner)
echo "==> Configuring $REPO"

# --- Environments -----------------------------------------------------------
for env in staging production; do
  gh api -X PUT "/repos/$REPO/environments/$env" \
    --input - <<< '{"deployment_branch_policy":{"protected_branches":false,"custom_branch_policies":true}}' >/dev/null
  # Only the matching branch may deploy to this environment.
  branch=$env; [ "$env" = production ] && branch=main
  gh api -X POST "/repos/$REPO/environments/$env/deployment-branch-policies" \
    --input - <<< "{\"name\":\"$branch\"}" >/dev/null
  echo "    environment '$env' ready (deploys only from '$branch')"
done

# --- Branch ruleset ---------------------------------------------------------
RULESET="GG Software: protect main & staging"
existing=$(gh api "/repos/$REPO/rulesets" --jq ".[] | select(.name == \"$RULESET\") | .id" || true)
if [ -n "$existing" ]; then
  echo "    ruleset already exists (id $existing) — skipping"
else
  gh api -X POST "/repos/$REPO/rulesets" --input - >/dev/null <<'JSON'
{
  "name": "GG Software: protect main & staging",
  "target": "branch",
  "enforcement": "active",
  "conditions": {
    "ref_name": { "include": ["refs/heads/main", "refs/heads/staging"], "exclude": [] }
  },
  "rules": [
    {
      "type": "pull_request",
      "parameters": {
        "required_approving_review_count": 1,
        "dismiss_stale_reviews_on_push": true,
        "require_code_owner_review": false,
        "require_last_push_approval": false,
        "required_review_thread_resolution": true
      }
    },
    {
      "type": "required_status_checks",
      "parameters": {
        "required_status_checks": [
          { "context": "lint" },
          { "context": "typecheck" },
          { "context": "test" },
          { "context": "build" },
          { "context": "security" }
        ],
        "strict_required_status_checks_policy": true
      }
    },
    { "type": "deletion" },
    { "type": "non_fast_forward" }
  ]
}
JSON
  echo "    ruleset installed on main + staging"
fi

# --- Secrets (only those exported when the script runs) ---------------------
set_secret() { # set_secret <name> <scope: repo|environment> [env-name]
  local name=$1 scope=$2 env_name=${3:-$1}
  if [ -n "${!env_name:-}" ]; then
    if [ "$scope" = repo ]; then
      gh secret set "$name" --body "${!env_name}"
    else
      gh secret set "$name" --env "$scope" --body "${!env_name}"
    fi
    echo "    secret '$name' set ($scope)"
  else
    echo "    secret '$name' NOT set (export \$$env_name to set it — see docs/CI.md)"
  fi
}

echo "==> Secrets"
set_secret NEON_API_KEY repo
set_secret NEON_PROJECT_ID repo
set_secret VERCEL_PROTECTION_BYPASS_SECRET repo
for e in staging production; do
  set_secret VERCEL_TOKEN "$e"
  set_secret VERCEL_ORG_ID "$e"
  set_secret VERCEL_PROJECT_ID "$e"
  set_secret SLACK_WEBHOOK_URL "$e"
done
set_secret STAGING_DATABASE_URL staging
set_secret STAGING_DOMAIN staging
set_secret PROD_DATABASE_URL production

cat <<EOF

==> Done. Remaining manual steps (docs/CI.md §6):
      1. Settings → Environments → production → Required reviewers
      2. Any secrets listed as NOT set above
      3. Optional: enable Copilot code review / CodeRabbit
EOF
