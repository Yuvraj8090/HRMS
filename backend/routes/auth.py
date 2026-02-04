from fastapi import APIRouter, HTTPException, status, Depends
from motor.motor_asyncio import AsyncIOMotorClient
from models.user import UserCreate, UserLogin, UserResponse, TokenResponse, User
from utils.auth import get_password_hash, verify_password, create_access_token, get_current_user
from utils.helpers import generate_id
from datetime import datetime, timezone
import os

router = APIRouter(prefix="/auth", tags=["Authentication"])

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(user_data: UserCreate):
    existing_user = await db.users.find_one({"email": user_data.email, "is_deleted": False})
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    user_dict = user_data.model_dump()
    user_dict["id"] = generate_id()
    user_dict["password_hash"] = get_password_hash(user_data.password)
    user_dict["is_active"] = True
    user_dict["is_deleted"] = False
    user_dict["created_at"] = datetime.now(timezone.utc).isoformat()
    user_dict["updated_at"] = datetime.now(timezone.utc).isoformat()
    del user_dict["password"]
    
    await db.users.insert_one(user_dict)
    
    return UserResponse(
        id=user_dict["id"],
        email=user_dict["email"],
        role=user_dict["role"],
        company_id=user_dict.get("company_id"),
        employee_id=user_dict.get("employee_id"),
        is_active=user_dict["is_active"]
    )

@router.post("/login", response_model=TokenResponse)
async def login(credentials: UserLogin):
    user = await db.users.find_one({"email": credentials.email, "is_deleted": False})
    if not user or not verify_password(credentials.password, user["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )
    
    if not user.get("is_active", True):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is inactive"
        )
    
    access_token = create_access_token(data={
        "sub": user["id"],
        "email": user["email"],
        "role": user["role"],
        "company_id": user.get("company_id")
    })
    
    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        user=UserResponse(
            id=user["id"],
            email=user["email"],
            role=user["role"],
            company_id=user.get("company_id"),
            employee_id=user.get("employee_id"),
            is_active=user["is_active"]
        )
    )

@router.get("/me", response_model=UserResponse)
async def get_current_user_info(current_user: dict = Depends(get_current_user)):
    user = await db.users.find_one({"id": current_user["sub"], "is_deleted": False})
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    return UserResponse(
        id=user["id"],
        email=user["email"],
        role=user["role"],
        company_id=user.get("company_id"),
        employee_id=user.get("employee_id"),
        is_active=user["is_active"]
    )
