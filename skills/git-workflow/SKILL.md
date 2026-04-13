---
name: git-workflow
description: Git workflow conventions for this project including branch naming, pre-commit checks, commit message format, and amending commits. Use when working with git branches, preparing commits, or reviewing git history.
metadata:
  version: "1.1"
---

# Committing Changes

## Setup

In each new local checkout, install git hooks so `git commit` runs pre-commit:

```bash
pre-commit install
```

## Branch Naming

Create a branch before making changes:

```bash
git checkout -b <type>/<description>
```

| Type | Use for |
|------|---------|
| `feature/` | New features |
| `fix/` | Bug fixes |
| `refactor/` | Code refactoring |
| `docs/` | Documentation updates |

**Rules**: lowercase, hyphens only, no spaces or uppercase.

Examples: `feature/add-user-auth`, `fix/null-pointer-exception`

## Before Committing

Run pre-commit (runs all checks):

```bash
pre-commit run --all-files
```

**Never bypass hooks** to make a commit pass — no `--no-verify`, no `# type: ignore` / `# noqa` suppressions, no loosening rules.

**When hooks fail:**

1. Read the hook output — it names the file, rule, and what to change.
2. Fix that issue only, then run `pre-commit run --files` with the path(s) from the output.
3. Repeat until that passes, then run `pre-commit run --all-files` before you commit.

## Commit Message Format

```text
<type>(<scope>)!: <description>

<body>

<footer>
```

**Format rules**:

- **Type** (required): `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`
  - `feat` = new feature, `fix` = bug fix
- **Scope** (optional): noun in parentheses describing affected area, e.g., `fix(parser):`
- **!** (optional): indicates breaking change, placed before `:`
- **Description** (required): short summary immediately after `:`
- **Body** (optional): starts after blank line, free-form, explains what/why
- **Footer** (optional): starts after blank line, format `Token: value` or `Token #value`
  - Use `-` in token names (e.g., `Reviewed-by`), except `BREAKING CHANGE`

**Breaking changes**: Use `!` in prefix OR `BREAKING CHANGE:` footer (must be uppercase).

**Examples**:

```text
feat: add user authentication

Implement JWT-based login with refresh tokens.
```

```text
fix(parser): handle null pointer in user service
```

```text
feat!: drop support for Node 12

BREAKING CHANGE: minimum Node version is now 14.
```

## Amending Commits

To modify the last commit (unpushed only):

```bash
# Add more changes to last commit
git add <files>
git commit --amend --no-edit

# Change the commit message
git commit --amend
```

**Important**:

- Only amend commits that haven't been pushed
- Amending pushed commits requires force push and rewrites history
- Consider a new commit instead if changes are significant
