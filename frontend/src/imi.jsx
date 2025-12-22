import React, { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle, XCircle, Zap, Activity, Database, Settings, FileText, Play, Download, Trash2 } from 'lucide-react';

// Simple axios-like API client
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

const WebApp = () => {
  const [activeTab, setActiveTab] = useState('home');
  const [calibrator, setCalibrator] = useState({ connected: false, model: '', serial: '', lastResponse: '' });
  const [dut, setDut] = useState({ connected: false, model: '', serial: '', lastResponse: '' });
  const [commandLog, setCommandLog] = useState([]);
  const [connecting, setConnecting] = useState(false);
  const [testRunning, setTestRunning] = useState(false);
  const [testResults, setTestResults] = useState([]);
  const [savedReports, setSavedReports] = useState([]);
  const [currentReport, setCurrentReport] = useState(null);
  
  const [testConfig, setTestConfig] = useState({
    signal_type: 'DC',
    test_points: '1, 5, 10',
    samples_per_point: 10,
    tolerance_percent: 0.01,
    frequency: 60,
    calibrator_accuracy: 0.00005,
    dut_accuracy: 0.0001
  });

  const [calAddress, setCalAddress] = useState('GPIB0::1::INSTR');
  const [dutAddress, setDutAddress] = useState('GPIB0::22::INSTR');

  useEffect(() => {
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
      const result = await api.post('/api/instruments/connect', {
        calibrator_address: calAddress,
        dut_address: dutAddress
      });
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
      setCalibrator({ connected: false, model: '', serial: '', lastResponse: '' });
      setDut({ connected: false, model: '', serial: '', lastResponse: '' });
    } catch (error) {
      console.error('Disconnect error:', error);
    }
  };

  const handleStartTest = async () => {
    if (!calibrator.connected || !dut.connected) {
      alert('Please connect instruments first');
      return;
    }
    setTestRunning(true);
    setTestResults([]);
    try {
      const points = testConfig.test_points.split(',').map(p => parseFloat(p.trim()));
      const config = {
        ...testConfig,
        test_points: points,
        samples_per_point: parseInt(testConfig.samples_per_point),
        tolerance_percent: parseFloat(testConfig.tolerance_percent),
        frequency: testConfig.signal_type === 'AC' ? parseFloat(testConfig.frequency) : null,
      };
      const report = await api.post('/api/calibration/semi-auto/start?operator=Admin', config);
      setTestResults(report.test_points);
      setCurrentReport(report);
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
      <header className="bg-blue-600 text-white shadow-lg">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <Zap className="w-8 h-8" />
            <div>
              <h1 className="text-2xl font-bold">GPIB Calibration System</h1>
              <p className="text-blue-100 text-sm">ISO/IEC 17025 Compliant</p>
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
                  { id: 'home', label: 'Dashboard', icon: Activity },
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

            <div className="bg-white rounded-lg shadow-md p-4">
              <h3 className="font-semibold text-gray-800 mb-3 text-sm uppercase tracking-wider">Instrument Status</h3>
              <div className="space-y-3">
                {[
                  { label: 'Calibrator', data: calibrator },
                  { label: 'DUT', data: dut }
                ].map((inst, idx) => (
                  <div key={idx} className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between mb-1 text-sm">
                      <span className="font-medium text-gray-700">{inst.label}</span>
                      {inst.data.connected ? <CheckCircle className="w-4 h-4 text-green-500" /> : <XCircle className="w-4 h-4 text-red-500" />}
                    </div>
                    {inst.data.connected && <div className="text-xs text-gray-500">{inst.data.model}</div>}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="col-span-9">
            {activeTab === 'home' && (
              <div className="space-y-6">
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h2 className="text-xl font-semibold mb-4">Connection</h2>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <input value={calAddress} onChange={e => setCalAddress(e.target.value)} className="p-2 border rounded" placeholder="Calibrator Address" />
                    <input value={dutAddress} onChange={e => setDutAddress(e.target.value)} className="p-2 border rounded" placeholder="DUT Address" />
                  </div>
                  <div className="flex space-x-2">
                    <button onClick={handleConnect} disabled={connecting} className="px-4 py-2 bg-blue-600 text-white rounded">Connect</button>
                    <button onClick={handleDisconnect} className="px-4 py-2 bg-red-100 text-red-600 rounded">Disconnect</button>
                  </div>
                </div>

                {/* Command Monitor */}
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h2 className="text-xl font-semibold mb-4 text-gray-800">Command Monitor</h2>
                  <div className="bg-gray-900 rounded-lg p-4 h-64 overflow-y-auto font-mono text-xs text-white">
                    {commandLog.length === 0 ? "Listening for GPIB traffic..." : commandLog.map((log, i) => (
                      <div key={i} className="mb-1">
                        <span className="text-gray-500">[{log.timestamp}]</span> {log.command}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'reports' && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold text-gray-800">Saved Calibration Reports</h2>
                  <button onClick={loadSavedReports} className="text-blue-600 hover:underline">Refresh</button>
                </div>
                
                <div className="space-y-3">
                  {savedReports.length === 0 ? (
                    <p className="text-center text-gray-500 py-10">No reports found.</p>
                  ) : (
                    savedReports.map(report => (
                      <div key={report.report_id} className="flex items-center justify-between p-4 border rounded-lg hover:border-blue-400">
                        <div>
                          <div className="font-mono font-bold">{report.report_id}</div>
                          <div className="text-sm text-gray-500">
                            {new Date(report.created_at).toLocaleDateString()} • {report.operator} • {report.points_passed}/{report.total_points} Passed
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button onClick={() => handleViewReport(report.report_id)} className="px-4 py-2 bg-blue-600 text-white rounded text-sm">View</button>
                          <button onClick={() => handleDeleteReport(report.report_id)} className="p-2 text-red-600 hover:bg-red-50 rounded"><Trash2 className="w-5 h-5" /></button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
            
            {/* Add other tab contents (calibration, results) as needed */}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WebApp;