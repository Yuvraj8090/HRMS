from pydantic import BaseModel, Field, ConfigDict
from typing import Optional
from datetime import datetime, date, time, timezone
from enum import Enum

class AttendanceStatus(str, Enum):
    PRESENT = "present"
    ABSENT = "absent"
    HALF_DAY = "half_day"
    ON_LEAVE = "on_leave"
    HOLIDAY = "holiday"
    WEEKEND = "weekend"

class ShiftType(str, Enum):
    MORNING = "morning"
    EVENING = "evening"
    NIGHT = "night"
    FLEXIBLE = "flexible"

class Attendance(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str
    employee_id: str
    company_id: str
    date: date
    clock_in: Optional[datetime] = None
    clock_out: Optional[datetime] = None
    shift_type: ShiftType = ShiftType.MORNING
    status: AttendanceStatus = AttendanceStatus.PRESENT
    working_hours: Optional[float] = None
    overtime_hours: Optional[float] = None
    break_hours: Optional[float] = None
    notes: Optional[str] = None
    is_deleted: bool = False
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class AttendanceCreate(BaseModel):
    employee_id: str
    company_id: str
    date: date
    clock_in: Optional[datetime] = None
    clock_out: Optional[datetime] = None
    shift_type: ShiftType = ShiftType.MORNING
    status: AttendanceStatus = AttendanceStatus.PRESENT

class AttendanceUpdate(BaseModel):
    clock_in: Optional[datetime] = None
    clock_out: Optional[datetime] = None
    status: Optional[AttendanceStatus] = None
    notes: Optional[str] = None

class ClockInRequest(BaseModel):
    employee_id: str
    company_id: str

class ClockOutRequest(BaseModel):
    attendance_id: str
