"""JSON-backed persistence helpers for the SkillPilot MVP."""

import json
import threading
from pathlib import Path

from app.dtos.skillpilot import InternalSourcesData, JobStatusResponse, StoredSession, StoreState


class JsonStore:
    """Thread-safe JSON store for sessions, jobs, and internal source fixtures."""

    def __init__(self, session_store_path: Path, internal_sources_path: Path) -> None:
        """Initialize the store and ensure seed files exist."""
        self._session_store_path = session_store_path
        self._internal_sources_path = internal_sources_path
        self._lock = threading.Lock()
        self._ensure_session_store()

    def _ensure_session_store(self) -> None:
        """Create an empty session store file when missing."""
        self._session_store_path.parent.mkdir(parents=True, exist_ok=True)
        if not self._session_store_path.exists():
            self._session_store_path.write_text(
                json.dumps(StoreState().model_dump(mode="json"), indent=2),
                encoding="utf-8",
            )

    def _load_state(self) -> StoreState:
        """Load the persisted session and job state."""
        raw_state = json.loads(self._session_store_path.read_text(encoding="utf-8"))
        return StoreState.model_validate(raw_state)

    def _save_state(self, state: StoreState) -> None:
        """Persist the full store state atomically."""
        payload = json.dumps(state.model_dump(mode="json"), indent=2, sort_keys=True)
        temp_path = self._session_store_path.with_suffix(".tmp")
        temp_path.write_text(payload, encoding="utf-8")
        temp_path.replace(self._session_store_path)

    def get_session(self, session_id: str) -> StoredSession | None:
        """Return a stored session, if present."""
        with self._lock:
            return self._load_state().sessions.get(session_id)

    def save_session(self, session: StoredSession) -> None:
        """Insert or update a session record."""
        with self._lock:
            state = self._load_state()
            state.sessions[session.session_id] = session
            self._save_state(state)

    def get_job(self, job_id: str) -> JobStatusResponse | None:
        """Return a stored job, if present."""
        with self._lock:
            return self._load_state().jobs.get(job_id)

    def save_job(self, job: JobStatusResponse) -> None:
        """Insert or update a job record."""
        with self._lock:
            state = self._load_state()
            state.jobs[job.job_id] = job
            self._save_state(state)

    def load_internal_sources(self) -> InternalSourcesData:
        """Load mocked internal source documents from the local JSON file."""
        raw_data = json.loads(self._internal_sources_path.read_text(encoding="utf-8"))
        return InternalSourcesData.model_validate(raw_data)
