#!/usr/bin/env bash
set -euo pipefail

BASE_BRANCH="${1:-main}"
WORK_BRANCH="${2:-work}"

if ! git rev-parse --verify "$BASE_BRANCH" >/dev/null 2>&1; then
  echo "[sync] base branch '$BASE_BRANCH' not found locally."
  exit 1
fi

current_branch="$(git rev-parse --abbrev-ref HEAD)"

if git remote get-url origin >/dev/null 2>&1; then
  echo "[sync] fetching origin..."
  git fetch origin
  echo "[sync] updating $BASE_BRANCH from origin/$BASE_BRANCH"
  git checkout "$BASE_BRANCH" >/dev/null
  git reset --hard "origin/$BASE_BRANCH" >/dev/null
else
  echo "[sync] no origin remote configured; using local '$BASE_BRANCH' as source of truth."
fi

if [[ "$current_branch" != "$WORK_BRANCH" ]]; then
  echo "[sync] switching back to '$WORK_BRANCH'"
fi

if ! git rev-parse --verify "$WORK_BRANCH" >/dev/null 2>&1; then
  echo "[sync] work branch '$WORK_BRANCH' not found; creating from '$BASE_BRANCH'."
  git checkout -b "$WORK_BRANCH" "$BASE_BRANCH" >/dev/null
else
  git checkout "$WORK_BRANCH" >/dev/null
  echo "[sync] rebasing '$WORK_BRANCH' onto '$BASE_BRANCH'"
  git rebase "$BASE_BRANCH"
fi

echo "[sync] done. HEAD=$(git rev-parse --short HEAD) branch=$(git rev-parse --abbrev-ref HEAD)"
