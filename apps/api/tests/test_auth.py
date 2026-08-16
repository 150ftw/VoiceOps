import pytest
from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    decrypt_secret,
    encrypt_secret,
    get_password_hash,
    verify_password,
)
from app.schemas.auth import LoginRequest, RegisterRequest
from app.services.auth_service import AuthService


@pytest.mark.asyncio
async def test_password_hashing():
    pw = "SuperSecurePassword123!"
    hashed = get_password_hash(pw)
    assert hashed != pw
    assert verify_password(pw, hashed) is True
    assert verify_password("WrongPassword", hashed) is False


@pytest.mark.asyncio
async def test_jwt_tokens():
    sub = "123e4567-e89b-12d3-a456-426614174000"
    access_token = create_access_token(sub)
    refresh_token = create_refresh_token(sub)

    acc_payload = decode_token(access_token)
    assert acc_payload is not None
    assert acc_payload["sub"] == sub
    assert acc_payload["type"] == "access"

    ref_payload = decode_token(refresh_token)
    assert ref_payload is not None
    assert ref_payload["sub"] == sub
    assert ref_payload["type"] == "refresh"


@pytest.mark.asyncio
async def test_secret_encryption():
    secret = "ghp_1234567890abcdefghijklmnopqrstuvwxyz"
    encrypted = encrypt_secret(secret)
    assert encrypted != secret
    decrypted = decrypt_secret(encrypted)
    assert decrypted == secret


@pytest.mark.asyncio
async def test_auth_service_registration_and_login(test_db_session):
    reg_data = RegisterRequest(
        email="shivam@example.com",
        password="MyStrongPassword123!",
        full_name="Shivam Sharma",
    )
    user, token_resp, refresh_token = await AuthService.register(test_db_session, reg_data)

    assert user.email == "shivam@example.com"
    assert user.full_name == "Shivam Sharma"
    assert token_resp.access_token is not None

    # Login
    login_data = LoginRequest(
        email="shivam@example.com",
        password="MyStrongPassword123!",
    )
    logged_user, login_token, _ = await AuthService.login(test_db_session, login_data)
    assert logged_user.id == user.id
    assert login_token.access_token is not None
