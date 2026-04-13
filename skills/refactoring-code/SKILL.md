---
name: refactoring-code
description: Systematic Python code refactoring workflow. Use when the user asks to refactor code, improve code readability, performance, maintainability, reduce technical debt, eliminate code smells, or modernize legacy Python code.
metadata:
  version: "1.0"
---

# Python Code Refactoring Guide

The goal is to refactor the code in the active branch when asked.

## When to Use

Use this skill when refactoring Python code to improve:
- Code readability and maintainability
- Performance without changing behavior
- Code structure and eliminate code smells (improve structure)
- Legacy code to use modern Python features

## Core Principles

**Important**: Improve internal structure without altering external behavior. Refactor for code quality (readability, maintainability, performance), not to fix tests. Tests validate your work (they're proof, not the goal).

**Process**:
1. One refactoring at a time
2. Run tests after each change
3. Commit frequently
4. Keep refactoring separate from features

**Red Flags** (when to refactor):
- Functions > 30-40 lines
- Classes > 300-400 lines
- More than 5 function parameters
- Nested conditionals > 3 levels deep
- Code duplication
- Missing type hints

## Quick Reference

### Common Refactorings
For a reference of common refactorings, see references/COMMON-REFACTORINGS.md

### Modern Python Patterns
For a reference of modern Python patterns, see references/MODERN-PYTHON-PATTERNS.md

### Performance Patterns
For a reference of performance patterns, see references/PERFORMANCE-PATTERNS.md

## Refactoring Workflow

### 1. Check the active branch and differences

Check the active branch:

```bash
# Check the active branch
git branch --show-current
```

If we're not on a feature, bugfix, or refactor branch, create one.

```bash
# Create a new branch
git checkout -b refactor/<description>
```

Check what has changed on this branch and locally:

```bash
# See all changes on this branch vs main
git diff main...HEAD   # or: git diff origin/main...HEAD

# See uncommitted changes on top of that
git status
git diff
```

Reviewing the diff vs main shows the full scope of work on the branch; uncommitted changes show what is not yet committed.

### 2. Ensure tests pass

Run tests:

```bash
# Run tests
uv run pytest tests/  # or: pytest tests/
```

### 3. Make one small change

**Read the references** in the references folder (COMMON-REFACTORINGS.md, MODERN-PYTHON-PATTERNS.md, PERFORMANCE-PATTERNS.md) before changing code, then apply them. Make the necessary changes using those guides.

### 4. Run tests again

```bash
# Run tests again
uv run pytest tests/
```

### 5. Check linting/types

```bash
# Check linting and types
ruff check . && ruff format . && mypy <package>/  # e.g. mypy src/ or mypy app/
```

### 6. Commit

```bash
# Commit the changes
git commit -m "refactor: extract validation logic"
```

### 7. Repeat until done
Repeat the process until the code is refactored to the user's satisfaction or when you have done all the refactorings you can think of.

## Checklist

**Before:**
- [ ] Read the reference docs (COMMON-REFACTORINGS.md, MODERN-PYTHON-PATTERNS.md, PERFORMANCE-PATTERNS.md)
- [ ] Tests exist and pass
- [ ] Understand current behavior
- [ ] Clear refactoring goal

**During:**
- [ ] Small, incremental changes
- [ ] Run tests after each change
- [ ] Keep code working

**After:**
- [ ] All tests pass
- [ ] No new linting errors
- [ ] Code is more readable
- [ ] No behavioral changes

## Tools

```bash
# Type checking
mypy <package>/  # e.g. mypy src/ or mypy app/

# Linting
ruff check . && ruff format .  # or: flake8 . && black .

# Testing (use your project's test directory, often tests/; use uv run if the project uses uv)
uv run pytest tests/  # or: pytest tests/
```

## Summary

**Remember:**
1. Start with tests
2. One change at a time
3. Use modern Python patterns (see references)
4. Keep it simple
5. Profile before optimizing

**Working code > Perfect code**. Refactor incrementally.
