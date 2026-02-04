import uuid
from datetime import datetime, date
from typing import Any, Dict

def generate_id() -> str:
    return str(uuid.uuid4())

def serialize_datetime(obj: Any) -> Any:
    if isinstance(obj, datetime):
        return obj.isoformat()
    elif isinstance(obj, date):
        return obj.isoformat()
    return obj

def calculate_working_hours(clock_in: datetime, clock_out: datetime) -> float:
    if not clock_in or not clock_out:
        return 0.0
    delta = clock_out - clock_in
    hours = delta.total_seconds() / 3600
    return round(hours, 2)

def calculate_days_between(start_date: date, end_date: date) -> float:
    delta = end_date - start_date
    return delta.days + 1
