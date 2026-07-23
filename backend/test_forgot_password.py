from fastapi.testclient import TestClient
from app.main import app
from app.core.database import get_db
from app.models.user import User
from app.core.security import verify_password

client = TestClient(app)

def test_direct_forgot_password():
    # 1. Ensure testuser exists with a known password
    db = next(get_db())
    db.query(User).filter(User.username == "testuser").delete()
    db.commit()
    
    # We will register them first
    reg_response = client.post("/api/v1/auth/register", json={
        "username": "testuser",
        "email": "testuser@example.com",
        "password": "OldPassword123!"
    })
    assert reg_response.status_code == 200
    
    # 2. Call forgot-password with mismatched passwords
    res = client.post("/api/v1/auth/forgot-password", json={
        "username_or_email": "testuser",
        "new_password": "NewPassword123!",
        "confirm_password": "MismatchedPassword123!"
    })
    assert res.status_code == 400
    assert "do not match" in res.json()["detail"].lower()
    print("Mismatched password check passed!")

    # 3. Call forgot-password with weak password
    res = client.post("/api/v1/auth/forgot-password", json={
        "username_or_email": "testuser",
        "new_password": "weak",
        "confirm_password": "weak"
    })
    assert res.status_code == 400
    assert "at least 8 characters" in res.json()["detail"].lower()
    print("Weak password check passed!")

    # 4. Call forgot-password with non-existent user
    res = client.post("/api/v1/auth/forgot-password", json={
        "username_or_email": "nonexistentuser",
        "new_password": "NewPassword123!",
        "confirm_password": "NewPassword123!"
    })
    assert res.status_code == 404
    print("Non-existent user check passed!")

    # 5. Call forgot-password with correct details (using username)
    res = client.post("/api/v1/auth/forgot-password", json={
        "username_or_email": "testuser",
        "new_password": "NewPassword123!",
        "confirm_password": "NewPassword123!"
    })
    assert res.status_code == 200
    print("Direct password reset using username passed!")

    # Verify we can login with new password
    login_response = client.post("/api/v1/auth/login", data={
        "username": "testuser",
        "password": "NewPassword123!"
    })
    assert login_response.status_code == 200
    print("Login with new password passed!")

    # 6. Call forgot-password with email
    res = client.post("/api/v1/auth/forgot-password", json={
        "username_or_email": "testuser@example.com",
        "new_password": "AnotherPassword123!",
        "confirm_password": "AnotherPassword123!"
    })
    assert res.status_code == 200
    print("Direct password reset using email passed!")

    # Verify login works with the newest password
    login_response = client.post("/api/v1/auth/login", data={
        "username": "testuser",
        "password": "AnotherPassword123!"
    })
    assert login_response.status_code == 200
    print("Login with latest password passed!")

    # Clean up testuser
    db.query(User).filter(User.username == "testuser").delete()
    db.commit()
    db.close()
    print("Tests completed successfully!")

if __name__ == "__main__":
    test_direct_forgot_password()
