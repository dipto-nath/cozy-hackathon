"""Devfolio.co scraper for hackathons."""
import asyncio
import httpx
from datetime import datetime
from typing import List, Optional

from app.core.config import settings
from app.scrapers.base import BaseScraper
from app.schemas.hackathon import HackathonScrapedData
from app.models.hackathon import HackathonMode, HackathonFeeType


# The correct Devfolio API lives on the api subdomain, NOT devfolio.co/api/*
DEVFOLIO_API_BASE = "https://api.devfolio.co"
DEVFOLIO_WEB_BASE = "https://devfolio.co"


class DevfolioScraper(BaseScraper):
    """Scraper for Devfolio.co hackathons.

    Uses the public REST API at api.devfolio.co/api/hackathons.
    The old devfolio.co/api/* endpoints return 404 and have been removed.
    """

    base_url = DEVFOLIO_WEB_BASE
    platform_source = "devfolio.co"

    PAGE_SIZE = 200
    MAX_PAGES = 10

    @property
    def source_name(self) -> str:
        return "Devfolio"

    @property
    def platform_enum(self) -> str:
        return "devfolio.co"

    async def scrape_hackathons(self) -> List[HackathonScrapedData]:
        """Scrape hackathons from Devfolio public API."""
        hackathons = []
        try:
            all_items = await self._fetch_all_hackathons()
            for item in all_items:
                hackathon = self._parse_hackathon_item(item)
                if hackathon:
                    hackathons.append(hackathon)
        except Exception as e:
            print(f"Error scraping Devfolio: {e}")

        seen = set()
        unique = []
        for h in hackathons:
            if h.external_id not in seen:
                seen.add(h.external_id)
                unique.append(h)
        return unique

    async def _fetch_all_hackathons(self) -> List[dict]:
        """Fetch all hackathons across pages from api.devfolio.co."""
        all_items: List[dict] = []

        first_response = await self._fetch_page(1)
        if not first_response:
            return all_items

        results = first_response.get("result", [])
        all_items.extend(results)

        total_pages = min(first_response.get("pages", 1), self.MAX_PAGES)

        if total_pages > 1:
            tasks = [self._fetch_page(p) for p in range(2, total_pages + 1)]
            responses = await asyncio.gather(*tasks, return_exceptions=True)
            for resp in responses:
                if isinstance(resp, Exception):
                    print(f"Error fetching Devfolio page: {resp}")
                    continue
                if resp:
                    all_items.extend(resp.get("result", []))

        return all_items

    async def _fetch_page(self, page: int) -> Optional[dict]:
        """Fetch a single page from the Devfolio API."""
        url = f"{DEVFOLIO_API_BASE}/api/hackathons"
        params = {"page": page, "page_size": self.PAGE_SIZE}
        headers = {
            "User-Agent": settings.scraper_user_agent,
            "Accept": "application/json",
            "Referer": f"{DEVFOLIO_WEB_BASE}/hackathons",
            "Origin": DEVFOLIO_WEB_BASE,
        }

        async with self._semaphore:
            delay = self._get_random_delay()
            await asyncio.sleep(delay)

            async with httpx.AsyncClient(
                timeout=settings.scraper_timeout,
                headers=headers,
                follow_redirects=True,
            ) as client:
                response = await client.get(url, params=params)
                response.raise_for_status()
                return response.json()

    def _parse_hackathon_item(self, item: dict) -> Optional[HackathonScrapedData]:
        """Parse a single hackathon from the Devfolio API response."""
        try:
            slug = item.get("slug") or item.get("name") or ""
            if not slug:
                return None

            title = item.get("name", "").strip()
            if not title:
                return None

            setting = item.get("hackathon_setting") or {}
            subdomain = setting.get("subdomain") or slug
            url = f"https://{subdomain}.devfolio.co"

            reg_deadline = self._parse_devfolio_date(
                setting.get("reg_ends_at") or item.get("ends_at")
            )
            event_start = self._parse_devfolio_date(item.get("starts_at"))
            event_end = self._parse_devfolio_date(item.get("ends_at"))

            is_online = item.get("is_online", False)
            is_hybrid = setting.get("is_hybrid", False)
            if is_hybrid:
                mode = HackathonMode.HYBRID
            elif is_online:
                mode = HackathonMode.ONLINE
            else:
                mode = HackathonMode.OFFLINE

            is_paid = setting.get("paid", False)
            fee_type = HackathonFeeType.PAID if is_paid else HackathonFeeType.FREE

            city = item.get("city") or ""
            state = item.get("state") or ""
            country = item.get("country") or "India"
            state_location = state or city or None

            themes_raw = item.get("themes") or []
            themes = [t["name"] for t in themes_raw if isinstance(t, dict) and t.get("name")]

            prizes_raw = item.get("prizes") or []
            prize_pool = self._format_prize(prizes_raw)

            image_url = item.get("cover_img") or setting.get("logo")

            return self._create_hackathon_data(
                external_id=slug,
                title=title,
                url=url,
                description=item.get("desc", "")[:5000] if item.get("desc") else None,
                organization=None,
                registration_deadline=reg_deadline,
                event_start_date=event_start,
                event_end_date=event_end,
                mode=mode,
                fee_type=fee_type,
                state_location=state_location,
                country=country if country else "India",
                tags=[],
                themes=themes,
                tech_stack=[],
                prize_pool=prize_pool,
                image_url=image_url,
            )
        except Exception as e:
            print(f"Error parsing Devfolio hackathon item: {e}")
            return None

    def _parse_devfolio_date(self, date_str: Optional[str]) -> Optional[datetime]:
        """Parse ISO date strings from the Devfolio API."""
        if not date_str:
            return None
        try:
            clean = date_str.replace("Z", "+00:00")
            return datetime.fromisoformat(clean)
        except Exception:
            return self.parse_date(date_str)

    def _format_prize(self, prizes: List) -> Optional[str]:
        """Format prize data into a readable string."""
        if not prizes:
            return None
        parts = []
        for p in prizes:
            if isinstance(p, dict):
                amount = p.get("amount") or p.get("value") or p.get("prize")
                desc = p.get("description") or p.get("title") or p.get("name")
                if amount:
                    parts.append(f"{desc}: {amount}" if desc else str(amount))
            elif isinstance(p, str):
                parts.append(p)
        return "; ".join(parts) if parts else None
