import asyncio
import logging
from app.core.database import db_manager, init_db, close_db
from app.services.scraper_service import ScraperService

logging.basicConfig(level=logging.INFO)

async def main():
    await init_db()
    try:
        async with db_manager.session() as session:
            service = ScraperService(session)
            print("Starting Unstop scrape...")
            await service.run_scraper("unstop")
            print("Starting Devfolio scrape...")
            await service.run_scraper("devfolio")
            print("Done!")
    finally:
        await close_db()

if __name__ == "__main__":
    asyncio.run(main())
