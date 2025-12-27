import asyncio
import statistics
from datetime import datetime
from typing import Optional
from app.services.gpib_manager import GPIBManager
from app.services.file_storage import FileStorage
from app.models.calibration import (
    TestConfig, TestPointResult, CalibrationReport,
    SignalType, PassFail
)
from app.utils.calculations import UncertaintyCalculator

class CalibrationService:
    def __init__(self, gpib_manager: GPIBManager):
        self.gpib = gpib_manager
        self.current_test: Optional[CalibrationReport] = None
        self.test_running = False
    
    async def run_semi_auto_test(self, config: TestConfig, operator: str) -> CalibrationReport:
        if self.test_running:
            raise ValueError("Test already running")
        
        self.test_running = True
        start_time = datetime.now()
        report_id = f"CAL-{start_time.strftime('%Y%m%d-%H%M%S')}"
        
        try:
            cal_info = await self._get_instrument_info('calibrator')
            dut_info = await self._get_instrument_info('dut')
            
            await self._initialize_instruments(config)
            
            test_results = []
            for point_value in config.test_points:
                result = await self._execute_test_point(point_value, config)
                test_results.append(result)
            
            passed = sum(1 for r in test_results if r.pass_fail == PassFail.PASS)
            failed = len(test_results) - passed
            overall = PassFail.PASS if failed == 0 else PassFail.FAIL
            
            duration = (datetime.now() - start_time).total_seconds()
            
            report = CalibrationReport(
                report_id=report_id,
                created_at=start_time.isoformat(),
                calibrator_model=cal_info['model'],
                calibrator_serial=cal_info['serial'],
                dut_model=dut_info['model'],
                dut_serial=dut_info['serial'],
                test_type=f"DMM {config.signal_type} Voltage",
                test_config=config,
                operator=operator,
                test_points=test_results,
                total_points=len(test_results),
                points_passed=passed,
                points_failed=failed,
                overall_status=overall,
                duration_seconds=duration,
                completed=True
            )
            
            await FileStorage.save_report(report)
            self.current_test = report
            return report
            
        finally:
            self.test_running = False
            await self.gpib.send_command('calibrator', 'standby')
    
    async def _initialize_instruments(self, config: TestConfig):
        """Initialize using dynamic commands"""
        await self.gpib.send_command('calibrator', 'reset')
        await self.gpib.send_command('dut', 'reset')
        await asyncio.sleep(1)
        
        # Configure DUT based on signal type
        if config.signal_type == SignalType.DC:
            await self.gpib.send_command('dut', 'conf_dc_voltage')
        else:
            await self.gpib.send_command('dut', 'conf_ac_voltage')
    
    async def _execute_test_point(self, voltage: float, config: TestConfig) -> TestPointResult:
        """Execute test point using dynamic commands"""
        
        # Set calibrator output
        if config.signal_type == SignalType.DC:
            await self.gpib.send_command('calibrator', 'set_dc_voltage', value=voltage)
        else:
            await self.gpib.send_command(
                'calibrator', 
                'set_ac_voltage', 
                value=voltage, 
                frequency=config.frequency
            )
        
        await self.gpib.send_command('calibrator', 'operate')
        await asyncio.sleep(2)
        
        # Take readings
        readings = []
        for _ in range(config.samples_per_point):
            response = await self.gpib.send_command('dut', 'read', expect_response=True)
            readings.append(float(response))
            await asyncio.sleep(0.2)
        
        # Calculate statistics
        mean = statistics.mean(readings)
        std_dev = statistics.stdev(readings) if len(readings) > 1 else 0.0
        error = mean - voltage
        error_pct = (error / voltage) * 100
        
        # Calculate uncertainty
        type_a = UncertaintyCalculator.calculate_type_a(readings)
        type_b = UncertaintyCalculator.calculate_type_b(voltage, config.dut_accuracy)
        combined = UncertaintyCalculator.calculate_combined(type_a, type_b)
        expanded = UncertaintyCalculator.calculate_expanded(combined)
        
        pass_fail = PassFail.PASS if abs(error_pct) <= config.tolerance_percent else PassFail.FAIL
        
        return TestPointResult(
            timestamp=datetime.now().isoformat(),
            calibrator_output=voltage,
            signal_type=config.signal_type,
            frequency=config.frequency,
            readings=readings,
            num_samples=len(readings),
            mean_reading=mean,
            std_deviation=std_dev,
            min_reading=min(readings),
            max_reading=max(readings),
            error=error,
            error_percentage=error_pct,
            uncertainty_type_a=type_a,
            uncertainty_type_b=type_b,
            combined_uncertainty=combined,
            expanded_uncertainty=expanded,
            tolerance=config.tolerance_percent,
            pass_fail=pass_fail
        )
    
    async def _get_instrument_info(self, instrument: str) -> dict:
        response = await self.gpib.send_command(instrument, '*IDN?', expect_response=True)
        parts = response.split(',')
        return {
            'model': parts[1].strip() if len(parts) > 1 else 'Unknown',
            'serial': parts[2].strip() if len(parts) > 2 else 'Unknown'
        }