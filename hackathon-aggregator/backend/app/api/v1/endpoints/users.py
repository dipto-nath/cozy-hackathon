"""User preference API endpoints."""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.schemas.common import MessageResponse
from app.schemas.user_preference import UserPreferenceCreate, UserPreferenceResponse, UserPreferenceUpdate
from app.services.user_preference_service import UserPreferenceService

router = APIRouter()


@router.post(
    "/preferences",
    response_model=UserPreferenceResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create or update user preferences",
    description="Save or update a user's hackathon preferences for personalized recommendations.",
)
async def create_or_update_preferences(
    preference_data: UserPreferenceCreate,
    db: AsyncSession = Depends(get_db),
) -> UserPreferenceResponse:
    """Create or update user preferences."""
    service = UserPreferenceService(db)
    preference = await service.upsert(preference_data.user_id, preference_data)
    return preference


@router.get(
    "/preferences/{user_id}",
    response_model=UserPreferenceResponse,
    summary="Get user preferences",
    description="Get a user's hackathon preferences by user ID.",
)
async def get_preferences(
    user_id: str,
    db: AsyncSession = Depends(get_db),
) -> UserPreferenceResponse:
    """Get user preferences by user ID."""
    service = UserPreferenceService(db)
    preference = await service.get_by_user_id(user_id)

    if not preference:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User preferences not found",
        )

    return preference


@router.patch(
    "/preferences/{user_id}",
    response_model=UserPreferenceResponse,
    summary="Update user preferences",
    description="Update a user's hackathon preferences.",
)
async def update_preferences(
    user_id: str,
    update_data: UserPreferenceUpdate,
    db: AsyncSession = Depends(get_db),
) -> UserPreferenceResponse:
    """Update user preferences."""
    service = UserPreferenceService(db)
    preference = await service.update(user_id, update_data)

    if not preference:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User preferences not found",
        )

    return preference


@router.delete(
    "/preferences/{user_id}",
    response_model=MessageResponse,
    summary="Delete user preferences",
    description="Delete a user's hackathon preferences.",
)
async def delete_preferences(
    user_id: str,
    db: AsyncSession = Depends(get_db),
) -> MessageResponse:
    """Delete user preferences."""
    service = UserPreferenceService(db)
    success = await service.delete(user_id)

    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User preferences not found",
        )

    return MessageResponse(message="User preferences deleted successfully")