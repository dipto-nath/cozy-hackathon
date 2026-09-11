"""Hackathon Pydantic schemas."""
import json
from datetime import datetime
from typing import Any, List, Optional

from pydantic import BaseModel, ConfigDict, Field, field_serializer, field_validator

from app.models.hackathon import HackathonFeeType, HackathonMode, HackathonPlatformSource


class HackathonBase(BaseModel):
    """Base hackathon schema with common fields."""
    external_id: str = Field(..., min_length=1, max_length=255)
    platform_source: HackathonPlatformSource
    title: str = Field(..., min_length=1, max_length=500)
    description: Optional[str] = None
    organization: Optional[str] = Field(None, max_length=255)
    url: str = Field(..., min_length=1, max_length=1000)

    registration_deadline: Optional[datetime] = None
    event_start_date: Optional[datetime] = None
    event_end_date: Optional[datetime] = None

    mode: HackathonMode = HackathonMode.ONLINE
    fee_type: HackathonFeeType = HackathonFeeType.FREE
    state_location: Optional[str] = Field(None, max_length=255)
    country: Optional[str] = Field(None, max_length=100)
    city: Optional[str] = Field(None, max_length=100)

    tags: Optional[List[str]] = Field(default_factory=list)
    themes: Optional[List[str]] = Field(default_factory=list)
    tech_stack: Optional[List[str]] = Field(default_factory=list)

    prize_pool: Optional[str] = Field(None, max_length=500)
    prizes_details: Optional[str] = None

    image_url: Optional[str] = Field(None, max_length=1000)

    @field_validator("tags", "themes", "tech_stack", mode="before")
    @classmethod
    def parse_json_array(cls, v: Any) -> List[str]:
        """Parse JSON string to list if needed."""
        if isinstance(v, str):
            try:
                return json.loads(v)
            except json.JSONDecodeError:
                return [item.strip() for item in v.split(",") if item.strip()]
        return v or []


class HackathonCreate(HackathonBase):
    """Schema for creating a new hackathon."""
    is_active: bool = True
    is_featured: bool = False


class HackathonUpdate(BaseModel):
    """Schema for updating a hackathon."""
    title: Optional[str] = Field(None, min_length=1, max_length=500)
    description: Optional[str] = None
    organization: Optional[str] = Field(None, max_length=255)
    url: Optional[str] = Field(None, min_length=1, max_length=1000)
    registration_deadline: Optional[datetime] = None
    event_start_date: Optional[datetime] = None
    event_end_date: Optional[datetime] = None
    mode: Optional[HackathonMode] = None
    fee_type: Optional[HackathonFeeType] = None
    state_location: Optional[str] = Field(None, max_length=255)
    country: Optional[str] = Field(None, max_length=100)
    city: Optional[str] = Field(None, max_length=100)
    tags: Optional[List[str]] = None
    themes: Optional[List[str]] = None
    tech_stack: Optional[List[str]] = None
    prize_pool: Optional[str] = Field(None, max_length=500)
    prizes_details: Optional[str] = None
    image_url: Optional[str] = Field(None, max_length=1000)
    is_active: Optional[bool] = None
    is_featured: Optional[bool] = None


class HackathonResponse(HackathonBase):
    """Schema for hackathon response."""
    model_config = ConfigDict(from_attributes=True)

    id: int
    is_active: bool
    is_featured: bool
    created_at: datetime
    updated_at: datetime
    scraped_at: datetime

    @field_serializer("tags", "themes", "tech_stack")
    def serialize_json_array(self, value: List[str]) -> str:
        """Serialize list to JSON string for frontend compatibility."""
        return json.dumps(value)


class HackathonListResponse(BaseModel):
    """Schema for paginated hackathon list response."""
    model_config = ConfigDict(from_attributes=True)

    hackathons: List[HackathonResponse]
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


class HackathonFilterParams(BaseModel):
    """Query parameters for filtering hackathons."""
    mode: Optional[HackathonMode] = None
    fee_type: Optional[HackathonFeeType] = None
    state_location: Optional[str] = None
    country: Optional[str] = None
    city: Optional[str] = None
    platform_source: Optional[HackathonPlatformSource] = None
    tags: Optional[List[str]] = Field(default=None, description="Filter by tags (comma-separated)")
    themes: Optional[List[str]] = Field(default=None, description="Filter by themes (comma-separated)")
    tech_stack: Optional[List[str]] = Field(default=None, description="Filter by tech stack (comma-separated)")
    search: Optional[str] = Field(None, description="Search in title and organization")
    is_active: Optional[bool] = True
    registration_open: Optional[bool] = Field(None, description="Filter by open registration")
    min_prize_pool: Optional[int] = None
    start_date_from: Optional[datetime] = None
    start_date_to: Optional[datetime] = None

    @field_validator("tags", "themes", "tech_stack", mode="before")
    @classmethod
    def parse_comma_separated(cls, v: Any) -> Optional[List[str]]:
        """Parse comma-separated string to list."""
        if isinstance(v, str):
            return [item.strip() for item in v.split(",") if item.strip()]
        return v


class HackathonSortParams(BaseModel):
    """Query parameters for sorting hackathons."""
    sort_by: str = Field(
        default="registration_deadline",
        description="Field to sort by",
        pattern="^(registration_deadline|event_start_date|title|prize_pool|created_at|scraped_at)$"
    )
    sort_order: str = Field(
        default="asc",
        description="Sort order",
        pattern="^(asc|desc)$"
    )


class HackathonScrapedData(BaseModel):
    """Schema for scraped hackathon data before database insertion."""
    external_id: str
    platform_source: HackathonPlatformSource
    title: str
    description: Optional[str] = None
    organization: Optional[str] = None
    url: str
    registration_deadline: Optional[datetime] = None
    event_start_date: Optional[datetime] = None
    event_end_date: Optional[datetime] = None
    mode: HackathonMode = HackathonMode.ONLINE
    fee_type: HackathonFeeType = HackathonFeeType.FREE
    state_location: Optional[str] = None
    country: Optional[str] = None
    city: Optional[str] = None
    tags: List[str] = Field(default_factory=list)
    themes: List[str] = Field(default_factory=list)
    tech_stack: List[str] = Field(default_factory=list)
    prize_pool: Optional[str] = None
    prizes_details: Optional[str] = None
    image_url: Optional[str] = None


class HackathonFrontendResponse(BaseModel):
    """Schema matching the frontend expected format exactly."""
    id: str
    title: str
    organization: str
    platform_source: str
    url: str
    mode: str
    fee_type: str
    state_location: str
    registration_deadline: str
    event_date: str

    @classmethod
    def from_hackathon(cls, hackathon) -> "HackathonFrontendResponse":
        """Convert a Hackathon model to frontend format."""
        import json
        
        def parse_json(val):
            if not val:
                return []
            try:
                return json.loads(val)
            except json.JSONDecodeError:
                return [item.strip() for item in val.split(",") if item.strip()]
        
        # Get event date (use event_start_date or registration_deadline)
        event_date = hackathon.event_start_date or hackathon.registration_deadline
        
        return cls(
            id=str(hackathon.id),
            title=hackathon.title,
            organization=hackathon.organization or "Unknown",
            platform_source=hackathon.platform_source.value if hasattr(hackathon.platform_source, 'value') else str(hackathon.platform_source),
            url=hackathon.url,
            mode=hackathon.mode.value if hasattr(hackathon.mode, 'value') else str(hackathon.mode),
            fee_type=hackathon.fee_type.value if hasattr(hackathon.fee_type, 'value') else str(hackathon.fee_type),
            state_location=hackathon.state_location or "",
            registration_deadline=hackathon.registration_deadline.isoformat() if hackathon.registration_deadline else "",
            event_date=event_date.isoformat() if event_date else "",
        )