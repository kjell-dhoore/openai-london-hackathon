---
name: update-docs
description: This skill should be used when the user asks to "update documentation for my changes", "check docs for this PR", "what docs need updating", "sync docs with code", "scaffold docs for this feature", "document this feature", "review docs completeness", "add docs for this change", "what documentation is affected", "docs impact", or mentions "README", "docs/", "CHANGELOG", "documentation update", "API reference", ".md files". Provides guided workflow for updating project documentation based on code changes.
---

# update-docs

Guides you through updating project documentation based on code changes on the active branch. Designed for maintainers reviewing PRs for documentation completeness.

## Overview

This skill prevents documentation update oversights when code changes occur. It detects changes in code and suggests updates to related READMEs, CHANGELOGs, API specs, configuration guides, and more.

## Trigger

- When code changes may impact documentation
- When user explicitly requests documentation updates
- During pre-PR creation checklist execution

## Instructions

### Step 1: Analyze Changes

Analyze changes to determine documentation impact:

```bash
# See all changed files on this branch (auto-detect default branch)
git diff $(git rev-parse --abbrev-ref origin/HEAD | sed 's|origin/||')...HEAD --stat

# Or specify the branch explicitly if the above fails
git diff main...HEAD --stat
```

### Step 2: Identify Documentation Impact

Detect the following patterns:

| Change Type | Documentation Impact |
|-------------|---------------------|
| New CLI option | `--help` output, README |
| API endpoint added/changed | API documentation |
| Configuration option added | Config guide |
| Environment variable added | Setup guide |
| Feature added | Feature documentation |
| Breaking change | Migration guide, CHANGELOG |

### Step 3: Find Related Documents

```bash
# Find documentation files
find . -name "*.md" -type f
find . -name "README*" -type f
find . -name "CHANGELOG*" -type f
find . -name "CONTRIBUTING*" -type f
find . -name "AGENTS*" -type f
find docs/ -type f 2>/dev/null
```

Identify documentation locations:

- `README.md` - Project overview
- `CHANGELOG.md` - Change history
- `CONTRIBUTING.md` - Contribution guide
- `AGENTS.md` - AI agent guidelines (project structure, commands, code style, boundaries)
- `docs/` - Detailed documentation
- `docs/contributing/` - Contributing guidelines (design principles, release process)
- `docs/ai-native/` - AI-native documentation (AGENTS.md and SKILL.md usage guides)

### Step 4: Plan Documentation Updates

Use the `CHANGETYPE-SUGGESTIONS.md` reference to plan the documentation updates based on change type.

### Step 5: Execute Documentation Updates

After user approval, execute the planned documentation updates:

1. Edit target files
2. Run pre-commit hooks: `uv run --frozen pre-commit run --all-files`
3. Fix any issues flagged by pre-commit hooks
4. Stage changes: `git add <files>`
5. Commit with conventional format:

```text
docs: <short imperative description (~50 chars)>

<Body explaining what documentation was updated and why.>
```

## Detection Rules

### Auto-detect Patterns

Use the patterns below to classify code changes into the change types defined in `CHANGETYPE-SUGGESTIONS.md`.

```python
# New feature — new functions, classes, CLI commands, or routes
r"def\s+\w+\s*\("           # new function definition
r"class\s+\w+\s*[\(:]"      # new class definition
r"add_argument\s*\(\s*['\"]--(\w+)"  # new CLI option
r"add_subparsers\s*\("      # new CLI subcommand group

# Bug fix — changes to existing code alongside test corrections
# (detected by diffing existing functions/methods rather than new definitions)

# Refactor — file renames, moved imports, structural changes
# (detected by git rename/move operations and changed import paths)

# Documentation update — direct changes to markdown files
r"\.md$"                     # any markdown file changed

# API change — endpoint decorators, route definitions, request handlers
r"@(app|router)\.(get|post|put|delete|patch)"
r"def\s+\w+\s*\(.*request"
r"@api_view\s*\("
r"openapi|swagger"

# Configuration change — config files, settings, environment variables
r"Config\s*\("
r"settings\.\w+"
r"os\.environ\.get\("
r"getenv\s*\(\s*['\"](\w+)"
r"environ\[.(\w+).\]"
r"\.ini$|\.env$|\.yaml$|\.yml$|\.toml$"  # config file extensions

# Testing change — test files, fixtures, test configuration
r"test_\w+\.py$|_test\.py$" # Python test files
r"\w+\.test\.(ts|js)$"      # JavaScript/TypeScript test files
r"conftest\.py$"             # pytest fixtures
r"\.pytest\.ini|pytest\.ini|setup\.cfg.*\[tool:pytest\]"
```

### Changelog Detection

Suggest CHANGELOG updates for **all** change types. Place each entry under the appropriate CHANGELOG heading based on scope:

| Scope | CHANGELOG Heading | When to use |
|-------|-------------------|-------------|
| Cross-cutting | `### General` | New features, bug fixes, refactors, config changes, etc. |
| Documentation only | `### Documentation` | Changes that only affect documentation files |

Each entry should include a Trello or Jira ticket link. If no ticket exists, ask the user for one. Use `[No Ticket]` only as a last resort.

```markdown
- <Description of the change> [#NNN](https://trello.com/c/XXX/NNN-description)
- <Description without ticket> [No Ticket]
```

### Cross-referencing

After classifying changes, use the `CHANGETYPE-SUGGESTIONS.md` reference to determine which documentation files to update beyond the CHANGELOG:

| Change Type | Additional Target Documents |
|-------------|----------------------------|
| New feature | README (usage, prerequisites), AGENTS.md (commands, project structure), cross-links to config/API/infra docs |
| Bug fix | README (corrected behavior, removed workarounds), known issues |
| Refactor | README (redirect old sections), AGENTS.md (project structure, guidelines), CONTRIBUTING.md (structure changes) |
| Documentation update | README (in-place edits), cross-references and table of contents |
| API change | README (API overview), API docs (endpoints, schemas, error codes), migration guide |
| Configuration change | Config guide (option table), AGENTS.md (configuration, development notes), CONTRIBUTING.md (dev setup) |
| Testing change | Testing guide (run commands, fixtures), CONTRIBUTING.md (conventions) |
| Other | README (most relevant section), cross-links to affected docs |

## Output Format

### Generated Documentation Update Report

An example of the generated documentation update report to be presented to the user before execution:

```markdown
## Documentation Update Check

### Detected Changes
| Type | Impact | Target Documents |
|------|--------|------------------|
| New feature | `generate` command added | README.md, CHANGELOG.md |
| Bug fix | timeout workaround no longer needed | README.md, CHANGELOG.md |
| API change | `/users` endpoint response changed | docs/api.md, README.md, CHANGELOG.md |
| Configuration change | `MAX_RETRIES` env var added | docs/configuration.md, CONTRIBUTING.md, CHANGELOG.md |
| Testing change | integration test suite added | docs/testing.md, CONTRIBUTING.md, CHANGELOG.md |

### Recommended Actions
1. Add `generate` command usage section to README.md
2. Remove timeout workaround from README.md known issues
3. Update `/users` endpoint schema in docs/api.md
4. Document `MAX_RETRIES` option in docs/configuration.md
5. Add integration test run instructions to docs/testing.md
6. Add entries for all changes to CHANGELOG.md

Execute updates? [y/N]
```

### Success

```text
Documentation updated

Updated files:
  - README.md (+15 lines)
  - docs/<documentation-file-name>.md (+8 lines)
  - CHANGELOG.md (+5 lines)

Next step:
  push changes to the remote repository
  git push origin <branch-name>
```

## Error Handling

| Error | Action |
|-------|--------|
| No docs found | `No documentation files found` |
| Doc not writable | `No write permission for file` |
| Pattern not found | Suggest manual verification |

## Integration

This skill integrates with:

1. **code-quality-gate** - Documentation check before commit
2. **issue-reporter** - Report documentation update progress
3. **PR Template** - Documentation update checklist

## Best Practices

1. **Update with code changes** - Don't postpone documentation updates
2. **Clarify change scope** - Specifically describe what changed
3. **Include examples** - Add code examples and usage examples
4. **Maintain CHANGELOG** - Record important changes in history
