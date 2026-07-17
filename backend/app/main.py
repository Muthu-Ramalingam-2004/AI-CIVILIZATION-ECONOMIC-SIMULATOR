import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.database import engine, Base, get_db
from app.api import auth, businesses, simulation, predictions, reports
from app.models.user import User
from app.core.security import get_password_hash

# Configure basic logging format
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("app.main")

def verify_and_initialize_database():
    """Verify database integrity, check SMTP variables, print startup metrics, and seed if data is missing."""
    import os
    
    # Check that required SMTP and reset settings are present in .env
    smtp_vars = {
        "SMTP_HOST": settings.SMTP_HOST,
        "SMTP_PORT": settings.SMTP_PORT,
        "SMTP_USERNAME": settings.SMTP_USERNAME,
        "SMTP_PASSWORD": settings.SMTP_PASSWORD,
        "SMTP_FROM_EMAIL": settings.SMTP_FROM_EMAIL,
        "FRONTEND_URL": settings.FRONTEND_URL
    }
    missing_vars = [k for k, v in smtp_vars.items() if not v]
    if missing_vars:
        warning_msg = f"The following SMTP/reset configuration variables are missing or empty in .env: {', '.join(missing_vars)}. Password reset email delivery will return 'Email service is not configured.' until they are set."
        logger.warning(warning_msg)


    from sqlalchemy import inspect, text
    from app.models.user import User
    from app.models.business import Business
    from app.models.history import SimulationHistory
    from app.models.notification import Notification
    from app.models.log import SystemLog
    
    db_url = settings.DATABASE_URL
    db_path = ""
    if db_url.startswith("sqlite:///"):
        db_path = db_url[10:]
    elif db_url.startswith("sqlite://"):
        db_path = db_url[9:]
    else:
        db_path = db_url

    # Normalize Windows drive letter format
    if db_path.startswith("/") and len(db_path) > 2 and db_path[2] == ":":
        db_path = db_path[1:]

    db_exists_before = os.path.exists(db_path) if db_path else False

    # 1. Create tables if they do not exist
    Base.metadata.create_all(bind=engine)

    # 2. Run PRAGMA integrity check
    integrity_ok = False
    integrity_msg = "Unknown"
    try:
        with engine.connect() as conn:
            integrity_msg = conn.execute(text("PRAGMA integrity_check;")).scalar()
            integrity_ok = (integrity_msg == "ok")
    except Exception as e:
        integrity_msg = str(e)

    # 3. Retrieve counts and perform seeding
    total_users = 0
    total_businesses = 0
    total_simulation_records = 0
    total_reports = 0
    total_notifications = 0

    db = next(get_db())
    try:
        # Check if an admin user exists
        # Look for the user with username="admin" first, then fallback to any admin role user
        admin_user = db.query(User).filter(User.username == "admin").first()
        if not admin_user:
            admin_user = db.query(User).filter(User.role == "admin").first()
            
        if not admin_user:
            admin_user = User(
                username="admin",
                email="admin@civilization.local",
                hashed_password=get_password_hash("admin123"),
                role="admin",
                is_active=True,
            )
            db.add(admin_user)
            db.commit()
            print("[Startup] Seeded default admin user (admin / admin123)")
        else:
            # Change username, email, password and ensure role/is_active only if not already initialized to default local values
            if admin_user.email != "admin@civilization.local" or admin_user.username != "admin" or admin_user.role != "admin" or not admin_user.is_active:
                admin_user.username = "admin"
                admin_user.email = "admin@civilization.local"
                admin_user.hashed_password = get_password_hash("admin123")
                admin_user.role = "admin"
                admin_user.is_active = True
                db.commit()
                print("[Startup] Configured default credentials on existing admin user")
        
        total_users = db.query(User).count()

        # Check and seed businesses / simulation history if empty
        total_businesses = db.query(Business).count()
        if total_businesses == 0:
            from app.services.simulator import seed_initial_data
            seed_initial_data(db)
            total_businesses = db.query(Business).count()
            print("[Startup] Seeded initial civilization datasets.")

        # Database self-healing: fix any corrupt fields that violate schema constraints
        corrupt_businesses = db.query(Business).filter(
            (Business.expenses < 0.0) | 
            (Business.revenue < 0.0) | 
            (Business.risk_level < 0.0) | 
            (Business.risk_level > 100.0) | 
            (Business.employees < 1)
        ).all()
        if corrupt_businesses:
            print(f"[Startup] Self-healing: Found {len(corrupt_businesses)} business records violating schema constraints. Correcting...")
            for biz in corrupt_businesses:
                if biz.expenses < 0.0:
                    biz.expenses = 800.0
                if biz.revenue < 0.0:
                    biz.revenue = 1000.0
                if biz.risk_level < 0.0:
                    biz.risk_level = 0.0
                elif biz.risk_level > 100.0:
                    biz.risk_level = 100.0
                if biz.employees < 1:
                    biz.employees = 1
            db.commit()
            total_businesses = db.query(Business).count()
            print("[Startup] Self-healing complete.")

        total_simulation_records = db.query(SimulationHistory).count()
        total_notifications = db.query(Notification).count()
        total_reports = db.query(SystemLog).filter(SystemLog.message.like("%Report%")).count()

    except Exception as e:
        db.rollback()
        print(f"[Startup Error] Failed to read database stats: {e}")
    finally:
        db.close()

    # 4. Print Startup Logs
    print("==================================================")
    print("         AI CIVILIZATION STARTUP SYSTEM           ")
    print("==================================================")
    print(f"Database Path:             {db_path}")
    print(f"Database Exists:           {db_exists_before}")
    print(f"Database Integrity:        {'PASS' if integrity_ok else f'FAIL ({integrity_msg})'}")
    print(f"Total Users:               {total_users}")
    print(f"Total Businesses:          {total_businesses}")
    print(f"Total Simulation Records:  {total_simulation_records}")
    print(f"Total Reports:             {total_reports}")
    print(f"Total Notifications:       {total_notifications}")
    print("--------------------------------------------------")
    print("ADMIN ACCOUNT READY")
    print("Username: admin")
    print("Password: admin123")
    print("==================================================")
    import sys
    sys.stdout.flush()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup Events
    logger.info("Initializing economic simulator application database...")
    try:
        verify_and_initialize_database()
        logger.info("Database initialization completed successfully.")
    except Exception as err:
        logger.error(f"Database initialization failed: {err}")
    yield
    # Shutdown Events
    logger.info("Shutting down economic simulator application...")

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Economic simulation platform populated by autonomous AI agents.",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# Load allowed CORS origins from settings.FRONTEND_URL
allowed_origins = [
    origin.strip() for origin in settings.FRONTEND_URL.split(",") if origin.strip()
]
# Ensure standard local dev origins are present for local fallback
for local_origin in ["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:3000"]:
    if local_origin not in allowed_origins:
        allowed_origins.append(local_origin)

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_origin_regex="https?://(localhost|127\\.0\\.0\\.1)(:\\d+)?",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(auth.router, prefix=f"{settings.API_V1_STR}/auth", tags=["Authentication"])
app.include_router(businesses.router, prefix=f"{settings.API_V1_STR}/businesses", tags=["Business Management"])
app.include_router(simulation.router, prefix=f"{settings.API_V1_STR}/simulation", tags=["Simulation Controls"])
app.include_router(predictions.router, prefix=f"{settings.API_V1_STR}/predictions", tags=["AI Predictions"])
app.include_router(reports.router, prefix=f"{settings.API_V1_STR}/reports", tags=["Reports"])

@app.get(f"{settings.API_V1_STR}/health", tags=["Health"])
def health_check():
    return {
        "status": "healthy",
        "app_name": settings.PROJECT_NAME
    }

@app.get("/")
def read_root():
    return {
        "status": "online",
        "app_name": settings.PROJECT_NAME,
        "api_documentation": "/docs"
    }
