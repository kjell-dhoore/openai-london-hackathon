"""Seed data and deterministic templates for the SkillPilot MVP."""

DEFAULT_SOURCE_CATALOG: list[dict[str, object]] = [
    {
        "id": "confluence",
        "name": "Confluence",
        "category": "internal",
        "integration_mode": "local_json",
        "is_mocked": True,
        "enabled_by_default": True,
        "description": "Project documentation, standards, architecture notes, and runbooks.",
        "capabilities": [
            "profile_analysis",
            "recommendation_generation",
            "evidence_lookup",
            "learning_resources",
        ],
        "status": "available",
    },
    {
        "id": "github",
        "name": "GitHub PR Feedback",
        "category": "internal",
        "integration_mode": "local_json",
        "is_mocked": True,
        "enabled_by_default": True,
        "description": "Pull request review patterns and implementation feedback.",
        "capabilities": [
            "profile_analysis",
            "recommendation_generation",
            "evidence_lookup",
        ],
        "status": "available",
    },
    {
        "id": "google_drive",
        "name": "Google Drive",
        "category": "internal",
        "integration_mode": "local_json",
        "is_mocked": True,
        "enabled_by_default": True,
        "description": "Learning material, best-practice documents, and mentoring notes.",
        "capabilities": [
            "recommendation_generation",
            "evidence_lookup",
            "learning_resources",
        ],
        "status": "available",
    },
    {
        "id": "coaching_notes",
        "name": "Coaching Notes",
        "category": "internal",
        "integration_mode": "local_json",
        "is_mocked": True,
        "enabled_by_default": False,
        "description": "Manager and mentor observations about growth opportunities.",
        "capabilities": [
            "profile_analysis",
            "recommendation_generation",
            "evidence_lookup",
        ],
        "status": "available",
    },
    {
        "id": "youtube",
        "name": "YouTube",
        "category": "external",
        "integration_mode": "mcp_connector",
        "is_mocked": False,
        "enabled_by_default": True,
        "description": "Video-based learning resources and talks.",
        "capabilities": ["learning_resources"],
        "status": "available",
    },
    {
        "id": "google_search",
        "name": "Google Search",
        "category": "external",
        "integration_mode": "mcp_connector",
        "is_mocked": False,
        "enabled_by_default": True,
        "description": "Broad web search for topical learning resources.",
        "capabilities": ["learning_resources"],
        "status": "available",
    },
    {
        "id": "google_scholar",
        "name": "Google Scholar",
        "category": "external",
        "integration_mode": "mcp_connector",
        "is_mocked": False,
        "enabled_by_default": False,
        "description": "Research papers and deeper technical references.",
        "capabilities": ["learning_resources"],
        "status": "available",
    },
    {
        "id": "medium",
        "name": "Medium",
        "category": "external",
        "integration_mode": "mcp_connector",
        "is_mocked": False,
        "enabled_by_default": False,
        "description": "Long-form engineering articles and reflections.",
        "capabilities": ["learning_resources"],
        "status": "available",
    },
    {
        "id": "official_docs",
        "name": "Official Documentation",
        "category": "external",
        "integration_mode": "http_api",
        "is_mocked": False,
        "enabled_by_default": True,
        "description": "Stable technical references and vendor documentation.",
        "capabilities": ["learning_resources"],
        "status": "available",
    },
]


DEFAULT_PREFERENCES: dict[str, object] = {
    "learning_style": "hands_on",
    "growth_focus": "career_growth",
    "cognitive_approach": "practice_first",
    "hours_per_week": 4,
    "recommendation_cadence": "weekly",
    "weekly_nudges_enabled": True,
}


SKILL_LIBRARY: dict[str, dict[str, object]] = {
    "python": {
        "name": "Python",
        "category": "software_engineering",
        "keywords": ["python", "fastapi", "flask", "pandas", "pytest"],
        "base_level": 32,
    },
    "machine_learning": {
        "name": "Machine Learning",
        "category": "ml_engineering",
        "keywords": ["model", "ml", "machine learning", "training", "evaluation"],
        "base_level": 28,
    },
    "api_design": {
        "name": "API Design",
        "category": "backend_engineering",
        "keywords": ["api", "endpoint", "rest", "service", "backend"],
        "base_level": 26,
    },
    "sql": {
        "name": "SQL & Databases",
        "category": "data",
        "keywords": ["sql", "postgres", "mysql", "database", "query"],
        "base_level": 24,
    },
    "git_collaboration": {
        "name": "Git & Collaboration",
        "category": "delivery",
        "keywords": ["git", "github", "pull request", "code review", "review"],
        "base_level": 30,
    },
    "testing": {
        "name": "Testing",
        "category": "quality",
        "keywords": ["test", "pytest", "unit test", "integration test", "coverage"],
        "base_level": 20,
    },
    "deployment": {
        "name": "Production Deployment",
        "category": "reliability",
        "keywords": ["deploy", "docker", "kubernetes", "ci/cd", "release"],
        "base_level": 12,
    },
    "observability": {
        "name": "Observability",
        "category": "reliability",
        "keywords": ["observability", "logging", "metrics", "monitoring", "tracing"],
        "base_level": 10,
    },
    "error_handling": {
        "name": "Error Handling",
        "category": "backend_engineering",
        "keywords": ["error handling", "exceptions", "retry", "failure", "resilience"],
        "base_level": 16,
    },
    "system_design": {
        "name": "System Design",
        "category": "architecture",
        "keywords": ["architecture", "system design", "distributed", "scaling", "tradeoff"],
        "base_level": 10,
    },
}


TARGET_ROLE_KEY_SKILLS: dict[str, list[str]] = {
    "mid-level backend engineer": [
        "api_design",
        "error_handling",
        "observability",
        "system_design",
        "testing",
    ],
    "ml engineer": [
        "machine_learning",
        "deployment",
        "observability",
        "python",
        "testing",
    ],
    "platform engineer": [
        "deployment",
        "observability",
        "system_design",
        "error_handling",
        "git_collaboration",
    ],
}


THEME_TEMPLATES: dict[str, dict[str, object]] = {
    "observability": {
        "name": "Observability and Logging",
        "description": "Build visibility into system health and failure modes.",
        "why_it_matters": (
            "Improving observability helps you reason about production behavior, debug faster, "
            "and communicate reliability tradeoffs more clearly."
        ),
        "search_query": "backend observability logging production best practices",
        "tasks": [
            {
                "title": "Study the team's logging conventions",
                "description": "Review how structured logs, correlation IDs, and alerts are used.",
                "estimated_duration_minutes": 20,
                "xp_reward": 60,
                "expected_outcomes": [
                    "Understand the team's log structure",
                    "Identify two production signals worth monitoring",
                ],
            },
            {
                "title": "Map three observability gaps in a current service",
                "description": "Inspect a service and document missing logs, metrics, or traces.",
                "estimated_duration_minutes": 45,
                "xp_reward": 120,
                "expected_outcomes": [
                    "Spot instrumentation gaps",
                    "Connect system behavior to user-facing issues",
                ],
            },
            {
                "title": "Create a simple alerting and runbook proposal",
                "description": "Write a lightweight runbook for one recurring reliability risk.",
                "estimated_duration_minutes": 35,
                "xp_reward": 95,
                "expected_outcomes": [
                    "Describe one actionable alert",
                    "Document first-response steps clearly",
                ],
            },
        ],
    },
    "error_handling": {
        "name": "Error Handling and Reliability",
        "description": "Develop consistent, user-safe failure handling patterns.",
        "why_it_matters": (
            "Strong error handling increases production readiness and helps teams debug and "
            "communicate failure modes responsibly."
        ),
        "search_query": "structured backend error handling patterns reliability",
        "tasks": [
            {
                "title": "Review the team's error handling standard",
                "description": "Understand existing conventions for domain errors and retries.",
                "estimated_duration_minutes": 20,
                "xp_reward": 55,
                "expected_outcomes": [
                    "Recognize current team patterns",
                    "Differentiate recoverable and non-recoverable failures",
                ],
            },
            {
                "title": "Improve error handling in an async service",
                "description": "Apply structured exception mapping and safe logging.",
                "estimated_duration_minutes": 45,
                "xp_reward": 120,
                "expected_outcomes": [
                    "Use custom errors intentionally",
                    "Handle async failures more gracefully",
                ],
            },
            {
                "title": "Summarize one failure-mode tradeoff for the team",
                "description": "Write a short note on a reliability tradeoff you observed.",
                "estimated_duration_minutes": 30,
                "xp_reward": 80,
                "expected_outcomes": [
                    "Practice reliability communication",
                    "Connect implementation detail to operational impact",
                ],
            },
        ],
    },
    "system_design": {
        "name": "System Design and Tradeoffs",
        "description": "Practice architectural reasoning and delivery tradeoff communication.",
        "why_it_matters": (
            "Growing into a more autonomous engineering profile requires explaining why a design "
            "works, not just implementing it."
        ),
        "search_query": "system design tradeoffs backend architecture examples",
        "tasks": [
            {
                "title": "Review a delivered architecture decision",
                "description": "Study one documented system design and extract the tradeoffs.",
                "estimated_duration_minutes": 30,
                "xp_reward": 75,
                "expected_outcomes": [
                    "Identify two core constraints",
                    "Explain one tradeoff in plain language",
                ],
            },
            {
                "title": "Compare two implementation approaches",
                "description": "Contrast a simple and a scalable design for one backend problem.",
                "estimated_duration_minutes": 50,
                "xp_reward": 130,
                "expected_outcomes": [
                    "Reason about scale and complexity",
                    "Communicate why one design fits the current context",
                ],
            },
            {
                "title": "Write a short architecture summary",
                "description": "Document one decision, its risks, and its expected outcome.",
                "estimated_duration_minutes": 35,
                "xp_reward": 90,
                "expected_outcomes": [
                    "Capture tradeoffs clearly",
                    "Link architecture choices to delivery impact",
                ],
            },
        ],
    },
    "deployment": {
        "name": "Production Readiness",
        "description": "Understand how code becomes reliable software in production.",
        "why_it_matters": (
            "Deployment discipline connects implementation work to dependable delivery and safer "
            "releases."
        ),
        "search_query": "production deployment discipline release readiness backend",
        "tasks": [
            {
                "title": "Review the deployment flow for one service",
                "description": "Trace how changes move from development to production.",
                "estimated_duration_minutes": 25,
                "xp_reward": 65,
                "expected_outcomes": [
                    "Understand environment promotion steps",
                    "Recognize one release-risk checkpoint",
                ],
            },
            {
                "title": "Document three release safety checks",
                "description": "Summarize what should be verified before rollout.",
                "estimated_duration_minutes": 35,
                "xp_reward": 95,
                "expected_outcomes": [
                    "Identify practical release safeguards",
                    "Connect deployment discipline to reliability",
                ],
            },
            {
                "title": "Analyze one deployment failure scenario",
                "description": "Describe how rollback or mitigation would work in practice.",
                "estimated_duration_minutes": 40,
                "xp_reward": 110,
                "expected_outcomes": [
                    "Think through rollback paths",
                    "Articulate a production failure-mode response",
                ],
            },
        ],
    },
    "api_design": {
        "name": "API Design Patterns",
        "description": "Strengthen consistency and maintainability in service interfaces.",
        "why_it_matters": (
            "Clear APIs reduce product friction, improve team collaboration, and make systems "
            "easier to evolve."
        ),
        "search_query": "api design patterns backend consistency best practices",
        "tasks": [
            {
                "title": "Review an internal API style guide",
                "description": "Study route naming, payload conventions, and error semantics.",
                "estimated_duration_minutes": 20,
                "xp_reward": 55,
                "expected_outcomes": [
                    "Recognize consistent API conventions",
                    "Spot one improvement in an existing endpoint",
                ],
            },
            {
                "title": "Redesign one response schema for clarity",
                "description": "Improve readability and consistency without changing intent.",
                "estimated_duration_minutes": 45,
                "xp_reward": 125,
                "expected_outcomes": [
                    "Explain why the new shape is clearer",
                    "Balance ergonomics and compatibility",
                ],
            },
            {
                "title": "Add pagination or filtering rationale",
                "description": "Describe where additional API affordances become necessary.",
                "estimated_duration_minutes": 35,
                "xp_reward": 90,
                "expected_outcomes": [
                    "Understand progressive API design",
                    "Tie API changes to client use cases",
                ],
            },
        ],
    },
    "testing": {
        "name": "Testing and Confidence",
        "description": "Increase confidence in changes through clearer automated checks.",
        "why_it_matters": (
            "Testing discipline makes it easier to move quickly without losing trust in changes."
        ),
        "search_query": "backend testing strategy unit integration confidence",
        "tasks": [
            {
                "title": "Review an example test suite with good coverage",
                "description": "Inspect how assertions map to behavior and failure modes.",
                "estimated_duration_minutes": 20,
                "xp_reward": 50,
                "expected_outcomes": [
                    "Recognize meaningful assertions",
                    "Connect tests to practical risk reduction",
                ],
            },
            {
                "title": "Outline a testing strategy for a new endpoint",
                "description": "Decide what to cover with unit, integration, and edge-case tests.",
                "estimated_duration_minutes": 40,
                "xp_reward": 100,
                "expected_outcomes": [
                    "Choose the right test scope",
                    "Identify one edge case worth protecting",
                ],
            },
            {
                "title": "Write a short note on confidence gaps",
                "description": "Document one area where tests would reduce delivery risk.",
                "estimated_duration_minutes": 25,
                "xp_reward": 70,
                "expected_outcomes": [
                    "Practice risk-based thinking",
                    "Tie testing investment to team delivery speed",
                ],
            },
        ],
    },
}


OFFICIAL_DOCUMENTATION_LINKS: dict[str, dict[str, str]] = {
    "observability": {
        "title": "OpenTelemetry Python Instrumentation",
        "url": "https://opentelemetry.io/docs/languages/python/",
    },
    "error_handling": {
        "title": "FastAPI Error Handling",
        "url": "https://fastapi.tiangolo.com/tutorial/handling-errors/",
    },
    "system_design": {
        "title": "Google Cloud Architecture Framework",
        "url": "https://cloud.google.com/architecture/framework",
    },
    "deployment": {
        "title": "Twelve-Factor App",
        "url": "https://12factor.net/",
    },
    "api_design": {
        "title": "API Design Best Practices",
        "url": ("https://learn.microsoft.com/en-us/azure/architecture/best-practices/api-design"),
    },
    "testing": {
        "title": "pytest Documentation",
        "url": "https://docs.pytest.org/en/stable/",
    },
}
