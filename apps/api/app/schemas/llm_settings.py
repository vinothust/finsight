from pydantic import BaseModel, ConfigDict


class LLMSettingsOut(BaseModel):
    model_config = ConfigDict(from_attributes=True, protected_namespaces=())

    gcp_project: str
    gcp_location: str
    model_simple: str
    model_complex: str
    model_fallback: str


class LLMSettingsUpdate(BaseModel):
    model_config = ConfigDict(protected_namespaces=())

    gcp_project: str | None = None
    gcp_location: str | None = None
    model_simple: str | None = None
    model_complex: str | None = None
    model_fallback: str | None = None
