"""Hackathon API endpoints."""
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.schemas.hackathon import (
    HackathonFilterParams,
    HackathonFrontendResponse,
    HackathonResponse,
    HackathonSortParams,
)
from app.services.hackathon_service import HackathonService
from app.services.recommendation_service import RecommendationService
from app.schemas.user_preference import UserPreferencePayload
from app.models.user_preference import PreferredMode, ExperienceLevel

router = APIRouter()


@router.get(
    "",
    response_model=List[HackathonFrontendResponse],
    summary="List all hackathons",
    description="Get a list of hackathons with filtering and sorting options (frontend-compatible format).",
)
async def list_hackathons(
    mode: Optional[str] = Query(None, description="Filter by mode (Online/Offline/Hybrid)"),
    fee_type: Optional[str] = Query(None, description="Filter by fee type (Free/Paid)"),
    state_location: Optional[str] = Query(None, description="Filter by state/location"),
    country: Optional[str] = Query(None, description="Filter by country"),
    city: Optional[str] = Query(None, description="Filter by city"),
    platform_source: Optional[str] = Query(None, description="Filter by platform source"),
    tags: Optional[str] = Query(None, description="Comma-separated tags to filter by"),
    themes: Optional[str] = Query(None, description="Comma-separated themes to filter by"),
    tech_stack: Optional[str] = Query(None, description="Comma-separated tech stack to filter by"),
    search: Optional[str] = Query(None, description="Search in title and organization"),
    is_active: Optional[bool] = Query(True, description="Filter by active status"),
    registration_open: Optional[bool] = Query(None, description="Filter by open registration"),
    min_prize_pool: Optional[int] = Query(None, description="Minimum prize pool"),
    start_date_from: Optional[str] = Query(None, description="Event start date from (ISO format)"),
    start_date_to: Optional[str] = Query(None, description="Event start date to (ISO format)"),
    sort_by: str = Query("registration_deadline", description="Field to sort by"),
    sort_order: str = Query("desc", description="Sort order (asc/desc)"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(100, ge=1, le=100, description="Items per page"),
    db: AsyncSession = Depends(get_db),
) -> List[HackathonFrontendResponse]:
    service = HackathonService(db)

    from datetime import datetime
    filters = HackathonFilterParams(
        mode=mode,
        fee_type=fee_type,
        state_location=state_location,
        country=country,
        city=city,
        platform_source=platform_source,
        tags=tags.split(",") if tags else None,
        themes=themes.split(",") if themes else None,
        tech_stack=tech_stack.split(",") if tech_stack else None,
        search=search,
        is_active=is_active,
        registration_open=registration_open,
        min_prize_pool=min_prize_pool,
        start_date_from=datetime.fromisoformat(start_date_from) if start_date_from else None,
        start_date_to=datetime.fromisoformat(start_date_to) if start_date_to else None,
    )

    sort = HackathonSortParams(sort_by=sort_by, sort_order=sort_order)

    hackathons, total = await service.list_hackathons(filters, sort, page, page_size)

    return [HackathonFrontendResponse.from_hackathon(h) for h in hackathons]


@router.get(
    "/recommended",
    response_model=List[HackathonFrontendResponse],
    summary="Get recommended hackathons",
    description="Get hackathons sorted by relevance to user preferences.",
)
async def get_recommended_hackathons(
    user_id: Optional[str] = Query(None, description="User ID for personalized recommendations"),
    preferred_tech_stack: Optional[str] = Query(None, description="Comma-separated preferred tech stack"),
    preferred_themes: Optional[str] = Query(None, description="Comma-separated preferred themes"),
    preferred_mode: Optional[str] = Query("Any", description="Preferred mode"),
    preferred_locations: Optional[str] = Query(None, description="Comma-separated preferred locations"),
    experience_level: Optional[str] = Query("beginner", description="Experience level"),
    min_prize_pool: Optional[int] = Query(None, description="Minimum prize pool"),
    only_free_events: bool = Query(False, description="Only free events"),
    exclude_online: bool = Query(False, description="Exclude online events"),
    exclude_offline: bool = Query(False, description="Exclude offline events"),
    limit: int = Query(20, ge=1, le=100, description="Number of recommendations"),
    db: AsyncSession = Depends(get_db),
) -> List[HackathonFrontendResponse]:
    service = RecommendationService(db)

    preferences = UserPreferencePayload(
        user_id=user_id,
        preferred_tech_stack=preferred_tech_stack.split(",") if preferred_tech_stack else [],
        preferred_themes=preferred_themes.split(",") if preferred_themes else [],
        preferred_mode=PreferredMode(preferred_mode) if preferred_mode else PreferredMode.ANY,
        preferred_locations=preferred_locations.split(",") if preferred_locations else [],
        experience_level=ExperienceLevel(experience_level) if experience_level else ExperienceLevel.BEGINNER,
        min_prize_pool=min_prize_pool,
        only_free_events=only_free_events,
        exclude_online=exclude_online,
        exclude_offline=exclude_offline,
    )

    scored_hackathons = await service.get_recommendations(
        user_id=user_id,
        preferences=preferences,
        limit=limit,
    )

    return [HackathonFrontendResponse.from_hackathon(h) for h, score in scored_hackathons]


@router.get(
    "/stats",
    summary="Get hackathon statistics",
    description="Get statistics about hackathons in the database.",
)
async def get_hackathon_stats(
    db: AsyncSession = Depends(get_db),
) -> dict:
    service = HackathonService(db)
    return await service.get_stats()


@router.get(
    "/locations",
    summary="Get all unique state locations and countries",
    description="Get a mapping of all unique countries to their state locations available in the database.",
)
async def get_locations(
    db: AsyncSession = Depends(get_db),
) -> dict:
    from sqlalchemy import select
    from app.models.hackathon import Hackathon
    result = await db.execute(
        select(Hackathon.country, Hackathon.state_location)
        .where(Hackathon.is_active == True)
        .where(Hackathon.country.is_not(None))
        .where(Hackathon.country != "")
        .distinct()
    )
    
    locations_map = {}
    for country, state in result.all():
        if country not in locations_map:
            locations_map[country] = set()
        if state and state.strip():
            locations_map[country].add(state.strip())
            
    # Sort countries and states alphabetically
    return {
        country: sorted(list(states))
        for country, states in sorted(locations_map.items())
    }


@router.get(
    "/{hackathon_id}",
    response_model=HackathonResponse,
    summary="Get hackathon by ID",
    description="Get a single hackathon by its ID.",
)
async def get_hackathon(
    hackathon_id: int,
    db: AsyncSession = Depends(get_db),
) -> HackathonResponse:
    service = HackathonService(db)
    hackathon = await service.get_by_id(hackathon_id)

    if not hackathon:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Hackathon not found",
        )

    import json
    def parse_json(val):
        if not val:
            return []
        try:
            return json.loads(val)
        except json.JSONDecodeError:
            return [item.strip() for item in val.split(",") if item.strip()]

    return HackathonResponse(
        id=hackathon.id,
        external_id=hackathon.external_id,
        platform_source=hackathon.platform_source,
        title=hackathon.title,
        description=hackathon.description,
        organization=hackathon.organization,
        url=hackathon.url,
        registration_deadline=hackathon.registration_deadline,
        event_start_date=hackathon.event_start_date,
        event_end_date=hackathon.event_end_date,
        mode=hackathon.mode,
        fee_type=hackathon.fee_type,
        state_location=hackathon.state_location,
        country=hackathon.country,
        city=hackathon.city,
        tags=parse_json(hackathon.tags),
        themes=parse_json(hackathon.themes),
        tech_stack=parse_json(hackathon.tech_stack),
        prize_pool=hackathon.prize_pool,
        prizes_details=hackathon.prizes_details,
        image_url=hackathon.image_url,
        is_active=hackathon.is_active,
        is_featured=hackathon.is_featured,
        created_at=hackathon.created_at,
        updated_at=hackathon.updated_at,
        scraped_at=hackathon.scraped_at,
    )
