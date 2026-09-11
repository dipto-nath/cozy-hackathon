"""Hackathon database model."""
import enum
from datetime import datetime
from typing import Optional

from sqlalchemy import (
    DateTime,
    Enum,
    Index,
    Integer,
    String,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class HackathonMode(str, enum.Enum):
    """Hackathon mode enumeration."""
    ONLINE = "Online"
    OFFLINE = "Offline"
    HYBRID = "Hybrid"


class HackathonFeeType(str, enum.Enum):
    """Hackathon fee type enumeration."""
    FREE = "Free"
    PAID = "Paid"


class HackathonPlatformSource(str, enum.Enum):
    """Source platform enumeration."""
    UNSTOP = "unstop.com"
    DEVFOLIO = "devfolio.co"
    DEVPOST = "devpost.com"
    MLH = "mlh.io"
    OTHER = "other"


class Hackathon(Base):
    """Hackathon model for storing aggregated hackathon data."""

    __tablename__ = "hackathons"

    # Primary key
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)

    # Core identification
    external_id: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    platform_source: Mapped[HackathonPlatformSource] = mapped_column(
        Enum(HackathonPlatformSource, native_enum=False),
        nullable=False,
        index=True,
    )

    # Basic info
    title: Mapped[str] = mapped_column(String(500), nullable=False, index=True)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    organization: Mapped[Optional[str]] = mapped_column(String(255), nullable=True, index=True)
    url: Mapped[str] = mapped_column(String(1000), nullable=False)

    # Dates
    registration_deadline: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True, index=True
    )
    event_start_date: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True, index=True
    )
    event_end_date: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    # Classification
    mode: Mapped[HackathonMode] = mapped_column(
        Enum(HackathonMode, native_enum=False),
        nullable=False,
        default=HackathonMode.ONLINE,
        index=True,
    )
    fee_type: Mapped[HackathonFeeType] = mapped_column(
        Enum(HackathonFeeType, native_enum=False),
        nullable=False,
        default=HackathonFeeType.FREE,
        index=True,
    )
    state_location: Mapped[Optional[str]] = mapped_column(String(255), nullable=True, index=True)
    country: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    city: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)

    # Tags and themes
    tags: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  # JSON array as string
    themes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  # JSON array as string
    tech_stack: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  # JSON array as string

    # Prizes and rewards
    prize_pool: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    prizes_details: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Additional metadata
    image_url: Mapped[Optional[str]] = mapped_column(String(1000), nullable=True)
    is_active: Mapped[bool] = mapped_column(default=True, nullable=False, index=True)
    is_featured: Mapped[bool] = mapped_column(default=False, nullable=False)

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )
    scraped_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False, index=True
    )

    # Constraints
    __table_args__ = (
        UniqueConstraint("external_id", "platform_source", name="uq_hackathon_external_platform"),
        Index("ix_hackathon_search", "title", "organization"),
        Index("ix_hackathon_dates_active", "is_active", "registration_deadline", "event_start_date"),
    )

    def __repr__(self) -> str:
        return f"<Hackathon(id={self.id}, title='{self.title}', platform={self.platform_source.value})>"