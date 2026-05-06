#!/usr/bin/env bash
set -euo pipefail

BASE_BRANCH="${1:-main}"
FEATURE_BRANCH="${2:-}"

if [[ -z "$FEATURE_BRANCH" ]]; then
  echo "usage: $0 <base-branch> <feature-branch>"
  echo "example: $0 main feature/dashboard-ui"
  exit 1
fi

if git remote get-url origin >/dev/null 2>&1; then
  echo "[branch] fetching origin"
  git fetch origin
fi

if git show-ref --verify --quiet "refs/heads/$BASE_BRANCH"; then
  git checkout "$BASE_BRANCH" >/dev/null
  if git remote get-url origin >/dev/null 2>&1; then
    git rebase "origin/$BASE_BRANCH"
  fi
else
  if git remote get-url origin >/dev/null 2>&1; then
    git checkout -b "$BASE_BRANCH" "origin/$BASE_BRANCH" >/dev/null
  else
    echo "[branch] base branch '$BASE_BRANCH' not found locally and no origin configured"
    exit 1
  fi
fi

if git show-ref --verify --quiet "refs/heads/$FEATURE_BRANCH"; then
  echo "[branch] branch '$FEATURE_BRANCH' already exists"
  exit 1
fi

git checkout -b "$FEATURE_BRANCH" "$BASE_BRANCH" >/dev/null

echo "[branch] created '$FEATURE_BRANCH' from '$BASE_BRANCH'"
echo "[branch] now commit only this task here and open PR with base '$BASE_BRANCH'"
