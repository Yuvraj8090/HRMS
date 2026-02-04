from fastapi import APIRouter, HTTPException, status, Depends, Query, Path
from motor.motor_asyncio import AsyncIOMotorClient
from models.company import (
    Company, CompanyCreate, CompanyUpdate, 
    Branch, BranchCreate, 
    Department, DepartmentCreate, DepartmentUpdate,
    Team, TeamCreate
)
from utils.auth import get_current_user
from utils.helpers import generate_id
from datetime import datetime, timezone
from typing import List, Optional
import os

router = APIRouter(prefix="/companies", tags=["Companies"])

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# ==========================================
# HELPER FUNCTIONS (PERMISSIONS & VALIDATION)
# ==========================================

def verify_company_access(company_id: str, user: dict):
    """
    Ensures the user has permission to access/modify the specific company.
    - Super Admins can access everything.
    - Company Admins can only access their own company_id.
    """
    if user["role"] == "super_admin":
        return True
    
    if user["role"] == "company_admin":
        if user["company_id"] != company_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to manage this company."
            )
        return True

    # Regular employees usually don't have write access here, 
    # but for Read operations, logic might differ.
    return False

def verify_admin_privileges(user: dict):
    """Ensures user is at least a Company Admin."""
    if user["role"] not in ["super_admin", "company_admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient administrative privileges."
        )

# ==========================================
# COMPANY ROUTES
# ==========================================

@router.post("", response_model=Company, status_code=status.HTTP_201_CREATED)
async def create_company(company_data: CompanyCreate, current_user: dict = Depends(get_current_user)):
    """Only Super Admins can create a new company entity."""
    if current_user["role"] != "super_admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only super admins can create companies"
        )
    
    # Check for duplicate company code
    existing = await db.companies.find_one({"code": company_data.code})
    if existing:
        raise HTTPException(status_code=400, detail="Company code already exists")

    company_dict = company_data.model_dump()
    company_dict["id"] = generate_id()
    company_dict["is_active"] = True
    company_dict["is_deleted"] = False
    company_dict["created_at"] = datetime.now(timezone.utc).isoformat()
    company_dict["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.companies.insert_one(company_dict)
    return Company(**company_dict)

@router.get("", response_model=List[Company])
async def list_companies(current_user: dict = Depends(get_current_user)):
    """
    List companies. 
    Super Admins see all. Company Admins/Employees see only their own.
    """
    if current_user["role"] == "super_admin":
        companies = await db.companies.find({"is_deleted": False}, {"_id": 0}).to_list(1000)
    else:
        # Restrict to user's company
        companies = await db.companies.find(
            {"id": current_user["company_id"], "is_deleted": False},
            {"_id": 0}
        ).to_list(1000)
    return companies

@router.get("/{company_id}", response_model=Company)
async def get_company(company_id: str, current_user: dict = Depends(get_current_user)):
    # Verify access first
    if current_user["role"] != "super_admin":
        if current_user["company_id"] != company_id:
             raise HTTPException(status_code=403, detail="Access denied")

    company = await db.companies.find_one({"id": company_id, "is_deleted": False}, {"_id": 0})
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    return Company(**company)

@router.put("/{company_id}", response_model=Company)
async def update_company(company_id: str, update_data: CompanyUpdate, current_user: dict = Depends(get_current_user)):
    """Update company details."""
    verify_admin_privileges(current_user)
    verify_company_access(company_id, current_user)
    
    update_dict = {k: v for k, v in update_data.model_dump().items() if v is not None}
    update_dict["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    result = await db.companies.update_one(
        {"id": company_id, "is_deleted": False},
        {"$set": update_dict}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Company not found")
    
    company = await db.companies.find_one({"id": company_id}, {"_id": 0})
    return Company(**company)

# ==========================================
# BRANCH ROUTES
# ==========================================

@router.post("/{company_id}/branches", response_model=Branch, status_code=status.HTTP_201_CREATED)
async def create_branch(company_id: str, branch_data: BranchCreate, current_user: dict = Depends(get_current_user)):
    verify_admin_privileges(current_user)
    verify_company_access(company_id, current_user)

    branch_dict = branch_data.model_dump()
    branch_dict["id"] = generate_id()
    # Force company_id to match the path parameter for safety
    branch_dict["company_id"] = company_id 
    branch_dict["is_active"] = True
    branch_dict["is_deleted"] = False
    branch_dict["created_at"] = datetime.now(timezone.utc).isoformat()
    branch_dict["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.branches.insert_one(branch_dict)
    return Branch(**branch_dict)

@router.get("/{company_id}/branches", response_model=List[Branch])
async def list_branches(company_id: str, current_user: dict = Depends(get_current_user)):
    # Employees can view branches of their company
    if current_user["role"] != "super_admin" and current_user["company_id"] != company_id:
        raise HTTPException(status_code=403, detail="Access denied")

    branches = await db.branches.find({"company_id": company_id, "is_deleted": False}, {"_id": 0}).to_list(1000)
    return branches

# ==========================================
# DEPARTMENT ROUTES
# ==========================================

@router.post("/{company_id}/departments", response_model=Department, status_code=status.HTTP_201_CREATED)
async def create_department(
    company_id: str, 
    dept_data: DepartmentCreate, 
    current_user: dict = Depends(get_current_user)
):
    """
    Create a new department for a company.
    - Validates Admin Role.
    - Validates Company Access.
    - Validates Branch Integrity (Branch must belong to Company).
    """
    # 1. Permission Check
    verify_admin_privileges(current_user)
    verify_company_access(company_id, current_user)

    # 2. Branch Integrity Check
    # If a branch_id is provided, we must ensure that branch belongs to THIS company.
    # We cannot allow assigning a department to a branch from a different company.
    if dept_data.branch_id:
        branch = await db.branches.find_one({
            "id": dept_data.branch_id,
            "company_id": company_id,
            "is_deleted": False
        })
        if not branch:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid branch_id. The branch does not exist or does not belong to this company."
            )

    # 3. Code Uniqueness Check (Optional but recommended)
    existing_dept = await db.departments.find_one({
        "company_id": company_id, 
        "code": dept_data.code,
        "is_deleted": False
    })
    if existing_dept:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail=f"Department with code '{dept_data.code}' already exists in this company."
        )

    # 4. Create Department
    dept_dict = dept_data.model_dump()
    dept_dict["id"] = generate_id()
    dept_dict["company_id"] = company_id # Enforce path param
    dept_dict["is_active"] = True
    dept_dict["is_deleted"] = False
    dept_dict["created_at"] = datetime.now(timezone.utc).isoformat()
    dept_dict["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.departments.insert_one(dept_dict)
    return Department(**dept_dict)

@router.get("/{company_id}/departments", response_model=List[Department])
async def list_departments(
    company_id: str, 
    branch_id: Optional[str] = Query(None, description="Filter by Branch ID"),
    current_user: dict = Depends(get_current_user)
):
    """
    List all departments for a company.
    Optionally filter by branch_id.
    """
    # General access check
    if current_user["role"] != "super_admin" and current_user["company_id"] != company_id:
        raise HTTPException(status_code=403, detail="Access denied")

    query = {"company_id": company_id, "is_deleted": False}
    
    # Apply branch filter if provided
    if branch_id:
        query["branch_id"] = branch_id

    departments = await db.departments.find(query, {"_id": 0}).to_list(1000)
    return departments

@router.put("/{company_id}/departments/{department_id}", response_model=Department)
async def update_department(
    company_id: str, 
    department_id: str, 
    update_data: DepartmentUpdate, 
    current_user: dict = Depends(get_current_user)
):
    """
    Update department details.
    """
    verify_admin_privileges(current_user)
    verify_company_access(company_id, current_user)

    # If updating branch_id, validate it again
    if update_data.branch_id:
        branch = await db.branches.find_one({
            "id": update_data.branch_id,
            "company_id": company_id,
            "is_deleted": False
        })
        if not branch:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid branch_id. The branch does not belong to this company."
            )

    update_dict = {k: v for k, v in update_data.model_dump().items() if v is not None}
    update_dict["updated_at"] = datetime.now(timezone.utc).isoformat()

    result = await db.departments.update_one(
        {"id": department_id, "company_id": company_id, "is_deleted": False},
        {"$set": update_dict}
    )

    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Department not found")

    dept = await db.departments.find_one({"id": department_id}, {"_id": 0})
    return Department(**dept)

@router.delete("/{company_id}/departments/{department_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_department(
    company_id: str, 
    department_id: str, 
    current_user: dict = Depends(get_current_user)
):
    """
    Soft delete a department.
    """
    verify_admin_privileges(current_user)
    verify_company_access(company_id, current_user)

    # Check if department exists
    dept = await db.departments.find_one({"id": department_id, "company_id": company_id, "is_deleted": False})
    if not dept:
        raise HTTPException(status_code=404, detail="Department not found")

    # Optional: Check if any employees are still assigned to this department before deleting?
    # For now, we proceed with soft delete.

    await db.departments.update_one(
        {"id": department_id},
        {"$set": {
            "is_deleted": True,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    return

# ==========================================
# TEAM ROUTES (Basic Implementation)
# ==========================================

@router.post("/{company_id}/teams", response_model=Team, status_code=status.HTTP_201_CREATED)
async def create_team(company_id: str, team_data: TeamCreate, current_user: dict = Depends(get_current_user)):
    verify_admin_privileges(current_user)
    verify_company_access(company_id, current_user)
    
    team_dict = team_data.model_dump()
    team_dict["id"] = generate_id()
    team_dict["company_id"] = company_id
    team_dict["is_active"] = True
    team_dict["is_deleted"] = False
    team_dict["created_at"] = datetime.now(timezone.utc).isoformat()
    team_dict["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.teams.insert_one(team_dict)
    return Team(**team_dict)

@router.get("/{company_id}/teams", response_model=List[Team])
async def list_teams(company_id: str, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "super_admin" and current_user["company_id"] != company_id:
        raise HTTPException(status_code=403, detail="Access denied")
        
    teams = await db.teams.find({"company_id": company_id, "is_deleted": False}, {"_id": 0}).to_list(1000)
    return teams