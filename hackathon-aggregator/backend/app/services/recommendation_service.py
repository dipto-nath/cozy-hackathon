"""Recommendation service for personalized hackathon ranking."""
import json
from typing import List, Optional

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.hackathon import Hackathon
from app.models.user_preference import UserPreference
from app.schemas.user_preference import UserPreferencePayload


class RecommendationService:
    """Service for computing hackathon recommendations based on user preferences."""

    def __init__(self, db: AsyncSession):
        self.db = db

    def _parse_json_field(self, value: Optional[str]) -> List[str]:
        if not value:
            return []
        try:
            return json.loads(value)
        except json.JSONDecodeError:
            return [item.strip() for item in value.split(",") if item.strip()]

    def _calculate_tag_match_score(
        self,
        hackathon_tags: List[str],
        preferred_tags: List[str],
        weight: float = 1.0,
    ) -> float:
        if not preferred_tags or not hackathon_tags:
            return 0.0

        hackathon_tags_lower = [t.lower() for t in hackathon_tags]
        preferred_tags_lower = [t.lower() for t in preferred_tags]

        matches = sum(1 for tag in preferred_tags_lower if tag in hackathon_tags_lower)
        return (matches / len(preferred_tags_lower)) * weight

    def _calculate_mode_score(
        self,
        hackathon_mode: str,
        preferred_mode: str,
    ) -> float:
        if preferred_mode == "Any":
            return 1.0
        return 1.0 if hackathon_mode == preferred_mode else 0.0

    def _calculate_location_score(
        self,
        hackathon_state: Optional[str],
        hackathon_country: Optional[str],
        preferred_locations: List[str],
    ) -> float:
        if not preferred_locations:
            return 0.5

        locations_lower = [loc.lower() for loc in preferred_locations]

        if hackathon_state and hackathon_state.lower() in locations_lower:
            return 1.0

        if hackathon_country and hackathon_country.lower() in locations_lower:
            return 0.8

        return 0.0

    def _calculate_experience_score(
        self,
        hackathon_tags: List[str],
        experience_level: str,
    ) -> float:
        if experience_level == "beginner":
            beginner_keywords = ["beginner", "intro", "basic", "learning", "workshop", "tutorial"]
            tags_lower = [t.lower() for t in hackathon_tags]
            if any(kw in " ".join(tags_lower) for kw in beginner_keywords):
                return 1.0
            return 0.7
        elif experience_level in ["advanced", "expert"]:
            advanced_keywords = ["advanced", "expert", "competitive", "championship", "pro"]
            tags_lower = [t.lower() for t in hackathon_tags]
            if any(kw in " ".join(tags_lower) for kw in advanced_keywords):
                return 1.0
            return 0.6
        return 0.8

    def _calculate_prize_score(
        self,
        prize_pool: Optional[str],
        min_prize_pool: Optional[int],
    ) -> float:
        if not min_prize_pool:
            return 0.5
        if not prize_pool:
            return 0.0
        import re
        numbers = re.findall(r"[\d,]+", prize_pool.replace(",", ""))
        if not numbers:
            return 0.3
        try:
            max_prize = max(int(n) for n in numbers)
            if max_prize >= min_prize_pool:
                return 1.0
            return max_prize / min_prize_pool
        except (ValueError, ZeroDivisionError):
            return 0.3

    def _calculate_fee_score(self, fee_type: str, only_free: bool) -> float:
        if only_free:
            return 1.0 if fee_type == "Free" else 0.0
        return 1.0

    def _calculate_online_offline_score(
        self, mode: str, exclude_online: bool, exclude_offline: bool
    ) -> float:
        if exclude_online and mode == "Online":
            return 0.0
        if exclude_offline and mode in ["Offline", "Hybrid"]:
            return 0.0
        return 1.0

    async def score_hackathons(
        self,
        hackathons: List[Hackathon],
        preferences: UserPreferencePayload,
    ) -> List[tuple]:
        scored = []

        for hackathon in hackathons:
            score = 0.0
            max_score = 0.0

            hackathon_tags = self._parse_json_field(hackathon.tags)
            hackathon_themes = self._parse_json_field(hackathon.themes)
            hackathon_tech_stack = self._parse_json_field(hackathon.tech_stack)
            all_hackathon_tags = hackathon_tags + hackathon_themes + hackathon_tech_stack

            tech_score = self._calculate_tag_match_score(
                all_hackathon_tags, preferences.preferred_tech_stack or [], weight=3.0
            )
            score += tech_score
            max_score += 3.0

            theme_score = self._calculate_tag_match_score(
                all_hackathon_tags, preferences.preferred_themes or [], weight=2.0
            )
            score += theme_score
            max_score += 2.0

            mode_score = self._calculate_mode_score(
                hackathon.mode.value, preferences.preferred_mode.value
            )
            score += mode_score * 2.0
            max_score += 2.0

            location_score = self._calculate_location_score(
                hackathon.state_location,
                hackathon.country,
                preferences.preferred_locations or [],
            )
            score += location_score * 1.5
            max_score += 1.5

            exp_score = self._calculate_experience_score(
                all_hackathon_tags, preferences.experience_level.value
            )
            score += exp_score * 1.0
            max_score += 1.0

            prize_score = self._calculate_prize_score(
                hackathon.prize_pool, preferences.min_prize_pool
            )
            score += prize_score * 1.0
            max_score += 1.0

            fee_score = self._calculate_fee_score(
                hackathon.fee_type.value, preferences.only_free_events
            )
            score += fee_score * 1.0
            max_score += 1.0

            online_offline_score = self._calculate_online_offline_score(
                hackathon.mode.value,
                preferences.exclude_online,
                preferences.exclude_offline,
            )
            score += online_offline_score * 2.0
            max_score += 2.0

            final_score = (score / max_score * 100) if max_score > 0 else 0

            scored.append((hackathon, round(final_score, 2)))

        scored.sort(key=lambda x: x[1], reverse=True)
        return scored

    async def get_recommendations(
        self,
        user_id: Optional[str] = None,
        preferences: Optional[UserPreferencePayload] = None,
        limit: int = 20,
    ) -> List[tuple]:
        if user_id and not preferences:
            from app.services.user_preference_service import UserPreferenceService
            pref_service = UserPreferenceService(self.db)
            user_pref = await pref_service.get_by_user_id(user_id)
            if user_pref:
                preferences = UserPreferencePayload(
                    user_id=user_pref.user_id,
                    preferred_tech_stack=self._parse_json_field(user_pref.preferred_tech_stack),
                    preferred_themes=self._parse_json_field(user_pref.preferred_themes),
                    preferred_mode=user_pref.preferred_mode,
                    preferred_locations=self._parse_json_field(user_pref.preferred_locations),
                    experience_level=user_pref.experience_level,
                    min_prize_pool=user_pref.min_prize_pool,
                    only_free_events=user_pref.only_free_events,
                    exclude_online=user_pref.exclude_online,
                    exclude_offline=user_pref.exclude_offline,
                )

        if not preferences:
            preferences = UserPreferencePayload()

        from app.services.hackathon_service import HackathonService
        hackathon_service = HackathonService(self.db)
        hackathons = await hackathon_service.get_all_active()

        scored = await self.score_hackathons(hackathons, preferences)

        return scored[:limit]
