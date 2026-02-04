from fastapi import APIRouter, HTTPException, status, Depends, Query
from motor.motor_asyncio import AsyncIOMotorClient
from models.leave import Leave, LeaveCreate, LeaveUpdate, LeaveBalance, LeaveStatus
from utils.auth import get_current_user
from utils.helpers import generate_id
from datetime import datetime, timezone
from typing import List, Optional
import os

router = APIRouter(prefix="/leaves", tags=["Leave Management"])

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

@router.post("", response_model=Leave, status_code=status.HTTP_201_CREATED)
async def create_leave(leave_data: LeaveCreate, current_user: dict = Depends(get_current_user)):
    leave_dict = leave_data.model_dump()
    leave_dict["id"] = generate_id()
    leave_dict["status"] = LeaveStatus.PENDING
    leave_dict["approved_by"] = None
    leave_dict["approved_at"] = None
    leave_dict["rejection_reason"] = None
    leave_dict["is_deleted"] = False
    leave_dict["created_at"] = datetime.now(timezone.utc).isoformat()
    leave_dict["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    if leave_dict.get("start_date"):
        leave_dict["start_date"] = leave_dict["start_date"].isoformat()
    if leave_dict.get("end_date"):
        leave_dict["end_date"] = leave_dict["end_date"].isoformat()
    
    await db.leaves.insert_one(leave_dict)
    leave = await db.leaves.find_one({"id": leave_dict["id"]}, {"_id": 0})
    return Leave(**leave)

@router.get("", response_model=List[Leave])
async def list_leaves(
    employee_id: Optional[str] = Query(None),
    status: Optional[LeaveStatus] = Query(None),
    current_user: dict = Depends(get_current_user)
):
    query = {"is_deleted": False}
    
    if current_user["role"] == "employee" and current_user.get("employee_id"):
        query["employee_id"] = current_user["employee_id"]
    elif employee_id:
        query["employee_id"] = employee_id
    
    if current_user["role"] != "super_admin":
        query["company_id"] = current_user["company_id"]
    
    if status:
        query["status"] = status
    
    leaves = await db.leaves.find(query, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return leaves

@router.get("/{leave_id}", response_model=Leave)
async def get_leave(leave_id: str, current_user: dict = Depends(get_current_user)):
    leave = await db.leaves.find_one({"id": leave_id, "is_deleted": False}, {"_id": 0})
    if not leave:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Leave request not found"
        )
    return Leave(**leave)

@router.put("/{leave_id}", response_model=Leave)
async def update_leave(leave_id: str, update_data: LeaveUpdate, current_user: dict = Depends(get_current_user)):
    if current_user["role"] not in ["super_admin", "company_admin", "manager"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions to approve/reject leaves"
        )
    
    leave = await db.leaves.find_one({"id": leave_id, "is_deleted": False})
    if not leave:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Leave request not found"
        )
    
    update_dict = update_data.model_dump()
    update_dict["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    if update_data.status == LeaveStatus.APPROVED:
        update_dict["approved_by"] = current_user["sub"]
        update_dict["approved_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.leaves.update_one(
        {"id": leave_id},
        {"$set": update_dict}
    )
    
    updated_leave = await db.leaves.find_one({"id": leave_id}, {"_id": 0})
    return Leave(**updated_leave)

@router.get("/balance/{employee_id}", response_model=List[LeaveBalance])
async def get_leave_balance(employee_id: str, year: int = Query(2025), current_user: dict = Depends(get_current_user)):
    balances = await db.leave_balances.find(
        {"employee_id": employee_id, "year": year},
        {"_id": 0}
    ).to_list(100)
    return balances
