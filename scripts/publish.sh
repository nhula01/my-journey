#!/bin/sh
set -eu
cd "$(dirname "$0")/.."
gh auth status >/dev/null 2>&1 || {
  echo 'Sign in first with: gh auth login'
  exit 1
}
owner=$(gh api user --jq .login)
repo="$owner/my-journey"
if gh repo view "$repo" >/dev/null 2>&1; then
  echo "Repository $repo already exists. Review it before adding a remote and pushing."
  exit 1
fi
git add site scripts README.md .gitignore .github/workflows/pages.yml
if ! git diff --cached --quiet; then
  git commit -m 'Create My Journey health and piano journal'
fi
gh repo create "$repo" --public --source=. --remote=origin --push
gh api --method POST "repos/$repo/pages" -f build_type=workflow
gh workflow run pages.yml --repo "$repo"
echo "Deployment started. Check: gh run list --repo $repo"
echo "Expected website: https://$owner.github.io/my-journey/"
