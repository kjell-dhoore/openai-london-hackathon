"""Base Pydantic model with camelCase serialization."""

from pydantic import BaseModel, ConfigDict
from pydantic.alias_generators import to_camel


class CamelModel(BaseModel):
    """Base model that serializes snake_case fields to camelCase in JSON responses.

    Internal Python attributes use snake_case. When serialized (e.g. in API responses),
    field names are automatically converted to camelCase via the alias generator.
    Input parsing accepts both snake_case and camelCase field names.
    """

    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)
