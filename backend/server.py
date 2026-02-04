from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# --- DEBUG ADDITION ---
print(f"DEBUG: Loading .env from {ROOT_DIR / '.env'}")
print(f"DEBUG: MONGO_URL found: {os.environ.get('MONGO_URL')}")

# --- CONFIGURATION CHECK ---
# This ensures your .env is actually being read
REQUIRED_ENV_VARS = ['MONGO_URL', 'DB_NAME']
for var in REQUIRED_ENV_VARS:
    if var not in os.environ:
        raise RuntimeError(f"Missing required environment variable: {var}")

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI(title="Nexus HR API", version="1.0.0")
api_router = APIRouter(prefix="/api")

# --- ADDED: DETAILED HEALTH CHECK ---
@api_router.get("/health-check")
async def health_check():
    health_status = {
        "status": "online",
        "database": "disconnected",
        "environment": "loaded"
    }
    
    try:
        # The 'ping' command is the fastest way to check MongoDB connectivity
        await client.admin.command('ping')
        health_status["database"] = "connected"
    except Exception as e:
        health_status["status"] = "unstable"
        health_status["database_error"] = str(e)
        
    return health_status

# Import and Include routes (unchanged)
from routes.auth import router as auth_router
from routes.companies import router as companies_router
from routes.employees import router as employees_router
from routes.attendance import router as attendance_router
from routes.leaves import router as leaves_router

api_router.include_router(auth_router)
api_router.include_router(companies_router)
api_router.include_router(employees_router)
api_router.include_router(attendance_router)
api_router.include_router(leaves_router)

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()