from pydantic import BaseModel, Field, validator
from typing import List, Optional
from datetime import datetime
from enum import Enum

class SignalType(str, Enum):
    DC = "DC"
    AC = "AC"

class PassFail(str, Enum):
    PASS = "PASS"
    FAIL = "FAIL"

class TestConfig(BaseModel):
    signal_type: SignalType = SignalType.DC
    test_points: List[float]
    frequency: Optional[float] = None
    samples_per_point: int = 10
    tolerance_percent: float = 0.01
    calibrator_accuracy: float = 0.00005
    dut_accuracy: float = 0.0001
    
    @validator('test_points')
    def validate_test_points(cls, v):
        if len(v) == 0:
            raise ValueError('At least one test point required')
        if len(v) > 1000:
            raise ValueError('Maximum 1000 test points allowed')
        return v

class TestPointResult(BaseModel):
    timestamp: str
    calibrator_output: float
    signal_type: SignalType
    frequency: Optional[float] = None
    readings: List[float]
    num_samples: int
    mean_reading: float
    std_deviation: float
    min_reading: float
    max_reading: float
    error: float
    error_percentage: float
    uncertainty_type_a: float
    uncertainty_type_b: float
    combined_uncertainty: float
    expanded_uncertainty: float
    coverage_factor: float = 2.0
    tolerance: float
    pass_fail: PassFail
    remarks: str = ""

class CalibrationReport(BaseModel):
    report_id: str
    created_at: str
    calibrator_model: str
    calibrator_serial: str
    calibrator_cal_date: Optional[str] = None
    dut_model: str
    dut_serial: str
    dut_asset_id: Optional[str] = None
    test_type: str
    test_config: TestConfig
    temperature_c: Optional[float] = None
    humidity_percent: Optional[float] = None
    operator: str
    test_points: List[TestPointResult]
    total_points: int
    points_passed: int
    points_failed: int
    overall_status: PassFail
    duration_seconds: Optional[float] = None
    completed: bool = False

class CommandLogEntry(BaseModel):
    timestamp: str
    instrument: str
    command: str
    response: Optional[str] = None
    duration_ms: int
    status: str
