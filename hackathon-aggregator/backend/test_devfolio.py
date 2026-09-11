"""Test script for the updated Devfolio scraper."""
import asyncio
import sys
sys.path.insert(0, '.')

from app.scrapers.devfolio import DevfolioScraper

async def test_devfolio():
    print("Testing Devfolio scraper...")
    async with DevfolioScraper() as scraper:
        hackathons = await scraper.scrape_hackathons()
        print(f"\nScraped {len(hackathons)} hackathons from Devfolio")
        for h in hackathons[:5]:
            print(f"  - {h.title}")
            print(f"    URL: {h.url}")
            print(f"    Mode: {h.mode}")
            print(f"    Fee: {h.fee_type}")
            print(f"    Start: {h.event_start_date}")
            print(f"    Themes: {h.themes}")
            print()

asyncio.run(test_devfolio())
