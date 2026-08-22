# Contribution Guidelines

Welcome to DGC Chakshu. This document covers how we work as a team on this repository.

## Branching Model

```
main   → always stable, deploy/demo-ready
dev    → integration branch, all work merges here first
feature/xyz → your individual task branch, created from dev
```

- Never push directly to `main` or `dev` — both are protected.
- Always branch off the latest `dev`:
  ```bash
  git checkout dev
  git pull origin dev
  git checkout -b feature/short-task-name
  ```
- `main` only receives merges from `dev`, done by the project lead when a release is ready.

## Branch naming

Use a prefix that describes the type of work:

| Prefix | Use for |
|---|---|
| `feature/` | New functionality |
| `fix/` | Bug fixes |
| `docs/` | Documentation-only changes |
| `refactor/` | Code cleanup, no behavior change |

Example: `feature/department-directory-page`

## Commit messages

Keep them short and descriptive, using this style:

```
feat: add search bar to homepage
fix: department API returning 500 on missing id
docs: update API reference for /rooms endpoint
refactor: extract room card into reusable component
```

## Pull Requests

1. Push your feature branch and open a PR on GitHub.
2. **Set the base branch to `dev`** — this does not happen automatically, check it before submitting.
3. Give the PR a clear title and a short description: what you built, how to test it.
4. At least one approval is required before merging.
5. Don't merge your own PR unless you're the reviewer assigned to it.
6. Resolve merge conflicts locally before requesting review, where possible.

## Code style

- Controllers stay thin: validate → call service → return response (see `docs/api.md` for the standard response format).
- Reusable UI goes in `client/src/components/`, page-level components in `client/src/pages/`.
- No hardcoded secrets, API keys, or credentials — use `.env` and `.env.example`.
- Keep PRs focused on one task. Large, unrelated changes in a single PR slow down review.

## Data & privacy rules

Since this project uses real campus and faculty data:

- Never commit personal phone numbers or private emails.
- Faculty data must be limited to approved, public-facing professional information.
- Images must be original, authorized, or properly licensed.
- If you're unsure whether a piece of information is safe to include, ask the Data & Content team before merging.

## Getting a task

- Check the [Issues tab](../../issues) for open tasks.
- Comment on an issue to claim it before starting work, so two people don't duplicate effort.
- If you're doing something not yet listed as an issue, open one first with a short description.

## Questions

Ask in the team group chat with:
1. What you were trying to do
2. The exact error message (if any)
3. A screenshot, if relevant

This helps get you unblocked faster than a vague "it's not working."
