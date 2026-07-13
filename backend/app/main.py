from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.database import engine, Base
from app.api import auth, businesses, simulation, predictions, reports

# Create SQLAlchemy Database Tables if they do not exist
Base.metadata.create_all(bind=engine)

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
