from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import get_password_hash, verify_password, create_access_token, decode_access_token, create_password_reset_token, verify_password_reset_token
from app.models.user import User
from app.models.password_reset import PasswordReset
from app.schemas.user import UserCreate, UserResponse, Token, ForgotPasswordRequest, ResetPasswordRequest
from app.services.simulator import log_event
from app.services.email_service import send_reset_password_email
from datetime import datetime, timezone, timedelta
import re


router = APIRouter()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    username = decode_access_token(token)
    if username is None:
        raise credentials_exception
    
    user = db.query(User).filter(User.username == username).first()
    if user is None:
        raise credentials_exception
    return user

def get_current_admin(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="The user does not have enough privileges"
        )
    return current_user

@router.post("/register", response_model=UserResponse)
def register(user_in: UserCreate, db: Session = Depends(get_db)):
    # Check if username or email exists
    user_exists = db.query(User).filter(User.username == user_in.username).first()
    if user_exists:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The username already exists in the system."
        )
    email_exists = db.query(User).filter(User.email == user_in.email).first()
    if email_exists:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The email already exists in the system."
        )

    # First user registered is an admin automatically (convenient for setup)
    user_count = db.query(User).count()
    role = "admin" if user_count == 0 else "user"

    hashed_pw = get_password_hash(user_in.password)
    user = User(
        username=user_in.username,
        email=user_in.email,
        hashed_password=hashed_pw,
        role=role,
        is_active=True
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    
    log_event(db, f"New user '{user.username}' registered successfully with role '{user.role}'.", "INFO", "auth")
    return user

@router.post("/login", response_model=Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == form_data.username).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect username or password"
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user"
        )
    
    access_token = create_access_token(subject=user.username)
    log_event(db, f"User '{user.username}' logged in successfully.", "INFO", "auth")
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "role": user.role,
        "username": user.username
    }

@router.get("/users", response_model=list[UserResponse])
def get_users(db: Session = Depends(get_db), current_user = Depends(get_current_admin)):
    return db.query(User).order_by(User.id).all()

@router.put("/users/{user_id}/role", response_model=UserResponse)
def update_user_role(
    user_id: int, 
    role: str, 
    db: Session = Depends(get_db), 
    current_user = Depends(get_current_admin)
):
    if role not in ["admin", "user"]:
        raise HTTPException(status_code=400, detail="Invalid role. Choose 'admin' or 'user'")
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.role = role
    db.commit()
    db.refresh(user)
    log_event(db, f"User role for '{user.username}' updated to '{role}' by admin '{current_user.username}'.", "INFO", "auth")
    return user

@router.put("/users/{user_id}/status", response_model=UserResponse)
def update_user_status(
    user_id: int, 
    is_active: bool, 
    db: Session = Depends(get_db), 
    current_user = Depends(get_current_admin)
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.id == current_user.id:
        raise HTTPException(status_code=400, detail="You cannot deactivate your own admin account")
    user.is_active = is_active
    db.commit()
    db.refresh(user)
    log_event(db, f"User active status for '{user.username}' updated to '{is_active}' by admin '{current_user.username}'.", "INFO", "auth")
    return user

@router.delete("/users/{user_id}", status_code=204)
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.id == current_user.id:
        raise HTTPException(status_code=400, detail="You cannot delete your own admin account")
    db.delete(user)
    db.commit()
    log_event(db, f"User '{user.username}' (ID: {user_id}) deleted by admin '{current_user.username}'.", "WARNING", "auth")
    return None

@router.post("/users", response_model=UserResponse, status_code=201)
def create_user(
    user_in: UserCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    if db.query(User).filter(User.username == user_in.username).first():
        raise HTTPException(status_code=400, detail="Username already exists")
    if db.query(User).filter(User.email == user_in.email).first():
        raise HTTPException(status_code=400, detail="Email already exists")
    user = User(
        username=user_in.username,
        email=user_in.email,
        hashed_password=get_password_hash(user_in.password),
        role="user",
        is_active=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    log_event(db, f"Admin '{current_user.username}' created new user '{user.username}'.", "INFO", "auth")
    return user

@router.post("/forgot-password")
def forgot_password(req: ForgotPasswordRequest, db: Session = Depends(get_db)):
    # 1. Search for any user with this email (admin or regular user)
    user = db.query(User).filter(User.email == req.email).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No account found with this email."
        )
    
    # 2. Rate limit: Max 5 reset requests per hour per email
    one_hour_ago = datetime.now(timezone.utc) - timedelta(hours=1)
    request_count = db.query(PasswordReset).filter(
        PasswordReset.email == req.email,
        PasswordReset.created_at >= one_hour_ago
    ).count()
    
    if request_count >= 5:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many password reset requests. Limit is 5 per hour."
        )
        
    # 3. Generate reset token
    token = create_password_reset_token(req.email)
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=15)
    
    # 4. Save reset token to database
    password_reset = PasswordReset(
        email=req.email,
        token=token,
        expires_at=expires_at,
        is_used=False
    )
    db.add(password_reset)
    db.commit()
    
    # 5. Send reset email
    try:
        send_reset_password_email(req.email, token)
    except Exception as e:
        # Rollback token insertion if email fails to send
        db.delete(password_reset)
        db.commit()
        
        # Log failure in system logs
        log_event(db, f"Password reset email delivery failed for: {req.email}. Error: {str(e)}", "ERROR", "auth")
        
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to send email: {str(e)}"
        )
    
    # 6. Log reset request event in system logs
    log_event(db, f"Password reset requested for email: {req.email}", "INFO", "auth")
    
    return {"message": "Password reset email sent."}

@router.post("/reset-password")
def reset_password(req: ResetPasswordRequest, db: Session = Depends(get_db)):
    # 1. Query the token from the database
    db_reset = db.query(PasswordReset).filter(PasswordReset.token == req.token).first()
    if not db_reset or db_reset.is_used:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid reset link."
        )
        
    # 2. Check token expiration
    # Make db_reset.expires_at timezone-aware for comparison (or compare native UTC)
    expires_at_utc = db_reset.expires_at.replace(tzinfo=timezone.utc) if db_reset.expires_at.tzinfo is None else db_reset.expires_at
    if expires_at_utc < datetime.now(timezone.utc):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Reset link has expired."
        )
        
    # 3. Verify JWT token signature and claims
    email = verify_password_reset_token(req.token)
    if not email or email != db_reset.email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid reset link."
        )
        
    # 4. Validate password strength
    pwd = req.new_password
    if len(pwd) < 8:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Password must be at least 8 characters long.")
    if not re.search(r"[A-Z]", pwd):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Password must contain at least one uppercase letter.")
    if not re.search(r"[a-z]", pwd):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Password must contain at least one lowercase letter.")
    if not re.search(r"[0-9]", pwd):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Password must contain at least one number.")
    if not re.search(r"[!@#$%^&*(),.?\":{}|<>]", pwd):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Password must contain at least one special character.")
        
    # 5. Find and update the user's password
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User no longer exists."
        )
        
    user.hashed_password = get_password_hash(pwd)
    
    # 6. Invalidate the reset token
    db_reset.is_used = True
    
    # 7. Commit changes and log event
    db.commit()
    log_event(db, f"Password successfully reset for email: {email}", "INFO", "auth")
    
    return {"message": "Password updated successfully."}

