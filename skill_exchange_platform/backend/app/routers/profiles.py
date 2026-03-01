from fastapi import APIRouter, Depends, HTTPException
from app.services.firebase import verify_token
from app.services import db as db_module
from app.schemas.user import UserProfileUpdate, UserProfileDB

router = APIRouter()


def get_current_user(token_data: dict = Depends(verify_token)):
    return token_data.get("uid")


async def compute_reputation(user_id: str):
    total_score = 0
    total_ratings = 0
    cursor = db_module.db.ratings.find({"ratee_id": user_id})
    async for rating in cursor:
        total_score += rating.get("score", 0)
        total_ratings += 1
    reputation = (total_score / total_ratings) if total_ratings > 0 else 0.0
    return reputation, total_ratings


@router.get("/me/", response_model=UserProfileDB)
async def read_profile(uid: str = Depends(get_current_user)):
    print(f"[PROFILES] read_profile called with uid={uid}")
    user = await db_module.db.users.find_one({"_id": uid})
    if not user:
        # auto-create minimal profile when missing
        print(f"[PROFILES] no existing profile for {uid}, creating default")
        default_profile = {
            "_id": uid,
            "name": "User",
            "email": f"{uid}@skillexchange.local",
            "availability": "Not set",
            "skills_offered": [],
            "skills_wanted": [],
            "reputation": 0.0,
            "total_ratings": 0,
        }
        await db_module.db.users.insert_one(default_profile)
        user = default_profile
    reputation, total_ratings = await compute_reputation(uid)
    user["reputation"] = reputation
    user["total_ratings"] = total_ratings
    user["id"] = str(user["_id"])
    return user


@router.post("/", response_model=UserProfileDB)
async def create_profile(
    data: UserProfileUpdate, uid: str = Depends(get_current_user)
):
    """Create a new user profile (called on first login)"""
    existing = await db_module.db.users.find_one({"_id": uid})
    if existing:
        raise HTTPException(status_code=400, detail="User profile already exists")
    
    profile_data = {
        "_id": uid,
        "name": data.name or "User",
        "email": data.email or f"{uid}@skillexchange.local",
        "availability": data.availability or "Not set",
        "skills_offered": data.skills_offered or [],
        "skills_wanted": data.skills_wanted or [],
        "reputation": 0.0,
        "total_ratings": 0,
    }
    result = await db_module.db.users.insert_one(profile_data)
    profile_data["id"] = str(profile_data["_id"])
    return profile_data


@router.put("/me/", response_model=UserProfileDB)
async def update_profile(
    data: UserProfileUpdate, uid: str = Depends(get_current_user)
):
    update_data = {k: v for k, v in data.dict().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No data provided")
    await db_module.db.users.update_one({"_id": uid}, {"$set": update_data})
    user = await db_module.db.users.find_one({"_id": uid})
    user["id"] = str(user["_id"])
    return user


@router.get("/{user_id}/", response_model=UserProfileDB)
async def get_profile(user_id: str):
    user = await db_module.db.users.find_one({"_id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    reputation, total_ratings = await compute_reputation(user_id)
    user["reputation"] = reputation
    user["total_ratings"] = total_ratings
    user["id"] = str(user["_id"])
    return user
