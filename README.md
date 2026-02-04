# NexusHR - Modern Human Resource Management System

NexusHR is a full-stack, SaaS-ready Human Resource Management System designed to streamline organizational processes. It features a multi-tenant architecture supporting Companies, Branches, Departments, and Teams, alongside robust Employee, Attendance, and Leave management modules.

Built with performance and scalability in mind using **FastAPI** (Python), **React.js**, and **MongoDB**.

---

## 🚀 Key Features

* **🔐 Role-Based Access Control (RBAC):**
    * **Super Admin:** Manage all companies and system-wide settings.
    * **Company Admin:** Manage branches, departments, teams, and employees.
    * **Employee:** View profile, mark attendance, and request leaves.
* **🏢 Organization Management:** Hierarchical structure support (Company → Branch → Department → Team).
* **👥 Employee Management:** specialized profiles, designations, and employment history.
* **📅 Attendance Tracking:** Clock-in/out functionality with overtime calculation and status tracking.
* **fw Leave Management:** Leave request workflows (Annual, Sick, etc.) with approval/rejection systems.
* **📊 Real-time Dashboard:** Interactive analytics for admins and employees.

---

## 🛠️ Tech Stack

### Backend
* **Framework:** FastAPI (Python 3.10+)
* **Database:** MongoDB (using Motor async driver)
* **Validation:** Pydantic Models
* **Authentication:** JWT (JSON Web Tokens) & OAuth2
* **Environment:** Python-Dotenv

### Frontend
* **Framework:** React.js (Create React App)
* **Styling:** Tailwind CSS & Shadcn/UI Components
* **State Management:** React Context API / Hooks
* **HTTP Client:** Axios
* **Icons:** Lucide React

---

## 📂 Project Structure

```text
├── backend/                # FastAPI Application
│   ├── models/             # Pydantic Database Models
│   ├── routes/             # API Endpoints (Auth, Company, Employees, etc.)
│   ├── utils/              # Helper functions & Auth logic
│   ├── seed_data.py        # Database population script
│   └── server.py           # Application entry point
│
├── frontend/               # React Application
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Main application views
│   │   ├── services/       # API integration services
│   │   └── context/        # Global state management
│   └── public/             # Static assets
│
└── tests/                  # Test suites


## ⚡ Getting Started

Follow these steps to set up the project locally.

### Prerequisites

* Python 3.9 or higher
* Node.js & npm/yarn
* MongoDB (Local or Atlas)

### 1. Backend Setup

Navigate to the backend directory:

```bash
cd backend

```

Create a virtual environment and activate it:

```bash
# Windows
python -m venv venv
.\venv\Scripts\activate

# Mac/Linux
python3 -m venv venv
source venv/bin/activate

```

Install dependencies:

```bash
pip install -r requirements.txt

```

**Configuration (.env):**
Create a `.env` file in the `backend/` folder:

```env
MONGO_URL=mongodb://localhost:27017
DB_NAME=nexushr_db
SECRET_KEY=your_super_secret_key_here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

```

**Seed Database (Optional but Recommended):**
Populate the database with demo data (Admin user, demo company, etc.):

```bash
python seed_data.py

```

Run the Server:

```bash
python server.py
# OR
uvicorn server:app --reload

```

*The API will start at `http://localhost:8000*`
*API Documentation available at `http://localhost:8000/docs*`

### 2. Frontend Setup

Open a new terminal and navigate to the frontend directory:

```bash
cd frontend

```

Install dependencies:

```bash
# Using Yarn (Recommended)
yarn install

# Or using NPM
npm install

```

**Configuration (.env):**
Create a `.env` file in the `frontend/` folder:

```env
REACT_APP_API_URL=http://localhost:8000

```

Run the Application:

```bash
yarn start

```

*The app will run at `http://localhost:3000*`

---

## 🔑 Default Credentials (Seed Data)

If you ran `python seed_data.py`, you can use these accounts to log in:

| Role | Email | Password |
| --- | --- | --- |
| **Super Admin** | `admin@nexushr.com` | `password123` |
| **Company Admin** | `hr@techcorp.com` | `password123` |
| **Employee** | `john.doe@techcorp.com` | `password123` |

---

## 🧪 Running Tests

To run the backend tests:

```bash
cd backend
pytest

```

---

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.