from fastapi import APIRouter, HTTPException, status, Depends, Query
from motor.motor_asyncio import AsyncIOMotorClient
from models.attendance import Attendance, AttendanceCreate, AttendanceUpdate, ClockInRequest, ClockOutRequest, AttendanceStatus
from utils.auth import get_current_user
from utils.helpers import generate_id, calculate_working_hours
from datetime import datetime, date, timezone
from typing import List, Optional
import os

router = APIRouter(prefix="/attendance", tags=["Attendance"])

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

@router.post("/clock-in", response_model=Attendance)
async def clock_in(request: ClockInRequest, current_user: dict = Depends(get_current_user)):
    today = date.today()
    
    existing = await db.attendance.find_one({
        "employee_id": request.employee_id,
        "date": today.isoformat(),
        "is_deleted": False
    })
    
    if existing and existing.get("clock_in"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Already clocked in for today"
        )
    
    attendance_dict = {
        "id": generate_id(),
        "employee_id": request.employee_id,
        "company_id": request.company_id,
        "date": today.isoformat(),
        "clock_in": datetime.now(timezone.utc).isoformat(),
        "clock_out": None,
        "shift_type": "morning",
        "status": AttendanceStatus.PRESENT,
        "working_hours": None,
        "overtime_hours": None,
        "break_hours": None,
        "notes": None,
        "is_deleted": False,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.attendance.insert_one(attendance_dict)
    attendance = await db.attendance.find_one({"id": attendance_dict["id"]}, {"_id": 0})
    return Attendance(**attendance)

@router.post("/clock-out", response_model=Attendance)
async def clock_out(request: ClockOutRequest, current_user: dict = Depends(get_current_user)):
    attendance = await db.attendance.find_one({
        "id": request.attendance_id,
        "is_deleted": False
    })
    
    if not attendance:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Attendance record not found"
        )
    
    if attendance.get("clock_out"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Already clocked out"
        )
    
    clock_out_time = datetime.now(timezone.utc)
    clock_in_time = datetime.fromisoformat(attendance["clock_in"])
    working_hours = calculate_working_hours(clock_in_time, clock_out_time)
    
    update_dict = {
        "clock_out": clock_out_time.isoformat(),
        "working_hours": working_hours,
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.attendance.update_one(
        {"id": request.attendance_id},
        {"$set": update_dict}
    )
    
    updated_attendance = await db.attendance.find_one({"id": request.attendance_id}, {"_id": 0})
    return Attendance(**updated_attendance)

@router.get("", response_model=List[Attendance])
async def list_attendance(
    employee_id: Optional[str] = Query(None),
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    current_user: dict = Depends(get_current_user)
):
    query = {"is_deleted": False}
    
    if current_user["role"] == "employee" and current_user.get("employee_id"):
        query["employee_id"] = current_user["employee_id"]
    elif employee_id:
        query["employee_id"] = employee_id
    
    if current_user["role"] != "super_admin":
        query["company_id"] = current_user["company_id"]
    
    if start_date and end_date:
        query["date"] = {
            "$gte": start_date.isoformat(),
            "$lte": end_date.isoformat()
        }
    
    attendance_records = await db.attendance.find(query, {"_id": 0}).sort("date", -1).to_list(1000)
    return attendance_records

@router.get("/{attendance_id}", response_model=Attendance)
async def get_attendance(attendance_id: str, current_user: dict = Depends(get_current_user)):
    attendance = await db.attendance.find_one({"id": attendance_id, "is_deleted": False}, {"_id": 0})
    if not attendance:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Attendance record not found"
        )
    return Attendance(**attendance)
