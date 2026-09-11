"""Base scraper class with common functionality."""
import asyncio
import random
from abc import ABC, abstractmethod
from datetime import datetime
from typing import List, Optional

import httpx
from bs4 import BeautifulSoup
from playwright.async_api import Browser, BrowserContext, Page, async_playwright

from app.core.config import settings
from app.schemas.hackathon import HackathonScrapedData


class BaseScraper(ABC):
    """Abstract base class for all scrapers."""

    base_url: str = ""
    platform_source: str = ""

    def __init__(self) -> None:
        self.browser: Optional[Browser] = None
        self.context: Optional[BrowserContext] = None
        self._semaphore: Optional[asyncio.Semaphore] = None

    @property
    @abstractmethod
    def source_name(self) -> str:
        """Return the platform source name."""
        pass

    @property
    @abstractmethod
    def platform_enum(self) -> str:
        """Return the platform enum value."""
        pass

    async def initialize(self) -> None:
        """Initialize browser and context."""
        if self._semaphore is None:
            self._semaphore = asyncio.Semaphore(settings.scraper_concurrent_limit)

        playwright = await async_playwright().start()
        self.browser = await playwright.chromium.launch(
            headless=True,
            args=[
                "--disable-blink-features=AutomationControlled",
                "--disable-dev-shm-usage",
                "--no-sandbox",
                "--disable-setuid-sandbox",
            ],
        )
        self.context = await self.browser.new_context(
            user_agent=settings.scraper_user_agent,
            viewport={"width": 1920, "height": 1080},
            locale="en-US",
            timezone_id="UTC",
        )
        await self.context.add_init_script("""
            Object.defineProperty(navigator, 'webdriver', {
                get: () => undefined
            });
        """)

    async def close(self) -> None:
        """Close browser and cleanup."""
        if self.context:
            await self.context.close()
        if self.browser:
            await self.browser.close()

    async def __aenter__(self) -> "BaseScraper":
        await self.initialize()
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb) -> None:
        await self.close()

    def _get_random_delay(self) -> float:
        """Get random delay between requests."""
        return random.uniform(settings.scraper_delay_min, settings.scraper_delay_max)

    async def _rate_limited_request(self, func, *args, **kwargs):
        """Execute a function with rate limiting."""
        async with self._semaphore:
            delay = self._get_random_delay()
            await asyncio.sleep(delay)
            return await func(*args, **kwargs)

    async def fetch_page(self, url: str, wait_for_selector: Optional[str] = None) -> Page:
        """Fetch a page with Playwright and return the page object."""
        if not self.context:
            raise RuntimeError("Scraper not initialized. Call initialize() first.")

        page = await self.context.new_page()
        try:
            await page.goto(url, wait_until="networkidle", timeout=settings.scraper_timeout * 1000)
            if wait_for_selector:
                await page.wait_for_selector(wait_for_selector, timeout=settings.scraper_timeout * 1000)
            return page
        except Exception:
            await page.close()
            raise

    async def fetch_html(self, url: str) -> str:
        """Fetch HTML content using httpx for simpler pages."""
        async with httpx.AsyncClient(
            timeout=settings.scraper_timeout,
            headers={"User-Agent": settings.scraper_user_agent},
            follow_redirects=True,
        ) as client:
            response = await client.get(url)
            response.raise_for_status()
            return response.text

    def parse_html(self, html: str) -> BeautifulSoup:
        """Parse HTML with BeautifulSoup."""
        return BeautifulSoup(html, "lxml")

    def extract_text(self, element, selector: str, default: str = "") -> str:
        """Safely extract text from an element."""
        try:
            found = element.select_one(selector)
            return found.get_text(strip=True) if found else default
        except Exception:
            return default

    def extract_attribute(self, element, selector: str, attr: str, default: str = "") -> str:
        """Safely extract attribute from an element."""
        try:
            found = element.select_one(selector)
            return found.get(attr, default) if found else default
        except Exception:
            return default

    def parse_date(self, date_str: str) -> Optional[datetime]:
        """Parse date string to datetime. Override in subclasses for specific formats."""
        if not date_str:
            return None
        formats = [
            "%Y-%m-%d",
            "%d %b %Y",
            "%d %B %Y",
            "%b %d, %Y",
            "%B %d, %Y",
            "%Y-%m-%dT%H:%M:%S",
            "%Y-%m-%dT%H:%M:%SZ",
            "%Y-%m-%dT%H:%M:%S.%fZ",
        ]
        for fmt in formats:
            try:
                return datetime.strptime(date_str.strip(), fmt)
            except ValueError:
                continue
        return None

    @abstractmethod
    async def scrape_hackathons(self) -> List[HackathonScrapedData]:
        """Scrape hackathons from the platform. Must be implemented by subclasses."""
        pass

    def _create_hackathon_data(
        self,
        external_id: str,
        title: str,
        url: str,
        **kwargs,
    ) -> HackathonScrapedData:
        """Create a HackathonScrapedData object with common fields."""
        return HackathonScrapedData(
            external_id=external_id,
            platform_source=self.platform_enum,
            title=title,
            url=url,
            **kwargs,
        )