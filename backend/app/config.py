from pydantic_settings import BaseSettings
from pathlib import Path

class Settings(BaseSettings):
    APP_NAME: str = "GPIB Calibration System"
    VERSION: str = "1.0.0"
    
    # File storage paths
    DATA_DIR: Path = Path("./calibration_data")
    REPORTS_DIR: Path = Path("./calibration_data/reports")
    LOGS_DIR: Path = Path("./calibration_data/logs")
    
    # GPIB Configuration
    GPIB_BACKEND: str = "@py"
    COMMAND_TIMEOUT: int = 10000
    
    # Calibration defaults
    DEFAULT_COVERAGE_FACTOR: float = 2.0
    MAX_TEST_POINTS: int = 1000
    
    class Config:
        env_file = ".env"

settings = Settings()

# Create directories on startup
settings.DATA_DIR.mkdir(exist_ok=True)
settings.REPORTS_DIR.mkdir(exist_ok=True)
settings.LOGS_DIR.mkdir(exist_ok=True)
