"""Tests for backend configuration helpers."""

from __future__ import annotations

import os
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.config import load_env_file


def test_load_env_file_populates_missing_values(tmp_path: Path) -> None:
    """The .env loader reads simple key-value pairs when variables are absent."""
    env_file = tmp_path / ".env"
    env_file.write_text(
        "\n".join(
            [
                "# Comment line",
                "OPENAI_API_KEY=test-key",
                'OPENAI_MODEL="gpt-4.1-mini"',
                "export EXTRA_FLAG=enabled",
            ]
        ),
        encoding="utf-8",
    )

    for key in ("OPENAI_API_KEY", "OPENAI_MODEL", "EXTRA_FLAG"):
        os.environ.pop(key, None)

    load_env_file(env_file)

    assert os.environ["OPENAI_API_KEY"] == "test-key"
    assert os.environ["OPENAI_MODEL"] == "gpt-4.1-mini"
    assert os.environ["EXTRA_FLAG"] == "enabled"


def test_load_env_file_preserves_existing_environment(tmp_path: Path) -> None:
    """The .env loader does not override existing process environment variables."""
    env_file = tmp_path / ".env"
    env_file.write_text("OPENAI_API_KEY=file-value\n", encoding="utf-8")
    os.environ["OPENAI_API_KEY"] = "existing-value"

    load_env_file(env_file)

    assert os.environ["OPENAI_API_KEY"] == "existing-value"
