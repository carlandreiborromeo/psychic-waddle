from pydantic import BaseModel, Field
from typing import Optional

class InstrumentInfo(BaseModel):
    address: str
    connected: bool = False
    model: str = ""
    serial_number: str = ""
    firmware_version: str = ""
    instrument_type: str = ""  # NEW: "calibrator", "dmm", "psu"
    model_key: str = ""  # NEW: "Fluke_5522A", "Keysight_34461A"
    last_cal_date: Optional[str] = None
    last_response: str = ""

class ConnectionRequest(BaseModel):
    calibrator_address: str = Field(..., example="GPIB0::1::INSTR")
    calibrator_model: str = Field(default="Fluke_5522A", example="Fluke_5522A")  # NEW
    dut_address: str = Field(..., example="GPIB0::22::INSTR")
    dut_model: str = Field(default="Keysight_34461A", example="Keysight_34461A")  # NEW
    dut_type: str = Field(default="dmm", example="dmm")  # NEW: "dmm" or "psu"

class ConnectionResponse(BaseModel):
    success: bool
    calibrator: InstrumentInfo
    dut: InstrumentInfo
    message: str