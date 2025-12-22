import math
import statistics
from typing import List

class UncertaintyCalculator:
    @staticmethod
    def calculate_type_a(readings: List[float]) -> float:
        if len(readings) < 2:
            return 0.0
        std_dev = statistics.stdev(readings)
        return std_dev / math.sqrt(len(readings))
    
    @staticmethod
    def calculate_type_b(value: float, accuracy: float) -> float:
        a = abs(value) * accuracy
        return a / math.sqrt(3)
    
    @staticmethod
    def calculate_combined(type_a: float, type_b: float) -> float:
        return math.sqrt(type_a**2 + type_b**2)
    
    @staticmethod
    def calculate_expanded(combined: float, k: float = 2.0) -> float:
        return combined * k
