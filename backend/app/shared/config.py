import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "AI-Powered Suspicious Pattern & Network Analysis System"
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./app.db")
    JWT_SECRET: str = os.getenv("JWT_SECRET", "super-secret-jwt-key-antigravity-2026")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 120
    
    HARDHAT_RPC_URL: str = os.getenv("HARDHAT_RPC_URL", "http://127.0.0.1:8545")
    CONTRACT_ADDRESS: str = os.getenv("CONTRACT_ADDRESS", "")

    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()
