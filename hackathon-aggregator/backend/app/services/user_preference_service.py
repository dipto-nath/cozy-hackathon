"""User preference service for database operations."""
import json
from typing import List, Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user_preference import UserPreference
from app.schemas.user_preference import UserPreferenceCreate, UserPreferenceUpdate


class UserPreferenceService:
    """Service for user preference database operations."""

    def __init__(self, db: AsyncSession):
        self.db = db

    def _serialize_json_fields(self, data: dict) -> dict:
        """Serialize list fields to JSON strings for database storage."""
        json_fields = ["preferred_tech_stack", "preferred_themes", "preferred_locations"]
        for field in json_fields:
            if field in data and data[field] is not None:
                data[field] = json.dumps(data[field])
        return data

    async def create(self, preference_data: UserPreferenceCreate) -> UserPreference:
        """Create new user preferences."""
        data = self._serialize_json_fields(preference_data.model_dump())
        preference = UserPreference(**data)
        self.db.add(preference)
        await self.db.commit()
        await self.db.refresh(preference)
        return preference

    async def get_by_user_id(self, user_id: str) -> Optional[UserPreference]:
        """Get preferences by user ID."""
        result = await self.db.execute(
            select(UserPreference).where(UserPreference.user_id == user_id)
        )
        return result.scalar_one_or_none()

    async def get_by_id(self, preference_id: int) -> Optional[UserPreference]:
        """Get preferences by ID."""
        result = await self.db.execute(
            select(UserPreference).where(UserPreference.id == preference_id)
        )
        return result.scalar_one_or_none()

    async def upsert(self, user_id: str, preference_data: UserPreferenceCreate) -> UserPreference:
        """Insert or update user preferences."""
        existing = await self.get_by_user_id(user_id)

        data = self._serialize_json_fields(preference_data.model_dump())

        if existing:
            for key, value in data.items():
                setattr(existing, key, value)
            await self.db.commit()
            await self.db.refresh(existing)
            return existing
        else:
            data["user_id"] = user_id
            preference = UserPreference(**data)
            self.db.add(preference)
            await self.db.commit()
            await self.db.refresh(preference)
            return preference

    async def update(self, user_id: str, update_data: UserPreferenceUpdate) -> Optional[UserPreference]:
        """Update user preferences."""
        preference = await self.get_by_user_id(user_id)
        if not preference:
            return None

        update_dict = self._serialize_json_fields(update_data.model_dump(exclude_unset=True))
        for key, value in update_dict.items():
            setattr(preference, key, value)

        await self.db.commit()
        await self.db.refresh(preference)
        return preference

    async def delete(self, user_id: str) -> bool:
        """Delete user preferences."""
        preference = await self.get_by_user_id(user_id)
        if not preference:
            return False

        await self.db.delete(preference)
        await self.db.commit()
        return True

    async def list_all(self, skip: int = 0, limit: int = 100) -> List[UserPreference]:
        """List all user preferences."""
        result = await self.db.execute(
            select(UserPreference).offset(skip).limit(limit)
        )
        return list(result.scalars().all())
