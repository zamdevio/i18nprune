#!/bin/bash

# Git sync script for content/ folder changes
# Commits changes with minimal but descriptive messages

cd "$(dirname "$0")/.." || exit 1

# Check if content/ directory exists
if [ ! -d "content" ]; then
  echo "⚠️  content/ directory not found, skipping git sync"
  exit 0
fi

# Check if we're in a git repository
if ! git rev-parse --git-dir > /dev/null 2>&1; then
  echo "⚠️  Not a git repository, skipping git sync"
  exit 0
fi

# Check if content/ is untracked
if ! git ls-files --error-unmatch content/ > /dev/null 2>&1; then
  echo "📦 Adding content/ to git..."
  git add content/
fi

# Check if there are any changes (including untracked files)
if git diff --quiet content/ && git diff --cached --quiet content/ && [ -z "$(git ls-files --others --exclude-standard content/)" ]; then
  echo "✓ No changes in content/ to commit"
  exit 0
fi

# Stage all content/ changes (including new files)
git add content/

# Count changes for commit message
CHANGED_FILES=$(git diff --cached --name-only content/ | wc -l)
CHANGED_FILES=${CHANGED_FILES// /}

if [ "$CHANGED_FILES" -eq 0 ]; then
  echo "✓ No changes to commit"
  exit 0
fi

# Generate commit message
if [ "$CHANGED_FILES" -eq 1 ]; then
  COMMIT_MSG="docs: sync content files"
else
  COMMIT_MSG="docs: sync content files ($CHANGED_FILES files)"
fi

# Commit changes
if git commit -m "$COMMIT_MSG" > /dev/null 2>&1; then
  echo "✓ Committed $CHANGED_FILES file(s): $COMMIT_MSG"
else
  echo "⚠️  Failed to commit changes (may already be committed)"
fi

