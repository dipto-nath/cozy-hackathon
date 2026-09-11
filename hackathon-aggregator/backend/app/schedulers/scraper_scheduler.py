"""Scraper scheduler using APScheduler."""
import logging
from typing import Optional

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.interval import IntervalTrigger

from app.core.config import settings
from app.core.database import db_manager
from app.services.scraper_service import ScraperService

logger = logging.getLogger(__name__)

_scheduler: Optional[AsyncIOScheduler] = None


async def run_scheduled_scrape():
    """Run scheduled scraping job."""
    logger.info("Running scheduled scrape job...")
    try:
        async with db_manager.session() as db:
            service = ScraperService(db)
            result = await service.run_all_scrapers()
            logger.info(f"Scheduled scrape completed: {result}")
    except Exception as e:
        logger.error(f"Error in scheduled scrape: {e}")


async def start_scheduler():
    """Start the background scheduler."""
    global _scheduler

    if _scheduler is not None:
        logger.warning("Scheduler already running")
        return

    _scheduler = AsyncIOScheduler(timezone=settings.scheduler_timezone)

    # Add scheduled job
    _scheduler.add_job(
        run_scheduled_scrape,
        IntervalTrigger(hours=settings.scheduler_scrape_interval_hours),
        id="scrape_hackathons",
        name="Scrape hackathons from all sources",
        replace_existing=True,
    )

    _scheduler.start()
    logger.info(f"Scheduler started with interval: {settings.scheduler_scrape_interval_hours} hours")

    # Run initial scrape on startup
    await run_scheduled_scrape()


async def stop_scheduler():
    """Stop the background scheduler."""
    global _scheduler

    if _scheduler is not None:
        _scheduler.shutdown()
        _scheduler = None
        logger.info("Scheduler stopped")


def get_scheduler() -> Optional[AsyncIOScheduler]:
    """Get the scheduler instance."""
    return _scheduler