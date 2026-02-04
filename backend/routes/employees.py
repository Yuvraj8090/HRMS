from fastapi import APIRouter, HTTPException, status, Depends, Query
from motor.motor_asyncio import AsyncIOMotorClient
from models.employee import Employee, EmployeeCreate, EmployeeUpdate, EmploymentStatus
from utils.auth import get_current_user
from utils.helpers import generate_id
from datetime import datetime, timezone
from typing import List, Optional
import os

router = APIRouter(prefix="/employees", tags=["Employees"])

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

@router.post("", response_model=Employee, status_code=status.HTTP_201_CREATED)
async def create_employee(employee_data: EmployeeCreate, current_user: dict = Depends(get_current_user)):
    if current_user["role"] not in ["super_admin", "company_admin", "manager"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions"
        )
    
    existing = await db.employees.find_one({
        "employee_code": employee_data.employee_code,
        "company_id": employee_data.company_id,
        "is_deleted": False
    })
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Employee code already exists"
        )
    
    employee_dict = employee_data.model_dump()
    employee_dict["id"] = generate_id()
    employee_dict["employment_status"] = EmploymentStatus.ACTIVE
    employee_dict["is_deleted"] = False
    employee_dict["created_at"] = datetime.now(timezone.utc).isoformat()
    employee_dict["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    if employee_dict.get("date_of_birth"):
        employee_dict["date_of_birth"] = employee_dict["date_of_birth"].isoformat()
    if employee_dict.get("date_of_joining"):
        employee_dict["date_of_joining"] = employee_dict["date_of_joining"].isoformat()
    
    await db.employees.insert_one(employee_dict)
    employee = await db.employees.find_one({"id": employee_dict["id"]}, {"_id": 0})
    return Employee(**employee)

@router.get("", response_model=List[Employee])
async def list_employees(
    company_id: Optional[str] = Query(None),
    department_id: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    current_user: dict = Depends(get_current_user)
):
    query = {"is_deleted": False}
    
    if current_user["role"] != "super_admin":
        query["company_id"] = current_user["company_id"]
    elif company_id:
        query["company_id"] = company_id
    
    if department_id:
        query["department_id"] = department_id
    if status:
        query["employment_status"] = status
    
    employees = await db.employees.find(query, {"_id": 0}).to_list(1000)
    return employees

@router.get("/{employee_id}", response_model=Employee)
async def get_employee(employee_id: str, current_user: dict = Depends(get_current_user)):
    employee = await db.employees.find_one({"id": employee_id, "is_deleted": False}, {"_id": 0})
    if not employee:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Employee not found"
        )
    return Employee(**employee)

@router.put("/{employee_id}", response_model=Employee)
async def update_employee(
    employee_id: str,
    update_data: EmployeeUpdate,
    current_user: dict = Depends(get_current_user)
):
    if current_user["role"] not in ["super_admin", "company_admin", "manager"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions"
        )
    
    update_dict = {k: v for k, v in update_data.model_dump().items() if v is not None}
    update_dict["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    for date_field in ["date_of_birth", "passport_expiry", "visa_expiry"]:
        if date_field in update_dict and update_dict[date_field]:
            update_dict[date_field] = update_dict[date_field].isoformat()
    
    result = await db.employees.update_one(
        {"id": employee_id, "is_deleted": False},
        {"$set": update_dict}
    )
    
    if result.matched_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Employee not found"
        )
    
    employee = await db.employees.find_one({"id": employee_id}, {"_id": 0})
    return Employee(**employee)

@router.delete("/{employee_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_employee(employee_id: str, current_user: dict = Depends(get_current_user)):
    if current_user["role"] not in ["super_admin", "company_admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions"
        )
    
    result = await db.employees.update_one(
        {"id": employee_id},
        {"$set": {"is_deleted": True, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Employee not found"
        )
