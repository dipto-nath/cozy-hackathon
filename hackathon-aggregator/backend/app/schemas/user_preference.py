"""User preference Pydantic schemas."""
import json
from datetime import datetime
from typing import Any, List, Optional

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.models.user_preference import ExperienceLevel, PreferredMode


class UserPreferenceBase(BaseModel):
    """Base user preference schema with common fields."""
    user_id: str = Field(..., min_length=1, max_length=255)
    email: Optional[str] = Field(None, max_length=255)

    preferred_tech_stack: Optional[List[str]] = Field(default_factory=list)
    preferred_themes: Optional[List[str]] = Field(default_factory=list)
    preferred_mode: PreferredMode = PreferredMode.ANY
    preferred_locations: Optional[List[str]] = Field(default_factory=list)
    experience_level: ExperienceLevel = ExperienceLevel.BEGINNER

    min_prize_pool: Optional[int] = None
    max_travel_distance_km: Optional[int] = None
    only_free_events: bool = False
    exclude_online: bool = False
    exclude_offline: bool = False

    email_notifications: bool = True
    notify_before_days: int = Field(default=7, ge=1, le=365)
    notify_new_matches: bool = True

    @field_validator(
        "preferred_tech_stack", "preferred_themes", "preferred_locations", mode="before"
    )
    @classmethod
    def parse_json_array(cls, v: Any) -> List[str]:
        """Parse JSON string to list if needed."""
        if isinstance(v, str):
            try:
                return json.loads(v)
            except json.JSONDecodeError:
                return [item.strip() for item in v.split(",") if item.strip()]
        return v or []


class UserPreferenceCreate(UserPreferenceBase):
    """Schema for creating user preferences."""
    pass


class UserPreferenceUpdate(BaseModel):
    """Schema for updating user preferences."""
    email: Optional[str] = Field(None, max_length=255)
    preferred_tech_stack: Optional[List[str]] = None
    preferred_themes: Optional[List[str]] = None
    preferred_mode: Optional[PreferredMode] = None
    preferred_locations: Optional[List[str]] = None
    experience_level: Optional[ExperienceLevel] = None
    min_prize_pool: Optional[int] = None
    max_travel_distance_km: Optional[int] = None
    only_free_events: Optional[bool] = None
    exclude_online: Optional[bool] = None
    exclude_offline: Optional[bool] = None
    email_notifications: Optional[bool] = None
    notify_before_days: Optional[int] = Field(None, ge=1, le=365)
    notify_new_matches: Optional[bool] = None


class UserPreferenceResponse(UserPreferenceBase):
    """Schema for user preference response."""
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime
    updated_at: datetime


class UserPreferencePayload(BaseModel):
    """Schema for user preference payload in recommendation requests."""
    user_id: Optional[str] = None
    preferred_tech_stack: Optional[List[str]] = Field(default_factory=list)
    preferred_themes: Optional[List[str]] = Field(default_factory=list)
    preferred_mode: Optional[PreferredMode] = PreferredMode.ANY
    preferred_locations: Optional[List[str]] = Field(default_factory=list)
    experience_level: Optional[ExperienceLevel] = ExperienceLevel.BEGINNER
    min_prize_pool: Optional[int] = None
    only_free_events: bool = False
    exclude_online: bool = False
    exclude_offline: bool = False