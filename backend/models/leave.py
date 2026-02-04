from pydantic import BaseModel, Field, ConfigDict
from typing import Optional
from datetime import datetime, date, timezone
from enum import Enum

class LeaveType(str, Enum):
    ANNUAL = "annual"
    SICK = "sick"
    CASUAL = "casual"
    MATERNITY = "maternity"
    PATERNITY = "paternity"
    UNPAID = "unpaid"
    COMPENSATORY = "compensatory"

class LeaveStatus(str, Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
    CANCELLED = "cancelled"

class Leave(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str
    employee_id: str
    company_id: str
    leave_type: LeaveType
    start_date: date
    end_date: date
    days_count: float
    reason: str
    status: LeaveStatus = LeaveStatus.PENDING
    approved_by: Optional[str] = None
    approved_at: Optional[datetime] = None
    rejection_reason: Optional[str] = None
    is_deleted: bool = False
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class LeaveCreate(BaseModel):
    employee_id: str
    company_id: str
    leave_type: LeaveType
    start_date: date
    end_date: date
    days_count: float
    reason: str

class LeaveUpdate(BaseModel):
    status: LeaveStatus
    rejection_reason: Optional[str] = None

class LeaveBalance(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str
    employee_id: str
    company_id: str
    year: int
    leave_type: LeaveType
    total_allocated: float
    used: float
    balance: float
    carried_forward: float = 0.0
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
