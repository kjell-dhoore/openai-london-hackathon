# test

| | |
| :--- | :--- |
| **CI/CD Pipeline** | github |

## Prerequisites

Before you begin, ensure you have the following installed and configured:

- [Python 3.10+](https://www.python.org/downloads/)
- [uv](https://docs.astral.sh/uv/) (Python package manager)

## Getting Started

Install the project dependencies and activate the virtual environment:

```commandline
uv sync --group dev
source .venv/bin/activate
```

Install pre-commit hooks:

```commandline
pre-commit install
```

## Project Structure

```
.
├── .pre-commit-config.yaml     # Pre-commit hook configuration
├── AGENTS.md                   # AI agent instructions
├── .github/copilot-instructions.md  # AI code review instructions
└── ...
```

## CI/CD

This project uses **github** for CI/CD. The pipeline configuration is generated
in the project root. Update the pipeline configuration as you add new components.

## Development

### Code Style

This project uses [Ruff](https://docs.astral.sh/ruff/) for linting and formatting, and
[mypy](https://mypy-lang.org/) for type checking. Pre-commit hooks enforce these checks
automatically.

```commandline
uv run ruff check .
uv run ruff format .
uv run mypy .
```

### Testing

```commandline
uv run pytest
```

### Contributing

When making changes, follow these guidelines:

- Follow the [Google Python Style Guide](https://google.github.io/styleguide/pyguide.html).
- Ensure all new code has associated tests.
- Keep changes small and focused on a single feature or fix.
