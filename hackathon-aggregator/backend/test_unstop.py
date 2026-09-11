"""Test script for the updated Unstop scraper."""
import asyncio
import sys
sys.path.insert(0, '.')

from app.scrapers.unstop import UnstopScraper

async def test_unstop():
    print("Testing Unstop scraper...")
    async with UnstopScraper() as scraper:
        hackathons = await scraper.scrape_hackathons()
        print(f"\nScraped {len(hackathons)} hackathons from Unstop")
        for h in hackathons[:5]:
            print(f"  - {h.title}")
            print(f"    URL: {h.url}")
            print(f"    Mode: {h.mode}")
            print(f"    Fee: {h.fee_type}")
            print(f"    Reg deadline: {h.registration_deadline}")
            print()

asyncio.run(test_unstop())
