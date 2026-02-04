import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from utils.auth import get_password_hash
from utils.helpers import generate_id
from datetime import datetime, date, timedelta, timezone
import os
from dotenv import load_dotenv

load_dotenv()

mongo_url = os.environ['MONGO_URL']
db_name = os.environ['DB_NAME']

async def seed_database():
    client = AsyncIOMotorClient(mongo_url)
    db = client[db_name]
    
    print("Seeding database...")
    
    # Create Super Admin User
    super_admin = {
        "id": generate_id(),
        "email": "admin@nexushr.com",
        "password_hash": get_password_hash("password123"),
        "role": "super_admin",
        "company_id": None,
        "employee_id": None,
        "is_active": True,
        "is_deleted": False,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    await db.users.insert_one(super_admin)
    print(f"✓ Created super admin: {super_admin['email']}")
    
    # Create Demo Company
    company = {
        "id": generate_id(),
        "name": "TechCorp International",
        "code": "TECH001",
        "country": "United States",
        "currency": "USD",
        "timezone": "America/New_York",
        "address": "123 Tech Street, San Francisco, CA",
        "phone": "+1-555-0100",
        "email": "info@techcorp.com",
        "website": "https://techcorp.com",
        "is_active": True,
        "is_deleted": False,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    await db.companies.insert_one(company)
    print(f"✓ Created company: {company['name']}")
    
    # Create Branches
    branches = [
        {
            "id": generate_id(),
            "company_id": company["id"],
            "name": "San Francisco HQ",
            "code": "SF-HQ",
            "address": "123 Tech Street, San Francisco, CA",
            "phone": "+1-555-0100",
            "is_active": True,
            "is_deleted": False,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": generate_id(),
            "company_id": company["id"],
            "name": "New York Office",
            "code": "NY-OFF",
            "address": "456 Business Ave, New York, NY",
            "phone": "+1-555-0200",
            "is_active": True,
            "is_deleted": False,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
    ]
    await db.branches.insert_many(branches)
    print(f"✓ Created {len(branches)} branches")
    
    # Create Departments
    departments = [
        {
            "id": generate_id(),
            "company_id": company["id"],
            "branch_id": branches[0]["id"],
            "name": "Engineering",
            "code": "ENG",
            "manager_id": None,
            "is_active": True,
            "is_deleted": False,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": generate_id(),
            "company_id": company["id"],
            "branch_id": branches[0]["id"],
            "name": "Human Resources",
            "code": "HR",
            "manager_id": None,
            "is_active": True,
            "is_deleted": False,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": generate_id(),
            "company_id": company["id"],
            "branch_id": branches[0]["id"],
            "name": "Sales",
            "code": "SALES",
            "manager_id": None,
            "is_active": True,
            "is_deleted": False,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
    ]
    await db.departments.insert_many(departments)
    print(f"✓ Created {len(departments)} departments")
    
    # Create Employees
    employees = [
        {
            "id": generate_id(),
            "employee_code": "EMP001",
            "company_id": company["id"],
            "first_name": "John",
            "last_name": "Doe",
            "email": "john.doe@techcorp.com",
            "phone": "+1-555-1001",
            "date_of_birth": "1990-05-15",
            "gender": "male",
            "nationality": "American",
            "address": "789 Main St, San Francisco, CA",
            "designation": "Senior Software Engineer",
            "department_id": departments[0]["id"],
            "branch_id": branches[0]["id"],
            "employment_type": "full_time",
            "employment_status": "active",
            "date_of_joining": "2020-01-15",
            "is_deleted": False,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": generate_id(),
            "employee_code": "EMP002",
            "company_id": company["id"],
            "first_name": "Jane",
            "last_name": "Smith",
            "email": "jane.smith@techcorp.com",
            "phone": "+1-555-1002",
            "date_of_birth": "1988-08-22",
            "gender": "female",
            "nationality": "American",
            "address": "456 Oak Ave, San Francisco, CA",
            "designation": "HR Manager",
            "department_id": departments[1]["id"],
            "branch_id": branches[0]["id"],
            "employment_type": "full_time",
            "employment_status": "active",
            "date_of_joining": "2019-03-10",
            "is_deleted": False,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": generate_id(),
            "employee_code": "EMP003",
            "company_id": company["id"],
            "first_name": "Mike",
            "last_name": "Johnson",
            "email": "mike.johnson@techcorp.com",
            "phone": "+1-555-1003",
            "date_of_birth": "1992-03-18",
            "gender": "male",
            "nationality": "American",
            "address": "321 Pine St, San Francisco, CA",
            "designation": "Sales Executive",
            "department_id": departments[2]["id"],
            "branch_id": branches[0]["id"],
            "employment_type": "full_time",
            "employment_status": "active",
            "date_of_joining": "2021-06-01",
            "is_deleted": False,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
    ]
    await db.employees.insert_many(employees)
    print(f"✓ Created {len(employees)} employees")
    
    # Create Company Admin User
    company_admin = {
        "id": generate_id(),
        "email": "hr@techcorp.com",
        "password_hash": get_password_hash("password123"),
        "role": "company_admin",
        "company_id": company["id"],
        "employee_id": employees[1]["id"],
        "is_active": True,
        "is_deleted": False,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    await db.users.insert_one(company_admin)
    print(f"✓ Created company admin: {company_admin['email']}")
    
    # Create Employee User
    employee_user = {
        "id": generate_id(),
        "email": "john.doe@techcorp.com",
        "password_hash": get_password_hash("password123"),
        "role": "employee",
        "company_id": company["id"],
        "employee_id": employees[0]["id"],
        "is_active": True,
        "is_deleted": False,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    await db.users.insert_one(employee_user)
    print(f"✓ Created employee user: {employee_user['email']}")
    
    # Create Sample Attendance Records
    today = date.today()
    attendance_records = []
    for i in range(5):
        record_date = today - timedelta(days=i)
        for emp in employees:
            attendance_records.append({
                "id": generate_id(),
                "employee_id": emp["id"],
                "company_id": company["id"],
                "date": record_date.isoformat(),
                "clock_in": datetime.combine(record_date, datetime.min.time().replace(hour=9, minute=0)).isoformat(),
                "clock_out": datetime.combine(record_date, datetime.min.time().replace(hour=17, minute=30)).isoformat(),
                "shift_type": "morning",
                "status": "present",
                "working_hours": 8.5,
                "overtime_hours": 0.5,
                "is_deleted": False,
                "created_at": datetime.now(timezone.utc).isoformat(),
                "updated_at": datetime.now(timezone.utc).isoformat()
            })
    await db.attendance.insert_many(attendance_records)
    print(f"✓ Created {len(attendance_records)} attendance records")
    
    # Create Sample Leave Requests
    leave_requests = [
        {
            "id": generate_id(),
            "employee_id": employees[0]["id"],
            "company_id": company["id"],
            "leave_type": "annual",
            "start_date": (today + timedelta(days=10)).isoformat(),
            "end_date": (today + timedelta(days=12)).isoformat(),
            "days_count": 3,
            "reason": "Family vacation",
            "status": "pending",
            "is_deleted": False,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": generate_id(),
            "employee_id": employees[2]["id"],
            "company_id": company["id"],
            "leave_type": "sick",
            "start_date": (today - timedelta(days=2)).isoformat(),
            "end_date": (today - timedelta(days=2)).isoformat(),
            "days_count": 1,
            "reason": "Medical appointment",
            "status": "approved",
            "approved_by": company_admin["id"],
            "approved_at": datetime.now(timezone.utc).isoformat(),
            "is_deleted": False,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
    ]
    await db.leaves.insert_many(leave_requests)
    print(f"✓ Created {len(leave_requests)} leave requests")
    
    print("\n✅ Database seeding completed successfully!")
    print("\n📋 Demo Credentials:")
    print("   Super Admin: admin@nexushr.com / password123")
    print("   Company Admin: hr@techcorp.com / password123")
    print("   Employee: john.doe@techcorp.com / password123")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(seed_database())
