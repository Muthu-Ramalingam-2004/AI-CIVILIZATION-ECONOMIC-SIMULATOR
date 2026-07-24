from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy import func
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.config import settings
from app.core.security import get_password_hash, verify_password, create_access_token, decode_access_token
from app.models.user import User
from app.schemas.user import (
    UserCreate, UserResponse, Token, ForgotPasswordRequest,
    ProfileUpdate, EmailUpdate, PasswordChange, ThemeUpdate
)
from app.services.simulator import log_event
from datetime import datetime, timezone, timedelta
import re


router = APIRouter()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")

def get_current_user(request: Request, token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    import sys
    auth_header = request.headers.get("authorization")
    print("----- get_current_user DEBUG -----", file=sys.stderr)
    print(f"Raw Authorization Header: '{auth_header}'", file=sys.stderr)
    print(f"Raw token received: '{token}'", file=sys.stderr)
    sys.stderr.flush()
    
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    username = decode_access_token(token)
    print(f"Decoded username from token: '{username}'", file=sys.stderr)
    sys.stderr.flush()
    
    if username is None:
        print("ERROR: decode_access_token returned None", file=sys.stderr)
        sys.stderr.flush()
        raise credentials_exception
    
    user = db.query(User).filter(func.lower(User.username) == func.lower(username.strip())).first()
    if user is None:
        print(f"ERROR: No user found in DB for username '{username}'", file=sys.stderr)
        sys.stderr.flush()
        raise credentials_exception
        
    print(f"SUCCESS: Found user '{user.username}' in DB with role '{user.role}'", file=sys.stderr)
    print("----------------------------------", file=sys.stderr)
    sys.stderr.flush()
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
    username = user_in.username.strip()
    email = user_in.email.strip()
    
    # Check if username or email exists case-insensitively
    user_exists = db.query(User).filter(func.lower(User.username) == func.lower(username)).first()
    if user_exists:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The username already exists in the system."
        )
    email_exists = db.query(User).filter(func.lower(User.email) == func.lower(email)).first()
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
        username=username,
        email=email,
        hashed_password=hashed_pw,
        role=role,
        is_active=True
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    
    print("----- REGISTER DEBUG -----", file=sys.stderr)
    print(f"Username saved: '{user.username}'", file=sys.stderr)
    print(f"Email saved: '{user.email}'", file=sys.stderr)
    sys.stderr.flush()

    log_event(db, f"New user '{user.username}' registered successfully with role '{user.role}'.", "INFO", "auth")
    return user

@router.post("/login", response_model=Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    username_input = form_data.username.strip()
    print("----- LOGIN DEBUG -----", file=sys.stderr)
    print(f"Received username: '{username_input}'", file=sys.stderr)
    sys.stderr.flush()

    user = db.query(User).filter(
        (func.lower(User.username) == func.lower(username_input)) |
        (func.lower(User.email) == func.lower(username_input))
    ).first()

    if user:
        print(f"User found: '{user.username}' (email: '{user.email}')", file=sys.stderr)
    else:
        print("User found: None", file=sys.stderr)
    sys.stderr.flush()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect username or password: User not found."
        )

    is_valid_password = verify_password(form_data.password, user.hashed_password)
    print(f"Password verify result: {is_valid_password}", file=sys.stderr)
    sys.stderr.flush()

    if not is_valid_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect username or password: Cryptographic mismatch."
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User is inactive"
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
    print("----- FORGOT PASSWORD DEBUG -----", file=sys.stderr)
    username_or_email_input = req.username_or_email.strip() if req.username_or_email else ""
    print(f"Input: '{username_or_email_input}'", file=sys.stderr)
    sys.stderr.flush()

    # 1. Verify new password matches confirm password
    if req.new_password != req.confirm_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Passwords do not match."
        )

    # 2. Validate password strength
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

    # 3. Find user by username OR email case-insensitively
    user = db.query(User).filter(
        (func.lower(User.username) == func.lower(username_or_email_input)) | 
        (func.lower(User.email) == func.lower(username_or_email_input))
    ).first()
    
    if user:
        print(f"User found: '{user.username}'", file=sys.stderr)
    else:
        print("User found: None", file=sys.stderr)
    sys.stderr.flush()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No account found with this username or email."
        )

    # 4. Hash the password correctly and save
    user.hashed_password = get_password_hash(pwd)
    db.commit()
    db.refresh(user)

    print("Password updated successfully", file=sys.stderr)
    print("---------------------------------", file=sys.stderr)
    sys.stderr.flush()

    # 5. Log the password reset event
    log_event(db, f"Password successfully reset for user: {user.username}", "INFO", "auth")

    return {"message": "Password updated successfully.", "username": user.username}

@router.post("/logout")
def logout(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    log_event(db, f"User '{current_user.username}' logged out successfully.", "INFO", "auth")
    return {"message": "Logged out successfully."}

@router.get("/users/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user

@router.put("/users/me/profile")
def update_my_profile(
    req: ProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Validate fields
    username = req.username.strip()
    email = req.email.strip()
    
    if not username:
        raise HTTPException(status_code=400, detail="Username cannot be empty.")
    if not email:
        raise HTTPException(status_code=400, detail="Email cannot be empty.")
        
    # Check if username is taken by someone else
    if username.lower() != current_user.username.lower():
        username_exists = db.query(User).filter(
            (func.lower(User.username) == func.lower(username)) & (User.id != current_user.id)
        ).first()
        if username_exists:
            raise HTTPException(status_code=400, detail="Username already exists.")
            
    # Check if email is taken by someone else
    if email.lower() != current_user.email.lower():
        email_exists = db.query(User).filter(
            (func.lower(User.email) == func.lower(email)) & (User.id != current_user.id)
        ).first()
        if email_exists:
            raise HTTPException(status_code=400, detail="Email already exists.")

    # Update fields
    old_username = current_user.username
    current_user.username = username
    current_user.email = email
    current_user.full_name = req.full_name.strip() if req.full_name else None
    current_user.phone_number = req.phone_number.strip() if req.phone_number else None
    current_user.profile_picture = req.profile_picture.strip() if req.profile_picture else None
    
    db.commit()
    db.refresh(current_user)
    
    log_event(db, f"User '{old_username}' updated profile. New username: '{current_user.username}'.", "INFO", "auth")
    
    # If username changed, generate a new access token
    new_token = None
    if old_username.lower() != current_user.username.lower():
        new_token = create_access_token(subject=current_user.username)
        
    return {
        "message": "Profile updated successfully.",
        "user": current_user,
        "access_token": new_token
    }

@router.put("/users/me/email")
def update_my_email(
    req: EmailUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    current_email = req.current_email.strip()
    new_email = req.new_email.strip()
    
    if current_email.lower() != current_user.email.lower():
        raise HTTPException(status_code=400, detail="Incorrect current email address.")
        
    if new_email.lower() == current_user.email.lower():
        return {"message": "Email updated successfully.", "user": current_user}
        
    email_exists = db.query(User).filter(
        (func.lower(User.email) == func.lower(new_email)) & (User.id != current_user.id)
    ).first()
    if email_exists:
        raise HTTPException(status_code=400, detail="Email already exists in the system.")
        
    current_user.email = new_email
    db.commit()
    db.refresh(current_user)
    
    log_event(db, f"User '{current_user.username}' changed email to '{new_email}'.", "INFO", "auth")
    return {"message": "Email updated successfully.", "user": current_user}

@router.put("/users/me/password")
def update_my_password(
    req: PasswordChange,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Verify current password
    if not verify_password(req.current_password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="Incorrect current password.")
        
    if req.new_password != req.confirm_password:
        raise HTTPException(status_code=400, detail="New passwords do not match.")
        
    pwd = req.new_password
    if len(pwd) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters long.")
    if not re.search(r"[A-Z]", pwd):
        raise HTTPException(status_code=400, detail="Password must contain at least one uppercase letter.")
    if not re.search(r"[a-z]", pwd):
        raise HTTPException(status_code=400, detail="Password must contain at least one lowercase letter.")
    if not re.search(r"[0-9]", pwd):
        raise HTTPException(status_code=400, detail="Password must contain at least one number.")
    if not re.search(r"[!@#$%^&*(),.?\":{}|<>]", pwd):
        raise HTTPException(status_code=400, detail="Password must contain at least one special character.")
        
    current_user.hashed_password = get_password_hash(pwd)
    db.commit()
    db.refresh(current_user)
    
    log_event(db, f"User '{current_user.username}' updated their password.", "INFO", "auth")
    return {"message": "Password updated successfully."}

@router.put("/users/me/theme")
def update_my_theme(
    req: ThemeUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    theme = req.theme.strip().lower()
    if theme not in ["light", "dark", "ocean", "nature"]:
        raise HTTPException(status_code=400, detail="Invalid theme choice.")
        
    current_user.theme = theme
    db.commit()
    db.refresh(current_user)
    
    log_event(db, f"User '{current_user.username}' changed theme to '{theme}'.", "INFO", "auth")
    return {"message": "Theme updated successfully.", "theme": theme}


