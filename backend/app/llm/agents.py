"""OpenAI-backed prompt agents for SkillPilot."""

from __future__ import annotations

import http.client
import json
from pathlib import Path
from typing import cast

from jinja2 import Environment, FileSystemLoader, StrictUndefined, select_autoescape
from pydantic import BaseModel, Field


class LlmAgentError(RuntimeError):
    """Raised when an OpenAI-backed agent call fails."""


class AgentSkillAssessment(BaseModel):
    """Structured skill assessment returned by the profile-analysis agent."""

    skill_id: str
    level_percent: int = Field(ge=0, le=100)
    confidence: float = Field(ge=0, le=1)
    rationale: str
    evidence_document_ids: list[str] = Field(default_factory=list)


class ProfileAnalysisOutput(BaseModel):
    """Structured response expected from the profile-analysis agent."""

    maturity_snapshot: str
    goal_direction: str
    explanation: str
    missing_information: list[str] = Field(default_factory=list)
    strengths: list[AgentSkillAssessment] = Field(min_length=4, max_length=4)
    growth_areas: list[AgentSkillAssessment] = Field(min_length=4, max_length=4)
    target_role_gap_skill_ids: list[str] = Field(min_length=3, max_length=4)
    target_role_narrative: str


class GrowthTaskDraft(BaseModel):
    """Structured task draft returned by the growth-plan agent."""

    title: str
    description: str
    xp_reward: int = Field(ge=40, le=300)
    estimated_duration_minutes: int = Field(ge=10, le=480)
    rationale_snippet: str
    why_recommended: list[str] = Field(min_length=2, max_length=4)
    expected_outcomes: list[str] = Field(min_length=2, max_length=4)
    resource_ids: list[str] = Field(default_factory=list)


class GrowthThemeDraft(BaseModel):
    """Structured theme draft returned by the growth-plan agent."""

    skill_id: str
    name: str
    description: str
    why_it_matters: str
    tasks: list[GrowthTaskDraft] = Field(min_length=2, max_length=3)


class GrowthPlanOutput(BaseModel):
    """Structured response expected from the growth-plan agent."""

    summary: str
    why_this_path: str
    themes: list[GrowthThemeDraft] = Field(min_length=3, max_length=5)


def _remove_nonessential_schema_keys(schema_node: object) -> None:
    """Normalize a Pydantic JSON schema for strict structured outputs."""
    if isinstance(schema_node, dict):
        schema_map = cast("dict[str, object]", schema_node)
        schema_map.pop("default", None)

        if schema_map.get("type") == "object":
            properties = cast("dict[str, object]", schema_map.get("properties", {}))
            if properties:
                schema_map["required"] = list(properties.keys())
            schema_map["additionalProperties"] = False

        for value in schema_map.values():
            _remove_nonessential_schema_keys(value)
        return

    if isinstance(schema_node, list):
        for item in schema_node:
            _remove_nonessential_schema_keys(item)


def build_strict_json_schema(model: type[BaseModel]) -> dict[str, object]:
    """Return a strict JSON schema compatible with Structured Outputs."""
    schema = model.model_json_schema(mode="validation")
    _remove_nonessential_schema_keys(schema)
    return schema


class PromptRenderer:
    """Render Jinja prompt templates from the local prompts directory."""

    def __init__(self, prompt_dir: Path | None = None) -> None:
        """Initialize the prompt renderer.

        Args:
            prompt_dir: Optional override for the directory containing `.jinja`
                prompt templates.
        """
        resolved_prompt_dir = prompt_dir or Path(__file__).resolve().parent / "prompts"
        self._environment = Environment(
            loader=FileSystemLoader(str(resolved_prompt_dir)),
            undefined=StrictUndefined,
            autoescape=select_autoescape(default=False, default_for_string=False),
            trim_blocks=True,
            lstrip_blocks=True,
        )
        self._environment.filters["tojson_pretty"] = lambda value: json.dumps(
            value, indent=2, sort_keys=True
        )

    def render(self, template_name: str, **context: object) -> str:
        """Render a prompt template with the provided context."""
        return self._environment.get_template(template_name).render(**context)


class OpenAIResponsesClient:
    """Minimal Responses API client using the standard library."""

    def __init__(self, api_key: str, model: str, timeout_seconds: int = 60) -> None:
        """Initialize the OpenAI responses client.

        Args:
            api_key: OpenAI API key.
            model: OpenAI model identifier.
            timeout_seconds: Network timeout for API calls.
        """
        self._api_key = api_key
        self._model = model
        self._timeout_seconds = timeout_seconds

    def generate_structured_output(
        self,
        *,
        instructions: str,
        user_prompt: str,
        response_model: type[BaseModel],
        schema_name: str,
        max_output_tokens: int = 4000,
    ) -> BaseModel:
        """Call the OpenAI Responses API and validate the structured JSON output."""
        payload = {
            "model": self._model,
            "instructions": instructions,
            "input": [
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "input_text",
                            "text": user_prompt,
                        }
                    ],
                }
            ],
            "max_output_tokens": max_output_tokens,
            "text": {
                "format": {
                    "type": "json_schema",
                    "name": schema_name,
                    "strict": True,
                    "schema": build_strict_json_schema(response_model),
                }
            },
        }
        raw_response = self._post(payload)
        output_text = self._extract_output_text(raw_response)
        return response_model.model_validate_json(output_text)

    def _post(self, payload: dict[str, object]) -> dict[str, object]:
        encoded_payload = json.dumps(payload).encode("utf-8")
        connection = http.client.HTTPSConnection(
            "api.openai.com",
            timeout=self._timeout_seconds,
        )
        try:
            connection.request(
                "POST",
                "/v1/responses",
                body=encoded_payload,
                headers={
                    "Authorization": f"Bearer {self._api_key}",
                    "Content-Type": "application/json",
                },
            )
            response = connection.getresponse()
            response_body = response.read().decode("utf-8", errors="ignore")
            if response.status >= 400:
                raise LlmAgentError(
                    f"OpenAI Responses API returned HTTP {response.status}: {response_body}"
                )
            parsed = json.loads(response_body)
            return cast("dict[str, object]", parsed)
        except OSError as exc:
            raise LlmAgentError(f"Could not reach OpenAI Responses API: {exc}") from exc
        finally:
            connection.close()

    def _extract_output_text(self, response_payload: dict[str, object]) -> str:
        if response_payload.get("error"):
            raise LlmAgentError(f"OpenAI Responses API error: {response_payload['error']}")

        if response_payload.get("output_text"):
            return str(response_payload["output_text"])

        text_fragments: list[str] = []
        output_items = cast("list[dict[str, object]]", response_payload.get("output", []))
        for output_item in output_items:
            content_items = cast("list[dict[str, object]]", output_item.get("content", []))
            for content_item in content_items:
                content_type = content_item.get("type")
                if content_type in {"output_text", "text"} and content_item.get("text"):
                    text_fragments.append(str(content_item["text"]))
                if content_type == "refusal":
                    raise LlmAgentError(f"Model refused the request: {content_item}")

        if text_fragments:
            return "".join(text_fragments)

        raise LlmAgentError(f"OpenAI response did not contain structured text: {response_payload}")


class SkillPilotPromptAgents:
    """Facade for the prompt-driven SkillPilot agents."""

    def __init__(
        self,
        api_key: str,
        model: str,
        prompt_renderer: PromptRenderer | None = None,
    ) -> None:
        """Initialize the prompt-backed agent facade.

        Args:
            api_key: OpenAI API key.
            model: OpenAI model identifier.
            prompt_renderer: Optional prompt renderer override for testing.
        """
        self._client = OpenAIResponsesClient(api_key=api_key, model=model)
        self._renderer = prompt_renderer or PromptRenderer()

    def analyze_profile(self, prompt_context: dict[str, object]) -> ProfileAnalysisOutput:
        """Run the profile-analysis agent."""
        instructions = self._renderer.render("profile_analysis_system.jinja")
        user_prompt = self._renderer.render("profile_analysis_user.jinja", **prompt_context)
        response = self._client.generate_structured_output(
            instructions=instructions,
            user_prompt=user_prompt,
            response_model=ProfileAnalysisOutput,
            schema_name="skillpilot_profile_analysis",
            max_output_tokens=3000,
        )
        return ProfileAnalysisOutput.model_validate(response)

    def generate_growth_plan(self, prompt_context: dict[str, object]) -> GrowthPlanOutput:
        """Run the growth-plan generation agent."""
        instructions = self._renderer.render("growth_plan_system.jinja")
        user_prompt = self._renderer.render("growth_plan_user.jinja", **prompt_context)
        response = self._client.generate_structured_output(
            instructions=instructions,
            user_prompt=user_prompt,
            response_model=GrowthPlanOutput,
            schema_name="skillpilot_growth_plan",
            max_output_tokens=5000,
        )
        return GrowthPlanOutput.model_validate(response)
