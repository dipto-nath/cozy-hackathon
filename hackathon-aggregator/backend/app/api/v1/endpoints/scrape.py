"""Scraping API endpoints."""
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.schemas.common import MessageResponse, ScrapeTriggerResponse
from app.services.scraper_service import ScraperService

router = APIRouter()


@router.post(
    "/trigger",
    response_model=ScrapeTriggerResponse,
    summary="Trigger manual scrape",
    description="Manually trigger the scraping engine to fetch fresh data from Unstop and Devfolio. Admin only.",
)
async def trigger_scrape(
    sources: Optional[List[str]] = None,
    db: AsyncSession = Depends(get_db),
) -> ScrapeTriggerResponse:
    """Trigger manual scrape for specified sources or all."""
    from datetime import datetime

    service = ScraperService(db)

    if sources:
        # Validate sources
        valid_sources = ["unstop", "devfolio"]
        invalid = [s for s in sources if s not in valid_sources]
        if invalid:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid sources: {invalid}. Valid sources: {valid_sources}",
            )

    result = await service.trigger_manual_scrape(sources)

    return ScrapeTriggerResponse(
        message="Scraping triggered successfully",
        triggered_at=datetime.utcnow().isoformat(),
        sources=sources or ["unstop", "devfolio"],
        estimated_duration_seconds=120,
    )


@router.post(
    "/trigger/{source}",
    response_model=ScrapeTriggerResponse,
    summary="Trigger scrape for specific source",
    description="Manually trigger scraping for a specific source (unstop or devfolio).",
)
async def trigger_scrape_source(
    source: str,
    db: AsyncSession = Depends(get_db),
) -> ScrapeTriggerResponse:
    """Trigger manual scrape for a specific source."""
    from datetime import datetime

    valid_sources = ["unstop", "devfolio"]
    if source not in valid_sources:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid source: {source}. Valid sources: {valid_sources}",
        )

    service = ScraperService(db)
    result = await service.run_scraper(source)

    return ScrapeTriggerResponse(
        message=f"Scraping triggered for {source}",
        triggered_at=datetime.utcnow().isoformat(),
        sources=[source],
        estimated_duration_seconds=60,
    )


@router.get(
    "/status",
    summary="Get scraping status",
    description="Get the status of the last scraping run.",
)
async def get_scrape_status(
    db: AsyncSession = Depends(get_db),
) -> dict:
    """Get scraping status and statistics."""
    from app.services.hackathon_service import HackathonService

    service = HackathonService(db)
    stats = await service.get_stats()

    return {
        "last_scrape": None,  # Would need to track this in database
        "stats": stats,
        "sources": ["unstop", "devfolio"],
    }