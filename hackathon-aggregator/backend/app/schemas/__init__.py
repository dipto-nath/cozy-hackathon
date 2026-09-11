"""Pydantic schemas package."""
from .hackathon import (
    HackathonCreate,
    HackathonResponse,
    HackathonFrontendResponse,
    HackathonListResponse,
    HackathonFilterParams,
    HackathonSortParams,
)
from .user_preference import (
    UserPreferenceCreate,
    UserPreferenceUpdate,
    UserPreferenceResponse,
    UserPreferencePayload,
)
from .common import (
    PaginatedResponse,
    MessageResponse,
    ErrorResponse,
)

__all__ = [
    "HackathonCreate",
    "HackathonResponse",
    "HackathonFrontendResponse",
    "HackathonListResponse",
    "HackathonFilterParams",
    "HackathonSortParams",
    "UserPreferenceCreate",
    "UserPreferenceUpdate",
    "UserPreferenceResponse",
    "UserPreferencePayload",
    "PaginatedResponse",
    "MessageResponse",
    "ErrorResponse",
]