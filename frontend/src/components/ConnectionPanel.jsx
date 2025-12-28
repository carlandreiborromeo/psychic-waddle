// ===== src/components/ConnectionPanel.jsx =====

import React from 'react';
import { CheckCircle, XCircle } from 'lucide-react';

const ConnectionPanel = ({ 
  connectionConfig, 
  setConnectionConfig,
  availableInstruments,
  calibrator,
  dut,
  connecting,
  onConnect,
  onDisconnect
}) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Instrument Connection</h2>
      
      {/* Calibrator Section */}
      <div className="mb-6">
        <h3 className="font-medium text-gray-700 mb-3">Calibrator</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1">Model</label>
            <select 
              value={connectionConfig.calibrator_model}
              onChange={e => setConnectionConfig({...connectionConfig, calibrator_model: e.target.value})}
              className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              disabled={calibrator.connected}
            >
              {availableInstruments.calibrators.map(cal => (
                <option key={cal} value={cal}>{cal.replace(/_/g, ' ')}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">GPIB Address</label>
            <input 
              value={connectionConfig.calibrator_address}
              onChange={e => setConnectionConfig({...connectionConfig, calibrator_address: e.target.value})}
              className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="GPIB0::1::INSTR"
              disabled={calibrator.connected}
            />
          </div>
        </div>
        {calibrator.connected && (
          <div className="mt-2 p-3 bg-green-50 rounded-lg flex items-center space-x-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <div className="text-sm">
              <div className="font-medium text-green-900">{calibrator.model}</div>
              <div className="text-green-700">S/N: {calibrator.serial_number}</div>
            </div>
          </div>
        )}
      </div>

      {/* DUT Section */}
      <div className="mb-6">
        <h3 className="font-medium text-gray-700 mb-3">Device Under Test (DUT)</h3>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1">Type</label>
            <select 
              value={connectionConfig.dut_type}
              onChange={e => setConnectionConfig({...connectionConfig, dut_type: e.target.value})}
              className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              disabled={dut.connected}
            >
              <option value="dmm">DMM (Multimeter)</option>
              <option value="psu">PSU (Power Supply)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Model</label>
            <select 
              value={connectionConfig.dut_model}
              onChange={e => setConnectionConfig({...connectionConfig, dut_model: e.target.value})}
              className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              disabled={dut.connected}
            >
              {(connectionConfig.dut_type === 'dmm' ? availableInstruments.dmms : availableInstruments.psus).map(model => (
                <option key={model} value={model}>{model.replace(/_/g, ' ')}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">GPIB Address</label>
            <input 
              value={connectionConfig.dut_address}
              onChange={e => setConnectionConfig({...connectionConfig, dut_address: e.target.value})}
              className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="GPIB0::22::INSTR"
              disabled={dut.connected}
            />
          </div>
        </div>
        {dut.connected && (
          <div className="mt-2 p-3 bg-green-50 rounded-lg flex items-center space-x-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <div className="text-sm">
              <div className="font-medium text-green-900">{dut.model}</div>
              <div className="text-green-700">S/N: {dut.serial_number}</div>
            </div>
          </div>
        )}
      </div>
      
      {/* Connect Buttons */}
      <div className="flex space-x-3">
        <button 
          onClick={onConnect} 
          disabled={connecting || (calibrator.connected && dut.connected)} 
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
        >
          {connecting ? 'Connecting...' : 'Connect'}
        </button>
        <button 
          onClick={onDisconnect} 
          disabled={!calibrator.connected && !dut.connected}
          className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
        >
          Disconnect
        </button>
      </div>
    </div>
  );
};

export default ConnectionPanel;