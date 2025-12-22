import json
import aiofiles
from pathlib import Path
from typing import List, Optional
from datetime import datetime
from app.config import settings
from app.models.calibration import CalibrationReport, CommandLogEntry

class FileStorage:
    """Simple JSON file storage for calibration reports"""
    
    @staticmethod
    async def save_report(report: CalibrationReport) -> bool:
        """Save calibration report to JSON file"""
        try:
            file_path = settings.REPORTS_DIR / f"{report.report_id}.json"
            async with aiofiles.open(file_path, 'w') as f:
                await f.write(report.json(indent=2))
            return True
        except Exception as e:
            print(f"Error saving report: {e}")
            return False
    
    @staticmethod
    async def load_report(report_id: str) -> Optional[CalibrationReport]:
        """Load calibration report from JSON file"""
        try:
            file_path = settings.REPORTS_DIR / f"{report_id}.json"
            if not file_path.exists():
                return None
            
            async with aiofiles.open(file_path, 'r') as f:
                content = await f.read()
                return CalibrationReport.parse_raw(content)
        except Exception as e:
            print(f"Error loading report: {e}")
            return None
    
    @staticmethod
    async def list_reports(limit: int = 100) -> List[dict]:
        """List all calibration reports (metadata only)"""
        reports = []
        try:
            files = sorted(
                settings.REPORTS_DIR.glob("*.json"),
                key=lambda x: x.stat().st_mtime,
                reverse=True
            )
            
            for file_path in files[:limit]:
                async with aiofiles.open(file_path, 'r') as f:
                    content = await f.read()
                    report = CalibrationReport.parse_raw(content)
                    reports.append({
                        "report_id": report.report_id,
                        "created_at": report.created_at,
                        "operator": report.operator,
                        "test_type": report.test_type,
                        "overall_status": report.overall_status,
                        "total_points": report.total_points,
                        "points_passed": report.points_passed
                    })
        except Exception as e:
            print(f"Error listing reports: {e}")
        
        return reports
    
    @staticmethod
    async def delete_report(report_id: str) -> bool:
        """Delete calibration report"""
        try:
            file_path = settings.REPORTS_DIR / f"{report_id}.json"
            if file_path.exists():
                file_path.unlink()
                return True
            return False
        except Exception as e:
            print(f"Error deleting report: {e}")
            return False
    
    @staticmethod
    async def save_command_log(log_entry: CommandLogEntry) -> bool:
        """Append command to today's log file"""
        try:
            date_str = datetime.now().strftime("%Y-%m-%d")
            log_file = settings.LOGS_DIR / f"commands_{date_str}.json"
            
            # Read existing log
            if log_file.exists():
                async with aiofiles.open(log_file, 'r') as f:
                    content = await f.read()
                    logs = json.loads(content)
            else:
                logs = []
            
            # Append new entry
            logs.append(log_entry.dict())
            
            # Save
            async with aiofiles.open(log_file, 'w') as f:
                await f.write(json.dumps(logs, indent=2))
            
            return True
        except Exception as e:
            print(f"Error saving command log: {e}")
            return False
