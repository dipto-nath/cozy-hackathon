"""User preference database model."""
import enum
from datetime import datetime
from typing import Optional

from sqlalchemy import (
    DateTime,
    Enum,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class ExperienceLevel(str, enum.Enum):
    """User experience level enumeration."""
    BEGINNER = "beginner"
    INTERMEDIATE = "intermediate"
    ADVANCED = "advanced"
    EXPERT = "expert"


class PreferredMode(str, enum.Enum):
    """Preferred hackathon mode."""
    ONLINE = "Online"
    OFFLINE = "Offline"
    HYBRID = "Hybrid"
    ANY = "Any"


class UserPreference(Base):
    """User preference model for personalized hackathon recommendations."""

    __tablename__ = "user_preferences"

    # Primary key
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)

    # User identification (can be linked to auth system later)
    user_id: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    email: Mapped[Optional[str]] = mapped_column(String(255), nullable=True, index=True)

    # Preferences
    preferred_tech_stack: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  # JSON array
    preferred_themes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  # JSON array
    preferred_mode: Mapped[PreferredMode] = mapped_column(
        Enum(PreferredMode, native_enum=False),
        nullable=False,
        default=PreferredMode.ANY,
    )
    preferred_locations: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  # JSON array
    experience_level: Mapped[ExperienceLevel] = mapped_column(
        Enum(ExperienceLevel, native_enum=False),
        nullable=False,
        default=ExperienceLevel.BEGINNER,
    )

    # Filtering preferences
    min_prize_pool: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    max_travel_distance_km: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    only_free_events: Mapped[bool] = mapped_column(default=False, nullable=False)
    exclude_online: Mapped[bool] = mapped_column(default=False, nullable=False)
    exclude_offline: Mapped[bool] = mapped_column(default=False, nullable=False)

    # Notification preferences
    email_notifications: Mapped[bool] = mapped_column(default=True, nullable=False)
    notify_before_days: Mapped[int] = mapped_column(default=7, nullable=False)
    notify_new_matches: Mapped[bool] = mapped_column(default=True, nullable=False)

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    # Constraints
    __table_args__ = (
        Index("ix_user_pref_user_id", "user_id"),
    )

    def __repr__(self) -> str:
        return f"<UserPreference(user_id='{self.user_id}', mode={self.preferred_mode.value})>"