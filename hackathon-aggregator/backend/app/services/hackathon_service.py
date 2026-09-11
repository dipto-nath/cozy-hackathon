"""Hackathon service for database operations."""
from datetime import datetime
from typing import List, Optional, Tuple

from sqlalchemy import and_, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.hackathon import Hackathon, HackathonFeeType, HackathonMode, HackathonPlatformSource
from app.schemas.hackathon import HackathonCreate, HackathonFilterParams, HackathonScrapedData, HackathonSortParams, HackathonUpdate


class HackathonService:
    """Service for hackathon database operations."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(self, hackathon_data: HackathonCreate) -> Hackathon:
        hackathon = Hackathon(**hackathon_data.model_dump())
        self.db.add(hackathon)
        await self.db.commit()
        await self.db.refresh(hackathon)
        return hackathon

    async def create_from_scraped(self, scraped_data: HackathonScrapedData) -> Hackathon:
        data = scraped_data.model_dump()
        for field in ["tags", "themes", "tech_stack"]:
            if field in data and data[field] is not None:
                import json
                data[field] = json.dumps(data[field])

        hackathon = Hackathon(**data)
        self.db.add(hackathon)
        await self.db.commit()
        await self.db.refresh(hackathon)
        return hackathon

    async def get_by_id(self, hackathon_id: int) -> Optional[Hackathon]:
        result = await self.db.execute(select(Hackathon).where(Hackathon.id == hackathon_id))
        return result.scalar_one_or_none()

    async def get_by_external_id(self, external_id: str, platform: HackathonPlatformSource) -> Optional[Hackathon]:
        result = await self.db.execute(
            select(Hackathon).where(
                and_(
                    Hackathon.external_id == external_id,
                    Hackathon.platform_source == platform,
                )
            )
        )
        return result.scalar_one_or_none()

    async def upsert_from_scraped(self, scraped_data: HackathonScrapedData) -> Tuple[Hackathon, bool]:
        existing = await self.get_by_external_id(scraped_data.external_id, scraped_data.platform_source)

        data = scraped_data.model_dump()
        import json
        for field in ["tags", "themes", "tech_stack"]:
            if field in data and data[field] is not None:
                data[field] = json.dumps(data[field])

        if existing:
            for key, value in data.items():
                setattr(existing, key, value)
            existing.updated_at = datetime.utcnow()
            existing.scraped_at = datetime.utcnow()
            await self.db.commit()
            await self.db.refresh(existing)
            return existing, False
        else:
            hackathon = Hackathon(**data)
            self.db.add(hackathon)
            await self.db.commit()
            await self.db.refresh(hackathon)
            return hackathon, True

    async def bulk_upsert_from_scraped(self, hackathons_data: List[HackathonScrapedData]) -> Tuple[int, int]:
        created = 0
        updated = 0

        for scraped_data in hackathons_data:
            _, is_new = await self.upsert_from_scraped(scraped_data)
            if is_new:
                created += 1
            else:
                updated += 1

        return created, updated

    async def list_hackathons(
        self,
        filters: HackathonFilterParams,
        sort: HackathonSortParams,
        page: int = 1,
        page_size: int = 20,
    ) -> Tuple[List[Hackathon], int]:
        query = select(Hackathon)
        conditions = []

        if filters.is_active is not None:
            conditions.append(Hackathon.is_active == filters.is_active)

        if filters.mode:
            conditions.append(Hackathon.mode == filters.mode)

        if filters.fee_type:
            conditions.append(Hackathon.fee_type == filters.fee_type)

        if filters.state_location:
            conditions.append(Hackathon.state_location.ilike(f"%{filters.state_location}%"))

        if filters.country:
            conditions.append(Hackathon.country.ilike(f"%{filters.country}%"))

        if filters.city:
            conditions.append(Hackathon.city.ilike(f"%{filters.city}%"))

        if filters.platform_source:
            conditions.append(Hackathon.platform_source == filters.platform_source)

        if filters.search:
            search_term = f"%{filters.search}%"
            conditions.append(
                or_(
                    Hackathon.title.ilike(search_term),
                    Hackathon.organization.ilike(search_term),
                )
            )

        if filters.registration_open is not None:
            now = datetime.utcnow()
            if filters.registration_open:
                conditions.append(
                    and_(
                        Hackathon.registration_deadline.is_not(None),
                        Hackathon.registration_deadline > now,
                    )
                )
            else:
                conditions.append(
                    or_(
                        Hackathon.registration_deadline.is_(None),
                        Hackathon.registration_deadline <= now,
                    )
                )

        if filters.start_date_from:
            conditions.append(Hackathon.event_start_date >= filters.start_date_from)

        if filters.start_date_to:
            conditions.append(Hackathon.event_start_date <= filters.start_date_to)

        if filters.tags:
            for tag in filters.tags:
                conditions.append(Hackathon.tags.ilike(f"%{tag}%"))

        if filters.themes:
            for theme in filters.themes:
                conditions.append(Hackathon.themes.ilike(f"%{theme}%"))

        if filters.tech_stack:
            for tech in filters.tech_stack:
                conditions.append(Hackathon.tech_stack.ilike(f"%{tech}%"))

        if conditions:
            query = query.where(and_(*conditions))

        count_query = select(func.count()).select_from(query.subquery())
        total_result = await self.db.execute(count_query)
        total = total_result.scalar() or 0

        sort_column = getattr(Hackathon, sort.sort_by, Hackathon.registration_deadline)
        if sort.sort_order == "desc":
            query = query.order_by(sort_column.desc().nullslast())
        else:
            query = query.order_by(sort_column.asc().nullslast())

        offset = (page - 1) * page_size
        query = query.offset(offset).limit(page_size)

        result = await self.db.execute(query)
        hackathons = result.scalars().all()

        return list(hackathons), total

    async def get_all_active(self) -> List[Hackathon]:
        result = await self.db.execute(
            select(Hackathon).where(Hackathon.is_active == True)
        )
        return list(result.scalars().all())

    async def update(self, hackathon_id: int, update_data: HackathonUpdate) -> Optional[Hackathon]:
        hackathon = await self.get_by_id(hackathon_id)
        if not hackathon:
            return None

        update_dict = update_data.model_dump(exclude_unset=True)
        import json
        for field in ["tags", "themes", "tech_stack"]:
            if field in update_dict and update_dict[field] is not None:
                update_dict[field] = json.dumps(update_dict[field])

        for key, value in update_dict.items():
            setattr(hackathon, key, value)

        hackathon.updated_at = datetime.utcnow()
        await self.db.commit()
        await self.db.refresh(hackathon)
        return hackathon

    async def delete(self, hackathon_id: int) -> bool:
        hackathon = await self.get_by_id(hackathon_id)
        if not hackathon:
            return False

        hackathon.is_active = False
        hackathon.updated_at = datetime.utcnow()
        await self.db.commit()
        return True

    async def get_stats(self) -> dict:
        total_result = await self.db.execute(select(func.count(Hackathon.id)))
        total = total_result.scalar() or 0

        active_result = await self.db.execute(
            select(func.count(Hackathon.id)).where(Hackathon.is_active == True)
        )
        active = active_result.scalar() or 0

        by_platform_result = await self.db.execute(
            select(Hackathon.platform_source, func.count(Hackathon.id))
            .where(Hackathon.is_active == True)
            .group_by(Hackathon.platform_source)
        )
        by_platform = {row[0].value: row[1] for row in by_platform_result.all()}

        by_mode_result = await self.db.execute(
            select(Hackathon.mode, func.count(Hackathon.id))
            .where(Hackathon.is_active == True)
            .group_by(Hackathon.mode)
        )
        by_mode = {row[0].value: row[1] for row in by_mode_result.all()}

        return {
            "total": total,
            "active": active,
            "by_platform": by_platform,
            "by_mode": by_mode,
        }