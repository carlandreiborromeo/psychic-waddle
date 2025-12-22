import pyvisa
from typing import Optional, List
from datetime import datetime
from app.config import settings
from app.models.instrument import InstrumentInfo
from app.models.calibration import CommandLogEntry
from app.services.file_storage import FileStorage

class GPIBManager:
    def __init__(self):
        self.rm: Optional[pyvisa.ResourceManager] = None
        self.calibrator: Optional[pyvisa.Resource] = None
        self.dut: Optional[pyvisa.Resource] = None
        self.command_log: List[dict] = []
    
    def initialize(self):
        if self.rm is None:
            self.rm = pyvisa.ResourceManager(settings.GPIB_BACKEND)
    
    def list_resources(self) -> List[str]:
        self.initialize()
        return list(self.rm.list_resources())
    
    async def connect_instrument(self, address: str, instrument_type: str) -> InstrumentInfo:
        self.initialize()
        
        try:
            start_time = datetime.now()
            instrument = self.rm.open_resource(address)
            instrument.timeout = settings.COMMAND_TIMEOUT
            
            idn_response = instrument.query("*IDN?").strip()
            duration = int((datetime.now() - start_time).total_seconds() * 1000)
            
            log_entry = CommandLogEntry(
                timestamp=start_time.isoformat(),
                instrument=instrument_type,
                command="*IDN?",
                response=idn_response,
                duration_ms=duration,
                status='success'
            )
            self._add_log(log_entry)
            await FileStorage.save_command_log(log_entry)
            
            parts = idn_response.split(',')
            model = parts[1].strip() if len(parts) > 1 else "Unknown"
            serial = parts[2].strip() if len(parts) > 2 else "Unknown"
            firmware = parts[3].strip() if len(parts) > 3 else "Unknown"
            
            if instrument_type == 'calibrator':
                self.calibrator = instrument
            else:
                self.dut = instrument
            
            return InstrumentInfo(
                address=address,
                connected=True,
                model=model,
                serial_number=serial,
                firmware_version=firmware,
                last_response=idn_response
            )
        except Exception as e:
            raise ValueError(f"Failed to connect to {address}: {str(e)}")
    
    async def send_command(self, instrument: str, command: str, 
                          expect_response: bool = False) -> Optional[str]:
        device = self.calibrator if instrument == 'calibrator' else self.dut
        
        if device is None:
            raise ValueError(f"{instrument} not connected")
        
        try:
            start_time = datetime.now()
            
            if expect_response:
                response = device.query(command).strip()
            else:
                device.write(command)
                response = None
            
            duration = int((datetime.now() - start_time).total_seconds() * 1000)
            
            log_entry = CommandLogEntry(
                timestamp=start_time.isoformat(),
                instrument=instrument,
                command=command,
                response=response,
                duration_ms=duration,
                status='success'
            )
            self._add_log(log_entry)
            await FileStorage.save_command_log(log_entry)
            
            return response
        except Exception as e:
            raise ValueError(f"Command failed: {str(e)}")
    
    async def disconnect_all(self):
        try:
            if self.calibrator:
                await self.send_command('calibrator', 'STBY')
                self.calibrator.close()
                self.calibrator = None
            if self.dut:
                self.dut.close()
                self.dut = None
        except Exception as e:
            print(f"Error during disconnect: {e}")
    
    def get_command_log(self, limit: int = 50) -> List[dict]:
        return self.command_log[-limit:]
    
    def _add_log(self, entry: CommandLogEntry):
        self.command_log.append(entry.dict())
        if len(self.command_log) > 500:
            self.command_log = self.command_log[-500:]
