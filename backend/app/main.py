from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.services.gpib_manager import GPIBManager
from app.services.calibration_service import CalibrationService
from app.services.file_storage import FileStorage
from app.models.instrument import ConnectionRequest, ConnectionResponse
from app.models.calibration import TestConfig, CalibrationReport

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

@app.get("/")
async def root():
    return {"application": settings.APP_NAME, "version": settings.VERSION}

@app.post("/api/instruments/connect", response_model=ConnectionResponse)
async def connect_instruments(request: ConnectionRequest):
    try:
        cal_info = await gpib_manager.connect_instrument(request.calibrator_address, 'calibrator')
        dut_info = await gpib_manager.connect_instrument(request.dut_address, 'dut')
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

@app.post("/api/calibration/semi-auto/start", response_model=CalibrationReport)
async def start_semi_auto_test(config: TestConfig, operator: str = "Admin"):
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
