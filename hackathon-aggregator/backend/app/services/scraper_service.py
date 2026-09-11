"""Scraper service for orchestrating scraping tasks."""
import asyncio
import logging
from datetime import datetime
from typing import Dict, List, Optional

from app.scrapers.unstop import UnstopScraper
from app.scrapers.devfolio import DevfolioScraper
from app.services.hackathon_service import HackathonService
from sqlalchemy.ext.asyncio import AsyncSession

logger = logging.getLogger(__name__)


class ScraperService:
    """Service for managing and running scrapers."""

    def __init__(self, db: AsyncSession):
        self.db = db
        self.hackathon_service = HackathonService(db)
        self.scrapers = {
            "unstop": UnstopScraper,
            "devfolio": DevfolioScraper,
        }

    async def run_scraper(self, source: str) -> Dict:
        """Run a specific scraper."""
        if source not in self.scrapers:
            return {"error": f"Unknown scraper: {source}", "success": False}

        scraper_class = self.scrapers[source]
        try:
            async with scraper_class() as scraper:
                logger.info(f"Starting scrape for {source}")
                hackathons = await scraper.scrape_hackathons()
                logger.info(f"Scraped {len(hackathons)} hackathons from {source}")

                if hackathons:
                    created, updated = await self.hackathon_service.bulk_upsert_from_scraped(hackathons)
                    logger.info(f"Saved: {created} new, {updated} updated from {source}")
                    return {
                        "source": source,
                        "scraped": len(hackathons),
                        "created": created,
                        "updated": updated,
                        "success": True,
                    }
                return {
                    "source": source,
                    "scraped": 0,
                    "created": 0,
                    "updated": 0,
                    "success": True,
                }
        except Exception as e:
            logger.error(f"Error scraping {source}: {e}")
            return {"source": source, "error": str(e), "success": False}

    async def run_all_scrapers(self) -> Dict:
        """Run all scrapers concurrently."""
        logger.info("Starting scrape for all sources")
        results = {}

        # Run scrapers concurrently
        tasks = [self.run_scraper(source) for source in self.scrapers.keys()]
        completed = await asyncio.gather(*tasks, return_exceptions=True)

        for i, source in enumerate(self.scrapers.keys()):
            result = completed[i]
            if isinstance(result, Exception):
                results[source] = {"error": str(result), "success": False}
            else:
                results[source] = result

        total_scraped = sum(r.get("scraped", 0) for r in results.values())
        total_created = sum(r.get("created", 0) for r in results.values())
        total_updated = sum(r.get("updated", 0) for r in results.values())

        logger.info(f"Scraping complete: {total_scraped} scraped, {total_created} created, {total_updated} updated")

        return {
            "timestamp": datetime.utcnow().isoformat(),
            "sources": results,
            "total_scraped": total_scraped,
            "total_created": total_created,
            "total_updated": total_updated,
        }

    async def trigger_manual_scrape(self, sources: Optional[List[str]] = None) -> Dict:
        """Trigger manual scrape for specified sources or all."""
        if sources:
            results = {}
            for source in sources:
                if source in self.scrapers:
                    results[source] = await self.run_scraper(source)
                else:
                    results[source] = {"error": f"Unknown source: {source}", "success": False}
            return {"sources": results}
        return await self.run_all_scrapers()