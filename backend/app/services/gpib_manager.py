import pyvisa
from typing import Optional, List
from datetime import datetime
from app.config import settings
from app.models.instrument import InstrumentInfo
from app.models.calibration import CommandLogEntry
from app.services.file_storage import FileStorage
from app.services.instrument_library import InstrumentLibrary

class GPIBManager:
    def __init__(self):
        self.rm: Optional[pyvisa.ResourceManager] = None
        self.calibrator: Optional[pyvisa.Resource] = None
        self.dut: Optional[pyvisa.Resource] = None
        self.command_log: List[dict] = []
        
        # NEW: Dynamic instrument library
        self.instrument_library = InstrumentLibrary()
        self.calibrator_model = None
        self.dut_model = None
        self.dut_type = None
    
    def initialize(self):
        if self.rm is None:
            self.rm = pyvisa.ResourceManager(settings.GPIB_BACKEND)
    
    def list_resources(self) -> List[str]:
        self.initialize()
        return list(self.rm.list_resources())
    
    async def connect_instrument(self, address: str, instrument_type: str, 
                                 model_key: str, role: str) -> InstrumentInfo:
        """
        Connect to instrument with specified model
        
        Args:
            address: GPIB address
            instrument_type: "calibrators", "dmms", or "psus"
            model_key: "Fluke_5522A", "Keysight_34461A", etc.
            role: "calibrator" or "dut"
        """
        self.initialize()
        
        try:
            start_time = datetime.now()
            instrument = self.rm.open_resource(address)
            instrument.timeout = settings.COMMAND_TIMEOUT
            
            idn_response = instrument.query("*IDN?").strip()
            duration = int((datetime.now() - start_time).total_seconds() * 1000)
            
            log_entry = CommandLogEntry(
                timestamp=start_time.isoformat(),
                instrument=role,
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
            
            # Store model info for later use
            if role == 'calibrator':
                self.calibrator = instrument
                self.calibrator_model = model_key
            else:
                self.dut = instrument
                self.dut_model = model_key
                self.dut_type = instrument_type
            
            return InstrumentInfo(
                address=address,
                connected=True,
                model=model,
                serial_number=serial,
                firmware_version=firmware,
                instrument_type=instrument_type,
                model_key=model_key,
                last_response=idn_response
            )
        except Exception as e:
            raise ValueError(f"Failed to connect to {address}: {str(e)}")
    
    async def send_command(self, role: str, command_name: str, 
                          expect_response: bool = False, **kwargs) -> Optional[str]:
        """
        Send command using dynamic library
        
        Args:
            role: "calibrator" or "dut"
            command_name: "set_dc_voltage", "read", etc.
            expect_response: Wait for response?
            **kwargs: Command parameters (value, frequency, etc.)
        """
        device = self.calibrator if role == 'calibrator' else self.dut
        
        if device is None:
            raise ValueError(f"{role} not connected")
        
        # Get the right model and instrument type
        if role == 'calibrator':
            instrument_type = "calibrators"
            model = self.calibrator_model
        else:
            instrument_type = self.dut_type
            model = self.dut_model
        
        # Generate SCPI command from library
        scpi_command = self.instrument_library.get_command(
            instrument_type, model, command_name, **kwargs
        )
        
        # Send command
        try:
            start_time = datetime.now()
            
            if expect_response:
                response = device.query(scpi_command).strip()
            else:
                device.write(scpi_command)
                response = None
            
            duration = int((datetime.now() - start_time).total_seconds() * 1000)
            
            log_entry = CommandLogEntry(
                timestamp=start_time.isoformat(),
                instrument=role,
                command=scpi_command,
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
                await self.send_command('calibrator', 'standby')
                self.calibrator.close()
                self.calibrator = None
                self.calibrator_model = None
            if self.dut:
                self.dut.close()
                self.dut = None
                self.dut_model = None
                self.dut_type = None
        except Exception as e:
            print(f"Error during disconnect: {e}")
    
    def get_command_log(self, limit: int = 50) -> List[dict]:
        return self.command_log[-limit:]
    
    def _add_log(self, entry: CommandLogEntry):
        self.command_log.append(entry.dict())
        if len(self.command_log) > 500:
            self.command_log = self.command_log[-500:]