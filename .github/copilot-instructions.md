# Code Review Guidelines

## Issue Classification

Classify every finding using the format: `Severity [category]: description`

Severity levels:

- **Critical** — Must be addressed. Security vulnerabilities, data loss risks, or broken functionality.
- **Warning** — Should be addressed. Performance issues, missing tests, or poor error handling.
- **Suggestion** — Nice to have. Style improvements, refactoring opportunities, or documentation gaps.

Categories:

- `[security]` — Secrets, injection, authentication, authorization, input validation.
- `[testing]` — Missing tests, coverage gaps, unclear test names.
- `[architecture]` — Structure violations, unnecessary dependencies, design issues.
- `[ci]` — Pipeline security, secret handling, step integrity.
- `[docs]` — Missing or outdated documentation, changelog gaps.


Examples:

- `Critical [security]: Hardcoded API key in configuration file.`
- `Warning [testing]: New endpoint has no associated unit tests.`
- `Critical [ci]: Pipeline step executes unverified remote script.`
- `Warning [docs]: New CLI flag --dry-run is undocumented.`

## Security

1. Ensure no secrets, credentials, or API keys are hardcoded. (Critical)
2. Verify that user input is validated and sanitized where applicable. (Critical)
3. Verify sensitive data is not logged or exposed in error messages. (Warning)

## Testing

1. Ensure all new functionality has associated tests. (Warning)
2. Check that tests cover both happy paths and edge cases. (Warning)
3. Ensure tests contain meaningful assertions that verify actual behavior, not just that code runs without errors. (Warning)
4. Verify test names clearly describe what they are testing. (Suggestion)

## CI/CD Pipelines

1. Verify that secrets are referenced via the platform's secret management, never inlined in pipeline config. (Critical)
2. Ensure pipeline steps do not execute unverified remote scripts or use untrusted third-party pipeline images. (Critical)
3. Check that pipeline permissions follow least privilege (e.g., read-only where possible). (Warning)


## Documentation

1. Ensure README and relevant docs are updated when behavior or configuration changes. (Warning)
2. Verify that CHANGELOG is updated with a summary of user-facing changes. (Warning)
3. Check that new environment variables, feature flags, or config options are documented. (Warning)
4. Ensure `AGENTS.md` is updated when project structure, commands, or conventions change. (Warning)

## Architecture

1. Ensure changes follow the existing project structure and patterns. Refer to the project's `AGENTS.md` for conventions. (Warning)
2. Verify that business logic modules have no framework dependencies (e.g., no Flask imports in core modules). (Warning)
3. Verify that API contracts (e.g., OpenAPI specs) are updated when endpoints change. (Warning)

## Exclude from Reviews

- Formatting and import sorting (Ruff)
- Linting, docstring and naming enforcement (Ruff)
- Type checking (mypy)
- Dependency vulnerabilities (uv-secure in CI)
- License compliance (liccheck in CI)

