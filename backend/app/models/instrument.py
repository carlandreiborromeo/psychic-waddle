from pydantic import BaseModel, Field
from typing import Optional

class InstrumentInfo(BaseModel):
    address: str
    connected: bool = False
    model: str = ""
    serial_number: str = ""
    firmware_version: str = ""
    last_cal_date: Optional[str] = None
    last_response: str = ""

class ConnectionRequest(BaseModel):
    calibrator_address: str = Field(..., example="GPIB0::1::INSTR")
    dut_address: str = Field(..., example="GPIB0::22::INSTR")

class ConnectionResponse(BaseModel):
    success: bool
    calibrator: InstrumentInfo
    dut: InstrumentInfo
    message: str
