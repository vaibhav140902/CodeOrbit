#!/usr/bin/env bash
set -euo pipefail

repo_root="$(git rev-parse --show-toplevel)"
cd "$repo_root"

disallowed=()

while IFS= read -r -d '' path; do
  case "$path" in
    *.example.json)
      continue
      ;;
  esac

  case "$path" in
    *serviceAccount*.json|*ServiceAccount*.json|*service-account*.json)
      disallowed+=("$path (service account credential)")
      ;;
    .next/*|*/.next/*)
      disallowed+=("$path (.next build artifact)")
      ;;
    .turbo/*|*/.turbo/*)
      disallowed+=("$path (.turbo cache)")
      ;;
    *.tsbuildinfo)
      disallowed+=("$path (TypeScript build artifact)")
      ;;
    *vite.config.ts.timestamp-*)
      disallowed+=("$path (Vite timestamp artifact)")
      ;;
    *.DS_Store)
      disallowed+=("$path (Finder metadata)")
      ;;
  esac
done < <(git ls-files -z)

if ((${#disallowed[@]} > 0)); then
  printf 'Repository hygiene check failed. Remove these tracked files:\n' >&2
  printf ' - %s\n' "${disallowed[@]}" >&2
  exit 1
fi

echo "Repository hygiene check passed."
