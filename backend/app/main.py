# ===== app/main.py (UPDATED WITH MANUAL MODE) =====

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.services.gpib_manager import GPIBManager
from app.services.calibration_service import CalibrationService
from app.services.file_storage import FileStorage
from app.services.instrument_library import InstrumentLibrary
from app.models.instrument import ConnectionRequest, ConnectionResponse
from app.models.calibration import (
    TestConfig, CalibrationReport, TestPointResult,
    ManualCommandRequest, ManualCommandResponse
)

app = FastAPI(title=settings.APP_NAME, version=settings.VERSION)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

gpib_manager = GPIBManager()
calibration_service = CalibrationService(gpib_manager)
instrument_library = InstrumentLibrary()

@app.get("/")
async def root():
    return {"application": settings.APP_NAME, "version": settings.VERSION}

@app.get("/api/instruments/available")
async def list_available_instruments():
    """List all supported instruments from JSON config"""
    try:
        return {
            "calibrators": instrument_library.list_instruments("calibrators"),
            "dmms": instrument_library.list_instruments("dmms"),
            "psus": instrument_library.list_instruments("psus")
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/instruments/connect", response_model=ConnectionResponse)
async def connect_instruments(request: ConnectionRequest):
    """Connect with user-selected instrument models"""
    try:
        dut_instrument_type = request.dut_type + "s"
        
        cal_info = await gpib_manager.connect_instrument(
            request.calibrator_address,
            "calibrators",
            request.calibrator_model,
            "calibrator"
        )
        
        dut_info = await gpib_manager.connect_instrument(
            request.dut_address,
            dut_instrument_type,
            request.dut_model,
            "dut"
        )
        
        return ConnectionResponse(
            success=True,
            calibrator=cal_info,
            dut=dut_info,
            message="Instruments connected successfully"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/instruments/disconnect")
async def disconnect_instruments():
    try:
        await gpib_manager.disconnect_all()
        return {"success": True, "message": "Instruments disconnected"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/instruments/resources")
async def list_resources():
    try:
        resources = gpib_manager.list_resources()
        return {"resources": resources}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# NEW: Manual command endpoint
@app.post("/api/manual/command", response_model=ManualCommandResponse)
async def send_manual_command(request: ManualCommandRequest):
    """
    Send a single command to calibrator or DUT
    Used for manual mode
    
    Example:
    {
      "instrument": "calibrator",
      "command_name": "set_dc_voltage",
      "parameters": {"value": 10.0},
      "expect_response": false
    }
    """
    try:
        from datetime import datetime
        start_time = datetime.now()
        
        # Send command
        response = await gpib_manager.send_command(
            request.instrument,
            request.command_name,
            expect_response=request.expect_response,
            **request.parameters
        )
        
        duration = int((datetime.now() - start_time).total_seconds() * 1000)
        
        # Get the actual SCPI command that was sent
        if request.instrument == 'calibrator':
            instrument_type = "calibrators"
            model = gpib_manager.calibrator_model
        else:
            instrument_type = gpib_manager.dut_type
            model = gpib_manager.dut_model
        
        scpi_command = instrument_library.get_command(
            instrument_type,
            model,
            request.command_name,
            **request.parameters
        )
        
        return ManualCommandResponse(
            success=True,
            command_sent=scpi_command,
            response=response,
            duration_ms=duration,
            message=f"Command sent to {request.instrument}"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# NEW: Single point test endpoint
@app.post("/api/calibration/single-point", response_model=TestPointResult)
async def run_single_point(value: float, config: TestConfig, operator: str = "Admin"):
    """
    Run calibration for ONE test point only
    Used for manual step-by-step testing
    """
    try:
        result = await calibration_service.run_single_point_test(value, config, operator)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/calibration/semi-auto/start", response_model=CalibrationReport)
async def start_semi_auto_test(config: TestConfig, operator: str = "Admin"):
    """
    Run COMPLETE semi-automatic test
    Tests each point ONE AT A TIME automatically
    """
    try:
        report = await calibration_service.run_semi_auto_test(config, operator)
        return report
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/results/reports")
async def get_all_reports(limit: int = 100):
    try:
        reports = await FileStorage.list_reports(limit)
        return {"reports": reports}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/results/reports/{report_id}", response_model=CalibrationReport)
async def get_report(report_id: str):
    try:
        report = await FileStorage.load_report(report_id)
        if not report:
            raise HTTPException(status_code=404, detail="Report not found")
        return report
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/results/reports/{report_id}")
async def delete_report(report_id: str):
    try:
        success = await FileStorage.delete_report(report_id)
        if not success:
            raise HTTPException(status_code=404, detail="Report not found")
        return {"success": True, "message": "Report deleted"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/commands/recent")
async def get_recent_commands(limit: int = 50):
    try:
        commands = gpib_manager.get_command_log(limit)
        return {"commands": commands}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)