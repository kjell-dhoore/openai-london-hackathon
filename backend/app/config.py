"""Application settings for the SkillPilot backend."""

import os
from dataclasses import dataclass
from pathlib import Path


@dataclass(frozen=True)
class Settings:
    """Runtime configuration for the backend application."""

    project_name: str
    session_store_path: Path
    internal_sources_path: Path
    openai_api_key: str | None
    openai_model: str

    @property
    def llm_mode(self) -> str:
        """Return the active plan-generation mode."""
        return "openai" if self.openai_api_key else "deterministic"

    @classmethod
    def from_env(cls) -> "Settings":
        """Build settings from environment variables."""
        backend_root = Path(__file__).resolve().parents[1]
        data_dir = backend_root / "data"

        session_store_path = Path(
            os.getenv(
                "SKILLPILOT_SESSION_STORE_PATH",
                str(data_dir / "session_store.json"),
            )
        )
        internal_sources_path = Path(
            os.getenv(
                "SKILLPILOT_INTERNAL_SOURCES_PATH",
                str(data_dir / "internal_sources.json"),
            )
        )

        return cls(
            project_name="SkillPilot Backend",
            session_store_path=session_store_path,
            internal_sources_path=internal_sources_path,
            openai_api_key=os.getenv("OPENAI_API_KEY"),
            openai_model=os.getenv("OPENAI_MODEL", "gpt-4.1-mini"),
        )
