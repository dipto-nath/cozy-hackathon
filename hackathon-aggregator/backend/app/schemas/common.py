"""Common Pydantic schemas for API responses."""
from typing import Any, Generic, List, Optional, TypeVar

from pydantic import BaseModel, ConfigDict, Field

T = TypeVar("T")


class PaginatedResponse(BaseModel, Generic[T]):
    """Generic paginated response schema."""
    model_config = ConfigDict(from_attributes=True)

    items: List[T]
    total: int
    page: int
    page_size: int
    total_pages: int

    @property
    def has_next(self) -> bool:
        return self.page < self.total_pages

    @property
    def has_prev(self) -> bool:
        return self.page > 1


class MessageResponse(BaseModel):
    """Simple message response schema."""
    message: str
    detail: Optional[str] = None


class ErrorResponse(BaseModel):
    """Error response schema."""
    error: str
    detail: Optional[str] = None
    status_code: int = 400


class HealthCheckResponse(BaseModel):
    """Health check response schema."""
    status: str
    version: str
    database: str
    redis: str


class ScrapeTriggerResponse(BaseModel):
    """Response for manual scrape trigger."""
    message: str
    triggered_at: str
    sources: List[str]
    estimated_duration_seconds: int