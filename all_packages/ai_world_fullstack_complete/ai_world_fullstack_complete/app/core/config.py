from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file='.env', env_file_encoding='utf-8', extra='ignore')

    APP_NAME: str = 'AI World API'
    APP_ENV: str = 'development'
    APP_DEBUG: bool = True
    API_HOST: str = '0.0.0.0'
    API_PORT: int = 8000

    POSTGRES_DB: str = 'ai_world'
    POSTGRES_USER: str = 'postgres'
    POSTGRES_PASSWORD: str = 'postgres'
    POSTGRES_HOST: str = 'db'
    POSTGRES_PORT: int = 5432

    REDIS_HOST: str = 'redis'
    REDIS_PORT: int = 6379

    DATABASE_URL: str = 'postgresql+psycopg://postgres:postgres@db:5432/ai_world'
    AUTO_SEED: bool = True
    AUTO_SEED_MORE: bool = True
    AUTH_SECRET_KEY: str = 'change-me-for-production'
    AUTH_TOKEN_EXPIRE_HOURS: int = 24

    LLM_ENABLED: bool = False
    LLM_PROVIDER: str = 'openai'
    OPENAI_API_KEY: str = ''
    OPENAI_BASE_URL: str = 'https://api.openai.com/v1'
    OPENAI_MODEL: str = 'gpt-4.1-mini'
    OLLAMA_BASE_URL: str = 'http://host.docker.internal:11434/v1'
    OLLAMA_MODEL: str = 'qwen2.5:7b-instruct'


settings = Settings()
