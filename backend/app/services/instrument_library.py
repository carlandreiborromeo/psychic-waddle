import json
from pathlib import Path
from typing import Dict, Optional

class InstrumentLibrary:
    """Dynamic instrument command library"""
    
    def __init__(self):
        self.config_file = Path(__file__).parent.parent / "config" / "instruments.json"
        self.instruments = self._load_config()
    
    def _load_config(self) -> dict:
        """Load instrument definitions from JSON"""
        try:
            with open(self.config_file, 'r') as f:
                return json.load(f)
        except FileNotFoundError:
            print(f"Warning: {self.config_file} not found, using defaults")
            return self._get_default_config()
    
    def _get_default_config(self) -> dict:
        """Fallback if JSON file missing"""
        return {
            "calibrators": {
                "Fluke_5522A": {
                    "name": "Fluke 5522A",
                    "commands": {
                        "set_dc_voltage": "OUT {value}V",
                        "set_ac_voltage": "OUT {value}V, {frequency}HZ",
                        "operate": "OPER",
                        "standby": "STBY",
                        "reset": "*RST"
                    }
                }
            },
            "dmms": {
                "Keysight_34461A": {
                    "name": "Keysight 34461A",
                    "commands": {
                        "conf_dc_voltage": "CONF:VOLT:DC",
                        "conf_ac_voltage": "CONF:VOLT:AC",
                        "read": "READ?",
                        "reset": "*RST"
                    }
                }
            }
        }
    
    def get_command(self, instrument_type: str, model: str, command: str, **kwargs) -> str:
        """
        Get SCPI command for specific instrument
        
        Args:
            instrument_type: "calibrators", "dmms", or "psus"
            model: "Fluke_5522A", "Keysight_34461A", etc.
            command: "set_dc_voltage", "read", etc.
            **kwargs: Values to fill in template (value, frequency, etc.)
        
        Returns:
            SCPI command string
        """
        try:
            cmd_template = self.instruments[instrument_type][model]["commands"][command]
            return cmd_template.format(**kwargs)
        except KeyError:
            raise ValueError(f"Command '{command}' not found for {model}")
    
    def list_instruments(self, instrument_type: str) -> list:
        """List all available instruments of a type"""
        return list(self.instruments.get(instrument_type, {}).keys())
    
    def get_instrument_info(self, instrument_type: str, model: str) -> dict:
        """Get full info about an instrument"""
        return self.instruments.get(instrument_type, {}).get(model, {})