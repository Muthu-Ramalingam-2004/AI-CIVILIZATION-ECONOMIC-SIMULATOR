from fastapi.testclient import TestClient
from app.main import app
from app.core.database import get_db, Base, engine
from app.models.user import User
import pytest

client = TestClient(app)

def test_full_auth_flow():
    # 1. Clean database user table except seeded admin
    db = next(get_db())
    db.query(User).filter(User.username != "admin").delete()
    db.commit()
    db.close()

    # 2. Register a new user
    reg_response = client.post("/api/v1/auth/register", json={
        "username": "testuser",
        "email": "testuser@example.com",
        "password": "Password123!"
    })
    assert reg_response.status_code == 200, f"Register failed: {reg_response.text}"
    print("Registration successful:", reg_response.json())

    # 3. Login with the new user
    login_response = client.post("/api/v1/auth/login", data={
        "username": "testuser",
        "password": "Password123!"
    })
    assert login_response.status_code == 200, f"Login failed: {login_response.text}"
    token = login_response.json()["access_token"]
    print("Login successful:", login_response.json())

    # 4. Logout
    logout_response = client.post("/api/v1/auth/logout", headers={
        "Authorization": f"Bearer {token}"
    })
    assert logout_response.status_code == 200, f"Logout failed: {logout_response.text}"
    print("Logout successful:", logout_response.json())

    # 5. Try logging in again
    login_response_2 = client.post("/api/v1/auth/login", data={
        "username": "testuser",
        "password": "Password123!"
    })
    assert login_response_2.status_code == 200, f"Second login failed: {login_response_2.text}"
    print("Second login successful:", login_response_2.json())

if __name__ == "__main__":
    test_full_auth_flow()
