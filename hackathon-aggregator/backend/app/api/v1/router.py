"""API v1 router."""
from fastapi import APIRouter

from app.api.v1.endpoints import hackathons, users, scrape

api_router = APIRouter()

api_router.include_router(hackathons.router, prefix="/hackathons", tags=["hackathons"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(scrape.router, prefix="/scrape", tags=["scrape"])