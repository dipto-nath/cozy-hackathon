"""Unstop.com scraper for hackathons."""
import asyncio
import httpx
import re
from datetime import datetime
from typing import List, Optional
from bs4 import BeautifulSoup

from app.core.config import settings
from app.scrapers.base import BaseScraper
from app.schemas.hackathon import HackathonScrapedData
from app.models.hackathon import HackathonMode, HackathonFeeType


# The real Unstop API endpoint discovered by intercepting browser network traffic.
# NOTE: The old api.unstop.com/api/public/opportunity/search endpoint always returns
# empty data (total=0) for non-browser clients. Use unstop.com/api/public/opportunity/search-result instead.
UNSTOP_API_URL = "https://unstop.com/api/public/opportunity/search-result"
UNSTOP_WEB_BASE = "https://unstop.com"


class UnstopScraper(BaseScraper):
    """Scraper for Unstop.com hackathons.

    Uses the correct search-result API endpoint (NOT the deprecated api.unstop.com endpoint).
    Fetches up to MAX_PAGES * PAGE_SIZE hackathons with open registration status.
    """

    base_url = UNSTOP_WEB_BASE
    platform_source = "unstop.com"

    PAGE_SIZE = 50
    MAX_PAGES = 6  # 50 * 6 = 300 hackathons max

    @property
    def source_name(self) -> str:
        return "Unstop"

    @property
    def platform_enum(self) -> str:
        return "unstop.com"

    async def scrape_hackathons(self) -> List[HackathonScrapedData]:
        """Scrape hackathons from Unstop."""
        hackathons = []
        try:
            all_items = await self._fetch_all_hackathons()
            for item in all_items:
                hackathon = self._parse_hackathon_item(item)
                if hackathon:
                    hackathons.append(hackathon)
        except Exception as e:
            print(f"Error scraping Unstop: {e}")
        return hackathons

    async def _fetch_all_hackathons(self) -> List[dict]:
        """Fetch all hackathon items across pages."""
        all_items: List[dict] = []

        first_response = await self._fetch_page(1)
        if not first_response:
            return all_items

        data = first_response.get("data", {})
        items = data.get("data", [])
        all_items.extend(items)

        total = data.get("total", 0)
        last_page = data.get("last_page", 1)
        last_page = min(last_page, self.MAX_PAGES)

        if last_page > 1:
            tasks = [self._fetch_page(p) for p in range(2, last_page + 1)]
            responses = await asyncio.gather(*tasks, return_exceptions=True)
            for resp in responses:
                if isinstance(resp, Exception):
                    print(f"Error fetching Unstop page: {resp}")
                    continue
                if resp:
                    all_items.extend(resp.get("data", {}).get("data", []))

        print(f"Fetched {len(all_items)} hackathons from Unstop (total available: {total})")
        return all_items

    async def _fetch_page(self, page: int) -> Optional[dict]:
        """Fetch a single page from the Unstop search-result API."""
        params = {
            "opportunity": "hackathons",
            "page": page,
            "per_page": self.PAGE_SIZE,
            "oppstatus": "open",
            "sortBy": "",
            "orderBy": "",
            "filter_condition": "",
        }
        headers = {
            "User-Agent": settings.scraper_user_agent,
            "Accept": "application/json, text/plain, */*",
            "Referer": f"{UNSTOP_WEB_BASE}/hackathons?oppstatus=open",
            "Origin": UNSTOP_WEB_BASE,
        }

        async with self._semaphore:
            delay = self._get_random_delay()
            await asyncio.sleep(delay)

            async with httpx.AsyncClient(
                timeout=settings.scraper_timeout,
                headers=headers,
                follow_redirects=True,
            ) as client:
                response = await client.get(UNSTOP_API_URL, params=params)
                response.raise_for_status()
                return response.json()

    def _parse_hackathon_item(self, item: dict) -> Optional[HackathonScrapedData]:
        """Parse a single hackathon item from Unstop API response."""
        try:
            external_id = str(item.get("id", ""))
            if not external_id:
                return None

            title = item.get("title", "").strip()
            if not title:
                return None

            # Build URL from public_url or seo_url
            public_url = item.get("public_url") or item.get("seo_url") or ""
            url = f"{UNSTOP_WEB_BASE}/{public_url}" if public_url else f"{UNSTOP_WEB_BASE}/hackathons"

            # Dates — end_date is registration deadline; no separate start_date in listing API
            reg_deadline = self._parse_unstop_date(item.get("end_date"))
            event_end = reg_deadline

            # Mode: region field = "online" | "offline" | "hybrid"
            region = (item.get("region") or "").lower()
            if "hybrid" in region:
                mode = HackathonMode.HYBRID
            elif "online" in region:
                mode = HackathonMode.ONLINE
            else:
                mode = HackathonMode.OFFLINE

            # Fee type
            is_paid = bool(item.get("isPaid"))
            fee_type = HackathonFeeType.PAID if is_paid else HackathonFeeType.FREE

            # Location from address_with_country_logo (a dict, not a list)
            address_info = item.get("address_with_country_logo")
            if isinstance(address_info, dict):
                city = address_info.get("city") or ""
                state = address_info.get("state") or ""
                country_info = address_info.get("country") or {}
                country = country_info.get("name") if isinstance(country_info, dict) else "India"
                country = country or "India"
            else:
                city = state = ""
                country = "India"
            state_location = state or city or None

            # Tags from required_skills[].skill_name
            skills_raw = item.get("required_skills") or []
            tags = [
                s["skill_name"] for s in skills_raw
                if isinstance(s, dict) and s.get("skill_name")
            ]

            # Prize pool: prizes[].rank as label, prizes[].cash as amount
            prizes_raw = item.get("prizes") or []
            prize_pool = self._format_prize(prizes_raw)

            # Organization
            org = item.get("organisation") or {}
            organization = org.get("name") if isinstance(org, dict) else None

            # Image
            image_url = item.get("thumb") or item.get("logoUrl2")

            # Description (HTML → plain text)
            desc_html = item.get("details") or ""
            description = self._clean_html(desc_html) if desc_html else None

            return self._create_hackathon_data(
                external_id=external_id,
                title=title,
                url=url,
                description=description,
                organization=organization,
                registration_deadline=reg_deadline,
                event_start_date=None,
                event_end_date=event_end,
                mode=mode,
                fee_type=fee_type,
                state_location=state_location,
                country=country,
                tags=tags[:10],
                themes=[],
                tech_stack=[],
                prize_pool=prize_pool,
                image_url=image_url,
            )
        except Exception as e:
            print(f"Error parsing Unstop hackathon: {e}")
            return None

    def _parse_unstop_date(self, date_str: Optional[str]) -> Optional[datetime]:
        """Parse a date string from Unstop API."""
        if not date_str:
            return None
        try:
            clean = date_str.replace("Z", "+00:00")
            return datetime.fromisoformat(clean)
        except Exception:
            return self.parse_date(date_str)

    def _extract_state(self, location: str) -> Optional[str]:
        """Extract Indian state from a location string."""
        if not location:
            return None
        states = [
            "Maharashtra", "Karnataka", "Tamil Nadu", "Delhi", "Gujarat", "Rajasthan",
            "Uttar Pradesh", "West Bengal", "Kerala", "Telangana", "Andhra Pradesh",
            "Madhya Pradesh", "Punjab", "Haryana", "Bihar", "Odisha", "Jharkhand",
            "Assam", "Chhattisgarh", "Himachal Pradesh", "Uttarakhand", "Goa",
        ]
        for state in states:
            if state.lower() in location.lower():
                return state
        return location.split(",")[-1].strip() if "," in location else location

    def _format_prize(self, prizes: List) -> Optional[str]:
        """Format prize data from Unstop API response (prizes[].rank + prizes[].cash)."""
        if not prizes:
            return None
        parts = []
        for prize in prizes:
            if isinstance(prize, dict):
                amount = prize.get("cash") or prize.get("amount") or prize.get("value")
                desc = prize.get("rank") or prize.get("description") or prize.get("title")
                if amount:
                    currency = "₹" if prize.get("currency") == "fa-rupee" else ""
                    parts.append(f"{desc}: {currency}{amount}" if desc else f"{currency}{amount}")
        return "; ".join(parts) if parts else None

    def _clean_html(self, html: str) -> str:
        """Strip HTML tags from description text."""
        if not html:
            return ""
        soup = BeautifulSoup(html, "html.parser")
        return soup.get_text(separator=" ", strip=True)[:5000]
