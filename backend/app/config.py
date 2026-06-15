import os


class Settings:
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL",
        "postgresql://islamicfinance:changeme_in_production@localhost:5432/islamicfinance_db",
    )
    REDIS_URL: str = os.getenv("REDIS_URL", "redis://localhost:6379/0")
    JWT_SECRET_KEY: str = os.getenv("JWT_SECRET_KEY", "dev_secret_key_change_in_production")
    JWT_ALGORITHM: str = os.getenv("JWT_ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60"))
    HASHGRAPH_ACCOUNT_ID: str = os.getenv("HASHGRAPH_ACCOUNT_ID", "")
    HASHGRAPH_PRIVATE_KEY: str = os.getenv("HASHGRAPH_PRIVATE_KEY", "")
    HASHGRAPH_NETWORK: str = os.getenv("HASHGRAPH_NETWORK", "testnet")


settings = Settings()
