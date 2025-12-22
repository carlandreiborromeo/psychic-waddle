class SCPICommands:
    IDN = "*IDN?"
    RST = "*RST"
    
    class Fluke5522A:
        @staticmethod
        def set_dc_voltage(voltage: float) -> str:
            return f"OUT {voltage}V"
        
        @staticmethod
        def set_ac_voltage(voltage: float, frequency: float) -> str:
            return f"OUT {voltage}V, {frequency}HZ"
    
    class DMM:
        CONF_VDC = "CONF:VOLT:DC"
        CONF_VAC = "CONF:VOLT:AC"
        READ = "READ?"
