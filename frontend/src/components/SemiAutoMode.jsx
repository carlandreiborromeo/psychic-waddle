

import React, { useState } from 'react';
import { Play, X, Plus } from 'lucide-react';

const SemiAutoMode = ({ calibrator, dut, onStartTest, testRunning }) => {
  const [numPoints, setNumPoints] = useState(3);
  const [testPoints, setTestPoints] = useState([1, 5, 10]);
  const [config, setConfig] = useState({
    signal_type: 'DC_VOLTAGE',
    samples_per_point: 10,
    tolerance_percent: 0.01,
    frequency: 60
  });

  const handleNumPointsChange = (num) => {
    setNumPoints(num);
    if (num > testPoints.length) {
      setTestPoints([...testPoints, ...Array(num - testPoints.length).fill(0)]);
    } else {
      setTestPoints(testPoints.slice(0, num));
    }
  };

  const handlePointChange = (index, value) => {
    const newPoints = [...testPoints];
    newPoints[index] = parseFloat(value) || 0;
    setTestPoints(newPoints);
  };

  const handleStartTest = () => {
    const validPoints = testPoints.filter(p => p > 0);
    
    if (validPoints.length === 0) {
      alert('Please enter at least one valid test point');
      return;
    }

    const testConfig = {
      ...config,
      test_points: validPoints,
      samples_per_point: parseInt(config.samples_per_point),
      tolerance_percent: parseFloat(config.tolerance_percent),
      frequency: config.signal_type.includes('AC') ? parseFloat(config.frequency) : null
    };

    onStartTest(testConfig);
  };

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-lg shadow-md p-5">
        <h2 className="text-lg font-semibold text-gray-800 mb-1">Semi-Automatic Mode</h2>
        <p className="text-xs text-gray-500 mb-4">
          Configure test points and let the system run them automatically, one at a time.
        </p>

        {/* Signal Type & Number of Points - Side by Side */}
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Signal Type</label>
            <select
              value={config.signal_type}
              onChange={e => setConfig({...config, signal_type: e.target.value})}
              className=" p-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={testRunning}
            >
              <option value="DC_VOLTAGE">DC Voltage</option>
              <option value="AC_VOLTAGE">AC Voltage</option>
              <option value="DC_CURRENT">DC Current</option>
              <option value="AC_CURRENT">AC Current</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Number of Test Points
            </label>
            <input
              type="number"
              value={numPoints}
              onChange={e => handleNumPointsChange(parseInt(e.target.value) || 1)}
              className=" p-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              min="1"
              max="20"
              disabled={testRunning}
            />
          </div>
        </div>

        {/* Frequency (only for AC) */}
        {config.signal_type.includes('AC') && (
          <div className="mb-3">
            <label className="block text-xs font-medium text-gray-700 mb-1">Frequency (Hz)</label>
            <input
              type="number"
              value={config.frequency}
              onChange={e => setConfig({...config, frequency: e.target.value})}
              className="w-full p-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={testRunning}
            />
          </div>
        )}

        {/* Test Points Grid */}
        <div className="mb-3">
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Test Points ({config.signal_type.includes('CURRENT') ? 'Amps' : 'Volts'})
          </label>
          <div 
            className="grid grid-cols-5 gap-2 max-h-48 overflow-y-auto pr-1"
            style={{ 
              scrollbarWidth: 'thin',
              scrollbarColor: '#cbd5e0 #f7fafc'
            }}
          >
            {testPoints.map((point, index) => (
              <div key={index} className="flex items-center space-x-1">
                <span className="text-xs text-gray-500 w-5">{index + 1}.</span>
                <input
                  type="number"
                  value={point}
                  onChange={e => handlePointChange(index, e.target.value)}
                  className="flex-1 p-1.5 text-sm border rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                  step="0.001"
                  disabled={testRunning}
                  placeholder="0.0"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Test Configuration */}
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Samples per Point
            </label>
            <input
              type="number"
              value={config.samples_per_point}
              onChange={e => setConfig({...config, samples_per_point: e.target.value})}
              className="w-full p-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              min="1"
              max="100"
              disabled={testRunning}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Tolerance (%)
            </label>
            <input
              type="number"
              value={config.tolerance_percent}
              onChange={e => setConfig({...config, tolerance_percent: e.target.value})}
              className="w-full p-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              step="0.001"
              disabled={testRunning}
            />
          </div>
        </div>

        {/* Start Button */}
        <button
          onClick={handleStartTest}
          disabled={testRunning || !calibrator.connected || !dut.connected}
          className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors text-sm font-medium"
        >
          <Play className="w-4 h-4" />
          <span>{testRunning ? 'Test Running...' : 'Start Automatic Test'}</span>
        </button>

        {(!calibrator.connected || !dut.connected) && (
          <p className="mt-2 text-xs text-red-600 flex items-center gap-1">
            <span>⚠</span> Please connect instruments first
          </p>
        )}
      </div>

      {testRunning && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <div>
              <div className="text-sm font-semibold text-blue-900">Test in Progress</div>
              <div className="text-xs text-blue-700">
                Testing {testPoints.filter(p => p > 0).length} points automatically...
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SemiAutoMode;