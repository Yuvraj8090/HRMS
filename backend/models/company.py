from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List
from datetime import datetime, timezone

# --- COMPANY MODELS ---
class Company(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str
    name: str
    code: str
    country: str
    currency: str
    timezone: str
    address: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    website: Optional[str] = None
    logo_url: Optional[str] = None
    is_active: bool = True
    is_deleted: bool = False
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class CompanyCreate(BaseModel):
    name: str
    code: str
    country: str
    currency: str = "USD"
    timezone: str = "UTC"
    address: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    website: Optional[str] = None

class CompanyUpdate(BaseModel):
    name: Optional[str] = None
    country: Optional[str] = None
    currency: Optional[str] = None
    timezone: Optional[str] = None
    address: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    website: Optional[str] = None
    is_active: Optional[bool] = None

# --- BRANCH MODELS ---
class Branch(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str
    company_id: str
    name: str
    code: str
    address: Optional[str] = None
    phone: Optional[str] = None
    is_active: bool = True
    is_deleted: bool = False
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class BranchCreate(BaseModel):
    company_id: str
    name: str
    code: str
    address: Optional[str] = None
    phone: Optional[str] = None

# --- DEPARTMENT MODELS ---
class Department(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str
    company_id: str
    branch_id: Optional[str] = None
    name: str
    code: str
    manager_id: Optional[str] = None
    is_active: bool = True
    is_deleted: bool = False
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class DepartmentCreate(BaseModel):
    company_id: str
    branch_id: Optional[str] = None # Department usually belongs to a specific branch
    name: str
    code: str
    manager_id: Optional[str] = None

class DepartmentUpdate(BaseModel):
    branch_id: Optional[str] = None
    name: Optional[str] = None
    code: Optional[str] = None
    manager_id: Optional[str] = None
    is_active: Optional[bool] = None

# --- TEAM MODELS ---
class Team(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str
    company_id: str
    department_id: str
    name: str
    code: str
    manager_id: Optional[str] = None
    is_active: bool = True
    is_deleted: bool = False
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class TeamCreate(BaseModel):
    company_id: str
    department_id: str
    name: str
    code: str
    manager_id: Optional[str] = None