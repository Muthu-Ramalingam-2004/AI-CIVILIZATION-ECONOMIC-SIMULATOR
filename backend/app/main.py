from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.database import engine, Base, get_db
from app.api import auth, businesses, simulation, predictions, reports
from app.models.user import User
from app.core.security import get_password_hash

# Create SQLAlchemy Database Tables if they do not exist
Base.metadata.create_all(bind=engine)

def _seed_default_admin():
    """Create a default admin account (admin / admin123) if none exists."""
    from sqlalchemy import inspect
    
    # 11. Print the database path being used at startup.
    db_path = settings.DATABASE_URL
    print(f"[Startup] Database URL/path being used: {db_path}")

    # 12. Print whether the users table exists.
    inspector = inspect(engine)
    users_exist = "users" in inspector.get_table_names()
    print(f"[Startup] Users table exists: {users_exist}")

    if users_exist:
        db = next(get_db())
        try:
            # 7 & 14. Check whether the first admin user exists and do not duplicate.
            admin_user = db.query(User).filter(User.username == "admin").first()
            if not admin_user:
                # 8 & 9. Automatically create default admin if no admin exists, with hashed password.
                admin = User(
                    username="admin",
                    email="admin@example.com",
                    hashed_password=get_password_hash("admin123"),
                    role="admin",
                    is_active=True,
                )
                db.add(admin)
                db.commit()
            
            # 13. Print the total number of users.
            total_users = db.query(User).count()
            print(f"[Startup] Total number of users in database: {total_users}")
        except Exception:
            db.rollback()
        finally:
            db.close()

_seed_default_admin()


app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Economic simulation platform populated by autonomous AI agents.",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Set CORS origins
# Allow all origins for local deployment testing flexibility
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000"
    ],
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

@app.get("/")
def read_root():
    return {
        "status": "online",
        "app_name": settings.PROJECT_NAME,
        "api_documentation": "/docs"
    }
