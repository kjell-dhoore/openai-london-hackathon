# Project Structure

```
.
├── frontend/                        # Frontend application (TBD)
├── backend/
│   ├── app/                         # FastAPI application
│   │   ├── api/                     # Endpoint definitions
│   │   ├── clients/                 # External clients (e.g. HTTP client)
│   │   ├── dtos/                    # Pydantic data models (request/response)
│   │   ├── llm/                     # Generation logic
│   │   │   └── prompts/             # Jinja-based structured prompts
│   │   └── services/                # Business logic for each endpoint
│   └── run.py                       # Application entry point
└── scripts/                         # Standalone scripts
```
