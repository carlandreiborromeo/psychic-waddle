// ===== src/App.jsx (MAIN COMPONENT) =====

import React, { useState, useEffect } from 'react';
import { Zap, Activity, Settings, Database, FileText } from 'lucide-react';
import ConnectionPanel from './components/ConnectionPanel';
import SemiAutoMode from './components/SemiAutoMode';
import ManualMode from './components/ManualMode';

// API Client
const api = {
  baseURL: 'http://localhost:8000',
  async get(url) {
    const response = await fetch(this.baseURL + url);
    if (!response.ok) throw new Error('Request failed');
    return response.json();
  },
  async post(url, data) {
    const response = await fetch(this.baseURL + url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('Request failed');
    return response.json();
  },
  async delete(url) {
    const response = await fetch(this.baseURL + url, { method: 'DELETE' });
    if (!response.ok) throw new Error('Request failed');
    return response.json();
  }
};

const App = () => {
  const [activeTab, setActiveTab] = useState('home');
  const [calibrationMode, setCalibrationMode] = useState('semi-auto'); // 'semi-auto' or 'manual'
  
  const [calibrator, setCalibrator] = useState({ connected: false, model: '', serial_number: '' });
  const [dut, setDut] = useState({ connected: false, model: '', serial_number: '' });
  const [commandLog, setCommandLog] = useState([]);
  const [connecting, setConnecting] = useState(false);
  const [testRunning, setTestRunning] = useState(false);
  const [testResults, setTestResults] = useState([]);
  const [savedReports, setSavedReports] = useState([]);
  const [currentReport, setCurrentReport] = useState(null);
  
  const [availableInstruments, setAvailableInstruments] = useState({
    calibrators: [],
    dmms: [],
    psus: []
  });
  
  const [connectionConfig, setConnectionConfig] = useState({
    calibrator_address: 'GPIB0::1::INSTR',
    calibrator_model: 'Fluke_5522A',
    dut_address: 'GPIB0::22::INSTR',
    dut_model: 'Keysight_34461A',
    dut_type: 'dmm'
  });

  useEffect(() => {
    loadAvailableInstruments();
    loadSavedReports();
  }, []);

  useEffect(() => {
    if (calibrator.connected || dut.connected) {
      const interval = setInterval(() => {
        api.get('/api/commands/recent?limit=50')
          .then(data => setCommandLog(data.commands))
          .catch(console.error);
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [calibrator.connected, dut.connected]);

  const loadAvailableInstruments = async () => {
    try {
      const data = await api.get('/api/instruments/available');
      setAvailableInstruments(data);
    } catch (error) {
      console.error('Failed to load available instruments:', error);
    }
  };

  const loadSavedReports = async () => {
    try {
      const data = await api.get('/api/results/reports?limit=100');
      setSavedReports(data.reports || []);
    } catch (error) {
      console.error('Failed to load reports:', error);
    }
  };

  const handleConnect = async () => {
    setConnecting(true);
    try {
      const result = await api.post('/api/instruments/connect', connectionConfig);
      setCalibrator(result.calibrator);
      setDut(result.dut);
    } catch (error) {
      alert('Connection failed: ' + error.message);
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      await api.post('/api/instruments/disconnect', {});
      setCalibrator({ connected: false, model: '', serial_number: '' });
      setDut({ connected: false, model: '', serial_number: '' });
    } catch (error) {
      console.error('Disconnect error:', error);
    }
  };

  const handleStartSemiAutoTest = async (testConfig) => {
    setTestRunning(true);
    setTestResults([]);
    
    try {
      const report = await api.post('/api/calibration/semi-auto/start?operator=Admin', testConfig);
      setTestResults(report.test_points);
      setCurrentReport(report);
      setActiveTab('results');
      await loadSavedReports();
    } catch (error) {
      alert('Test failed: ' + error.message);
    } finally {
      setTestRunning(false);
    }
  };

  const handleViewReport = async (reportId) => {
    try {
      const report = await api.get(`/api/results/reports/${reportId}`);
      setCurrentReport(report);
      setTestResults(report.test_points);
      setActiveTab('results');
    } catch (error) {
      alert('Failed to load report: ' + error.message);
    }
  };

  const handleDeleteReport = async (reportId) => {
    if (!confirm('Delete this calibration report?')) return;
    try {
      await api.delete(`/api/results/reports/${reportId}`);
      await loadSavedReports();
      if (currentReport?.report_id === reportId) {
        setCurrentReport(null);
        setTestResults([]);
      }
    } catch (error) {
      alert('Failed to delete report: ' + error.message);
    }
  };

  const handleExportData = () => {
    if (!currentReport) return;
    const dataStr = JSON.stringify(currentReport, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${currentReport.report_id}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-blue-600 text-white shadow-lg">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <Zap className="w-8 h-8" />
            <div>
              <h1 className="text-2xl font-bold">GPIB Calibration System</h1>
              <p className="text-blue-100 text-sm">ISO/IEC 17025 • Multi-Instrument • Manual & Auto</p>
            </div>
          </div>
          <div className="text-right text-sm">
            <div className="text-blue-100">Operator: Admin</div>
            <div className="text-blue-200">{new Date().toLocaleDateString()}</div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-6">
        <div className="grid grid-cols-12 gap-6">
          {/* Sidebar */}
          <div className="col-span-3 space-y-4">
            <div className="bg-white rounded-lg shadow-md p-4">
              <nav className="space-y-2">
                {[
                  { id: 'home', label: 'Connection', icon: Activity },
                  { id: 'calibration', label: 'Calibration', icon: Settings },
                  { id: 'results', label: 'Results', icon: Database },
                  { id: 'reports', label: 'Saved Reports', icon: FileText }
                ].map(item => (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                      activeTab === item.id ? 'bg-blue-50 text-blue-600 font-medium' : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <item.icon className="w-5 h-5" />
                    <span>{item.label}</span>
                  </button>
                ))}
              </nav>
            </div>

            {/* Instrument Status Sidebar */}
            <div className="bg-white rounded-lg shadow-md p-4">
              <h3 className="font-semibold text-gray-800 mb-3 text-sm uppercase">Status</h3>
              <div className="space-y-3">
                <div className={`p-3 rounded-lg ${calibrator.connected ? 'bg-green-50' : 'bg-gray-50'}`}>
                  <div className="text-sm font-medium text-gray-700">Calibrator</div>
                  <div className="text-xs text-gray-600 mt-1">
                    {calibrator.connected ? `${calibrator.model} ✓` : 'Disconnected'}
                  </div>
                </div>
                <div className={`p-3 rounded-lg ${dut.connected ? 'bg-green-50' : 'bg-gray-50'}`}>
                  <div className="text-sm font-medium text-gray-700">DUT</div>
                  <div className="text-xs text-gray-600 mt-1">
                    {dut.connected ? `${dut.model} ✓` : 'Disconnected'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="col-span-9">
            {activeTab === 'home' && (
              <ConnectionPanel
                connectionConfig={connectionConfig}
                setConnectionConfig={setConnectionConfig}
                availableInstruments={availableInstruments}
                calibrator={calibrator}
                dut={dut}
                connecting={connecting}
                onConnect={handleConnect}
                onDisconnect={handleDisconnect}
              />
            )}

            {activeTab === 'calibration' && (
              <div className="space-y-6">
                {/* Mode Selector */}
                <div className="bg-white rounded-lg shadow-md p-4">
                  <div className="flex space-x-4">
                    <button
                      onClick={() => setCalibrationMode('semi-auto')}
                      className={`flex-1 py-3 px-6 rounded-lg font-medium transition-colors ${
                        calibrationMode === 'semi-auto'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      Semi-Automatic Mode
                    </button>
                    <button
                      onClick={() => setCalibrationMode('manual')}
                      className={`flex-1 py-3 px-6 rounded-lg font-medium transition-colors ${
                        calibrationMode === 'manual'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      Manual Command Mode
                    </button>
                  </div>
                </div>

                {/* Mode Content */}
                {calibrationMode === 'semi-auto' ? (
                  <SemiAutoMode
                    calibrator={calibrator}
                    dut={dut}
                    onStartTest={handleStartSemiAutoTest}
                    testRunning={testRunning}
                  />
                ) : (
                  <ManualMode
                    calibrator={calibrator}
                    dut={dut}
                    api={api}
                  />
                )}
              </div>
            )}

            {activeTab === 'results' && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold text-gray-800">Test Results</h2>
                  {currentReport && (
                    <button onClick={handleExportData} className="px-4 py-2 bg-blue-600 text-white rounded-lg">
                      Export JSON
                    </button>
                  )}
                </div>
                
                {testResults.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <p>No test results. Run a calibration to see results.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 border-b-2">
                        <tr>
                          <th className="px-4 py-3 text-left">Point</th>
                          <th className="px-4 py-3 text-right">Nominal</th>
                          <th className="px-4 py-3 text-right">Mean</th>
                          <th className="px-4 py-3 text-right">Error %</th>
                          <th className="px-4 py-3 text-right">U (k=2)</th>
                          <th className="px-4 py-3 text-center">Result</th>
                        </tr>
                      </thead>
                      <tbody>
                        {testResults.map((result, idx) => (
                          <tr key={idx} className="border-b hover:bg-gray-50">
                            <td className="px-4 py-3">{idx + 1}</td>
                            <td className="px-4 py-3 text-right font-mono">{result.calibrator_output.toFixed(3)}</td>
                            <td className="px-4 py-3 text-right font-mono">{result.mean_reading.toFixed(6)}</td>
                            <td className="px-4 py-3 text-right font-mono">{result.error_percentage.toFixed(4)}%</td>
                            <td className="px-4 py-3 text-right font-mono">{result.expanded_uncertainty.toFixed(6)}</td>
                            <td className="px-4 py-3 text-center">
                              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                result.pass_fail === 'PASS' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                              }`}>
                                {result.pass_fail}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'reports' && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Saved Reports</h2>
                {savedReports.length === 0 ? (
                  <p className="text-center py-10 text-gray-500">No reports found.</p>
                ) : (
                  <div className="space-y-3">
                    {savedReports.map(report => (
                      <div key={report.report_id} className="flex justify-between items-center p-4 border rounded-lg">
                        <div>
                          <div className="font-mono font-bold">{report.report_id}</div>
                          <div className="text-sm text-gray-500">
                            {new Date(report.created_at).toLocaleString()} • {report.operator}
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <button onClick={() => handleViewReport(report.report_id)} className="px-4 py-2 bg-blue-600 text-white rounded">
                            View
                          </button>
                          <button onClick={() => handleDeleteReport(report.report_id)} className="px-4 py-2 bg-red-600 text-white rounded">
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;