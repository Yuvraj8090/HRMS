from pydantic import BaseModel, Field, EmailStr, ConfigDict
from typing import Optional, List, Dict, Any
from datetime import datetime, date, timezone
from enum import Enum

class EmploymentStatus(str, Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    ON_LEAVE = "on_leave"
    TERMINATED = "terminated"

class EmploymentType(str, Enum):
    FULL_TIME = "full_time"
    PART_TIME = "part_time"
    CONTRACT = "contract"
    INTERN = "intern"

class Gender(str, Enum):
    MALE = "male"
    FEMALE = "female"
    OTHER = "other"

class Employee(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str
    employee_code: str
    company_id: str
    
    # Personal Information
    first_name: str
    last_name: str
    email: EmailStr
    phone: Optional[str] = None
    date_of_birth: Optional[date] = None
    gender: Optional[Gender] = None
    nationality: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    country: Optional[str] = None
    postal_code: Optional[str] = None
    profile_photo_url: Optional[str] = None
    
    # Professional Information
    designation: Optional[str] = None
    department_id: Optional[str] = None
    team_id: Optional[str] = None
    branch_id: Optional[str] = None
    manager_id: Optional[str] = None
    employment_type: EmploymentType = EmploymentType.FULL_TIME
    employment_status: EmploymentStatus = EmploymentStatus.ACTIVE
    date_of_joining: Optional[date] = None
    date_of_leaving: Optional[date] = None
    
    # Legal Information
    passport_number: Optional[str] = None
    passport_expiry: Optional[date] = None
    visa_number: Optional[str] = None
    visa_expiry: Optional[date] = None
    national_id: Optional[str] = None
    tax_id: Optional[str] = None
    
    # Emergency Contact
    emergency_contact_name: Optional[str] = None
    emergency_contact_relationship: Optional[str] = None
    emergency_contact_phone: Optional[str] = None
    
    # System Fields
    is_deleted: bool = False
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class EmployeeCreate(BaseModel):
    employee_code: str
    company_id: str
    first_name: str
    last_name: str
    email: EmailStr
    phone: Optional[str] = None
    date_of_birth: Optional[date] = None
    gender: Optional[Gender] = None
    nationality: Optional[str] = None
    designation: Optional[str] = None
    department_id: Optional[str] = None
    team_id: Optional[str] = None
    branch_id: Optional[str] = None
    manager_id: Optional[str] = None
    employment_type: EmploymentType = EmploymentType.FULL_TIME
    date_of_joining: Optional[date] = None

class EmployeeUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone: Optional[str] = None
    date_of_birth: Optional[date] = None
    gender: Optional[Gender] = None
    nationality: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    country: Optional[str] = None
    postal_code: Optional[str] = None
    designation: Optional[str] = None
    department_id: Optional[str] = None
    team_id: Optional[str] = None
    branch_id: Optional[str] = None
    manager_id: Optional[str] = None
    employment_type: Optional[EmploymentType] = None
    employment_status: Optional[EmploymentStatus] = None
    passport_number: Optional[str] = None
    passport_expiry: Optional[date] = None
    visa_number: Optional[str] = None
    visa_expiry: Optional[date] = None
    national_id: Optional[str] = None
    tax_id: Optional[str] = None
    emergency_contact_name: Optional[str] = None
    emergency_contact_relationship: Optional[str] = None
    emergency_contact_phone: Optional[str] = None
