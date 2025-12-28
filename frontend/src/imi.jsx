// import React, { useState, useEffect } from 'react';
// import { AlertCircle, CheckCircle, XCircle, Zap, Activity, Database, Settings, FileText, Play, Download, Trash2 } from 'lucide-react';

// // Simple axios-like API client
// const api = {
//   baseURL: 'http://localhost:8000',
//   async get(url) {
//     const response = await fetch(this.baseURL + url);
//     if (!response.ok) throw new Error('Request failed');
//     return response.json();
//   },
//   async post(url, data) {
//     const response = await fetch(this.baseURL + url, {
//       method: 'POST',
//       headers: { 'Content-Type': 'application/json' },
//       body: JSON.stringify(data)
//     });
//     if (!response.ok) throw new Error('Request failed');
//     return response.json();
//   },
//   async delete(url) {
//     const response = await fetch(this.baseURL + url, { method: 'DELETE' });
//     if (!response.ok) throw new Error('Request failed');
//     return response.json();
//   }
// };

// const WebApp = () => {
//   const [activeTab, setActiveTab] = useState('home');
//   const [calibrator, setCalibrator] = useState({ connected: false, model: '', serial: '', lastResponse: '' });
//   const [dut, setDut] = useState({ connected: false, model: '', serial: '', lastResponse: '' });
//   const [commandLog, setCommandLog] = useState([]);
//   const [connecting, setConnecting] = useState(false);
//   const [testRunning, setTestRunning] = useState(false);
//   const [testResults, setTestResults] = useState([]);
//   const [savedReports, setSavedReports] = useState([]);
//   const [currentReport, setCurrentReport] = useState(null);
  
//   // NEW: Available instruments from backend
//   const [availableInstruments, setAvailableInstruments] = useState({
//     calibrators: [],
//     dmms: [],
//     psus: []
//   });
  
//   const [testConfig, setTestConfig] = useState({
//     signal_type: 'DC',
//     test_points: '1, 5, 10',
//     samples_per_point: 10,
//     tolerance_percent: 0.01,
//     frequency: 60,
//     calibrator_accuracy: 0.00005,
//     dut_accuracy: 0.0001
//   });

//   // NEW: Connection config with instrument models
//   const [connectionConfig, setConnectionConfig] = useState({
//     calibrator_address: 'GPIB0::1::INSTR',
//     calibrator_model: 'Fluke_5522A',
//     dut_address: 'GPIB0::22::INSTR',
//     dut_model: 'Keysight_34461A',
//     dut_type: 'dmm'
//   });

//   // Load available instruments on mount
//   useEffect(() => {
//     loadAvailableInstruments();
//     loadSavedReports();
//   }, []);

//   useEffect(() => {
//     if (calibrator.connected || dut.connected) {
//       const interval = setInterval(() => {
//         api.get('/api/commands/recent?limit=50')
//           .then(data => setCommandLog(data.commands))
//           .catch(console.error);
//       }, 2000);
//       return () => clearInterval(interval);
//     }
//   }, [calibrator.connected, dut.connected]);

//   const loadAvailableInstruments = async () => {
//     try {
//       const data = await api.get('/api/instruments/available');
//       setAvailableInstruments(data);
//     } catch (error) {
//       console.error('Failed to load available instruments:', error);
//     }
//   };

//   const loadSavedReports = async () => {
//     try {
//       const data = await api.get('/api/results/reports?limit=100');
//       setSavedReports(data.reports || []);
//     } catch (error) {
//       console.error('Failed to load reports:', error);
//     }
//   };

//   const handleConnect = async () => {
//     setConnecting(true);
//     try {
//       const result = await api.post('/api/instruments/connect', connectionConfig);
//       setCalibrator(result.calibrator);
//       setDut(result.dut);
//     } catch (error) {
//       alert('Connection failed: ' + error.message);
//     } finally {
//       setConnecting(false);
//     }
//   };

//   const handleDisconnect = async () => {
//     try {
//       await api.post('/api/instruments/disconnect', {});
//       setCalibrator({ connected: false, model: '', serial: '', lastResponse: '' });
//       setDut({ connected: false, model: '', serial: '', lastResponse: '' });
//     } catch (error) {
//       console.error('Disconnect error:', error);
//     }
//   };

//   const handleStartTest = async () => {
//     if (!calibrator.connected || !dut.connected) {
//       alert('Please connect instruments first');
//       return;
//     }
//     setTestRunning(true);
//     setTestResults([]);
//     try {
//       const points = testConfig.test_points.split(',').map(p => parseFloat(p.trim()));
//       const config = {
//         ...testConfig,
//         test_points: points,
//         samples_per_point: parseInt(testConfig.samples_per_point),
//         tolerance_percent: parseFloat(testConfig.tolerance_percent),
//         frequency: testConfig.signal_type === 'AC' ? parseFloat(testConfig.frequency) : null,
//       };
//       const report = await api.post('/api/calibration/semi-auto/start?operator=Admin', config);
//       setTestResults(report.test_points);
//       setCurrentReport(report);
//       await loadSavedReports();
//     } catch (error) {
//       alert('Test failed: ' + error.message);
//     } finally {
//       setTestRunning(false);
//     }
//   };

//   const handleViewReport = async (reportId) => {
//     try {
//       const report = await api.get(`/api/results/reports/${reportId}`);
//       setCurrentReport(report);
//       setTestResults(report.test_points);
//       setActiveTab('results');
//     } catch (error) {
//       alert('Failed to load report: ' + error.message);
//     }
//   };

//   const handleDeleteReport = async (reportId) => {
//     if (!confirm('Delete this calibration report?')) return;
//     try {
//       await api.delete(`/api/results/reports/${reportId}`);
//       await loadSavedReports();
//       if (currentReport?.report_id === reportId) {
//         setCurrentReport(null);
//         setTestResults([]);
//       }
//     } catch (error) {
//       alert('Failed to delete report: ' + error.message);
//     }
//   };

//   const handleExportData = () => {
//     if (!currentReport) return;
//     const dataStr = JSON.stringify(currentReport, null, 2);
//     const dataBlob = new Blob([dataStr], { type: 'application/json' });
//     const url = URL.createObjectURL(dataBlob);
//     const link = document.createElement('a');
//     link.href = url;
//     link.download = `${currentReport.report_id}.json`;
//     link.click();
//     URL.revokeObjectURL(url);
//   };

//   return (
//     <div className="min-h-screen bg-gray-50">
//       <header className="bg-blue-600 text-white shadow-lg">
//         <div className="container mx-auto px-6 py-4 flex justify-between items-center">
//           <div className="flex items-center space-x-3">
//             <Zap className="w-8 h-8" />
//             <div>
//               <h1 className="text-2xl font-bold">GPIB Calibration System</h1>
//               <p className="text-blue-100 text-sm">ISO/IEC 17025 Compliant • Multi-Instrument Support</p>
//             </div>
//           </div>
//           <div className="text-right text-sm">
//             <div className="text-blue-100">Operator: Admin</div>
//             <div className="text-blue-200">{new Date().toLocaleDateString()}</div>
//           </div>
//         </div>
//       </header>

//       <div className="container mx-auto px-6 py-6">
//         <div className="grid grid-cols-12 gap-6">
//           {/* Sidebar */}
//           <div className="col-span-3 space-y-4">
//             <div className="bg-white rounded-lg shadow-md p-4">
//               <nav className="space-y-2">
//                 {[
//                   { id: 'home', label: 'Dashboard', icon: Activity },
//                   { id: 'calibration', label: 'Calibration', icon: Settings },
//                   { id: 'results', label: 'Results', icon: Database },
//                   { id: 'reports', label: 'Saved Reports', icon: FileText }
//                 ].map(item => (
//                   <button
//                     key={item.id}
//                     onClick={() => setActiveTab(item.id)}
//                     className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
//                       activeTab === item.id ? 'bg-blue-50 text-blue-600 font-medium' : 'text-gray-600 hover:bg-gray-50'
//                     }`}
//                   >
//                     <item.icon className="w-5 h-5" />
//                     <span>{item.label}</span>
//                   </button>
//                 ))}
//               </nav>
//             </div>

//             <div className="bg-white rounded-lg shadow-md p-4">
//               <h3 className="font-semibold text-gray-800 mb-3 text-sm uppercase tracking-wider">Instrument Status</h3>
//               <div className="space-y-3">
//                 {[
//                   { label: 'Calibrator', data: calibrator },
//                   { label: 'DUT', data: dut }
//                 ].map((inst, idx) => (
//                   <div key={idx} className="p-3 bg-gray-50 rounded-lg">
//                     <div className="flex items-center justify-between mb-1 text-sm">
//                       <span className="font-medium text-gray-700">{inst.label}</span>
//                       {inst.data.connected ? <CheckCircle className="w-4 h-4 text-green-500" /> : <XCircle className="w-4 h-4 text-red-500" />}
//                     </div>
//                     {inst.data.connected && (
//                       <div className="text-xs text-gray-600">
//                         <div>{inst.data.model}</div>
//                         <div className="text-gray-500">{inst.data.serial_number}</div>
//                       </div>
//                     )}
//                   </div>
//                 ))}
//               </div>
//             </div>
//           </div>

//           {/* Main Content Area */}
//           <div className="col-span-9">
//             {activeTab === 'home' && (
//               <div className="space-y-6">
//                 <div className="bg-white rounded-lg shadow-md p-6">
//                   <h2 className="text-xl font-semibold mb-4">Instrument Connection</h2>
                  
//                   {/* Calibrator Section */}
//                   <div className="mb-6">
//                     <h3 className="font-medium text-gray-700 mb-3">Calibrator</h3>
//                     <div className="grid grid-cols-2 gap-4">
//                       <div>
//                         <label className="block text-sm text-gray-600 mb-1">Model</label>
//                         <select 
//                           value={connectionConfig.calibrator_model}
//                           onChange={e => setConnectionConfig({...connectionConfig, calibrator_model: e.target.value})}
//                           className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
//                           disabled={calibrator.connected}
//                         >
//                           {availableInstruments.calibrators.map(cal => (
//                             <option key={cal} value={cal}>{cal.replace(/_/g, ' ')}</option>
//                           ))}
//                         </select>
//                       </div>
//                       <div>
//                         <label className="block text-sm text-gray-600 mb-1">GPIB Address</label>
//                         <input 
//                           value={connectionConfig.calibrator_address}
//                           onChange={e => setConnectionConfig({...connectionConfig, calibrator_address: e.target.value})}
//                           className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
//                           placeholder="GPIB0::1::INSTR"
//                           disabled={calibrator.connected}
//                         />
//                       </div>
//                     </div>
//                   </div>

//                   {/* DUT Section */}
//                   <div className="mb-6">
//                     <h3 className="font-medium text-gray-700 mb-3">Device Under Test (DUT)</h3>
//                     <div className="grid grid-cols-3 gap-4">
//                       <div>
//                         <label className="block text-sm text-gray-600 mb-1">Type</label>
//                         <select 
//                           value={connectionConfig.dut_type}
//                           onChange={e => setConnectionConfig({...connectionConfig, dut_type: e.target.value})}
//                           className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
//                           disabled={dut.connected}
//                         >
//                           <option value="dmm">DMM (Multimeter)</option>
//                           <option value="psu">PSU (Power Supply)</option>
//                         </select>
//                       </div>
//                       <div>
//                         <label className="block text-sm text-gray-600 mb-1">Model</label>
//                         <select 
//                           value={connectionConfig.dut_model}
//                           onChange={e => setConnectionConfig({...connectionConfig, dut_model: e.target.value})}
//                           className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
//                           disabled={dut.connected}
//                         >
//                           {(connectionConfig.dut_type === 'dmm' ? availableInstruments.dmms : availableInstruments.psus).map(model => (
//                             <option key={model} value={model}>{model.replace(/_/g, ' ')}</option>
//                           ))}
//                         </select>
//                       </div>
//                       <div>
//                         <label className="block text-sm text-gray-600 mb-1">GPIB Address</label>
//                         <input 
//                           value={connectionConfig.dut_address}
//                           onChange={e => setConnectionConfig({...connectionConfig, dut_address: e.target.value})}
//                           className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
//                           placeholder="GPIB0::22::INSTR"
//                           disabled={dut.connected}
//                         />
//                       </div>
//                     </div>
//                   </div>
                  
//                   <div className="flex space-x-2">
//                     <button 
//                       onClick={handleConnect} 
//                       disabled={connecting || (calibrator.connected && dut.connected)} 
//                       className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
//                     >
//                       {connecting ? 'Connecting...' : 'Connect'}
//                     </button>
//                     <button 
//                       onClick={handleDisconnect} 
//                       disabled={!calibrator.connected && !dut.connected}
//                       className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
//                     >
//                       Disconnect
//                     </button>
//                   </div>
//                 </div>

//                 {/* Command Monitor */}
//                 <div className="bg-white rounded-lg shadow-md p-6">
//                   <h2 className="text-xl font-semibold mb-4 text-gray-800">Command Monitor</h2>
//                   <div className="bg-gray-900 rounded-lg p-4 h-64 overflow-y-auto font-mono text-xs">
//                     {commandLog.length === 0 ? (
//                       <div className="text-gray-500 text-center py-8">Waiting for GPIB commands...</div>
//                     ) : (
//                       commandLog.slice().reverse().map((log, i) => (
//                         <div key={i} className="mb-2">
//                           <span className="text-gray-500">[{new Date(log.timestamp).toLocaleTimeString()}]</span>{' '}
//                           <span className={log.instrument === 'calibrator' ? 'text-yellow-400' : 'text-cyan-400'}>
//                             {log.instrument.toUpperCase()}
//                           </span>{' '}
//                           <span className="text-white">→ {log.command}</span>
//                           {log.response && <span className="text-green-400"> → {log.response}</span>}
//                           <span className={log.status === 'success' ? 'text-green-400' : 'text-red-400'}>
//                             {' '}✓ ({log.duration_ms}ms)
//                           </span>
//                         </div>
//                       ))
//                     )}
//                   </div>
//                 </div>
//               </div>
//             )}

//             {activeTab === 'calibration' && (
//               <div className="bg-white rounded-lg shadow-md p-6">
//                 <h2 className="text-xl font-semibold mb-4">Calibration Test Configuration</h2>
//                 <div className="grid grid-cols-2 gap-4 mb-4">
//                   <div>
//                     <label className="block text-sm font-medium text-gray-700 mb-2">Signal Type</label>
//                     <select
//                       value={testConfig.signal_type}
//                       onChange={e => setTestConfig({...testConfig, signal_type: e.target.value})}
//                       className="w-full p-2 border rounded-lg"
//                       disabled={testRunning}
//                     >
//                       <option value="DC">DC Voltage</option>
//                       <option value="AC">AC Voltage</option>
//                     </select>
//                   </div>
//                   <div>
//                     <label className="block text-sm font-medium text-gray-700 mb-2">Test Points (comma-separated)</label>
//                     <input
//                       value={testConfig.test_points}
//                       onChange={e => setTestConfig({...testConfig, test_points: e.target.value})}
//                       className="w-full p-2 border rounded-lg"
//                       placeholder="1, 5, 10"
//                       disabled={testRunning}
//                     />
//                   </div>
//                   <div>
//                     <label className="block text-sm font-medium text-gray-700 mb-2">Samples per Point</label>
//                     <input
//                       type="number"
//                       value={testConfig.samples_per_point}
//                       onChange={e => setTestConfig({...testConfig, samples_per_point: e.target.value})}
//                       className="w-full p-2 border rounded-lg"
//                       disabled={testRunning}
//                     />
//                   </div>
//                   <div>
//                     <label className="block text-sm font-medium text-gray-700 mb-2">Tolerance (%)</label>
//                     <input
//                       type="number"
//                       step="0.001"
//                       value={testConfig.tolerance_percent}
//                       onChange={e => setTestConfig({...testConfig, tolerance_percent: e.target.value})}
//                       className="w-full p-2 border rounded-lg"
//                       disabled={testRunning}
//                     />
//                   </div>
//                   {testConfig.signal_type === 'AC' && (
//                     <div>
//                       <label className="block text-sm font-medium text-gray-700 mb-2">Frequency (Hz)</label>
//                       <input
//                         type="number"
//                         value={testConfig.frequency}
//                         onChange={e => setTestConfig({...testConfig, frequency: e.target.value})}
//                         className="w-full p-2 border rounded-lg"
//                         disabled={testRunning}
//                       />
//                     </div>
//                   )}
//                 </div>
//                 <button
//                   onClick={handleStartTest}
//                   disabled={testRunning || !calibrator.connected || !dut.connected}
//                   className="flex items-center space-x-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300"
//                 >
//                   <Play className="w-5 h-5" />
//                   <span>{testRunning ? 'Test Running...' : 'Start Test'}</span>
//                 </button>
//               </div>
//             )}

//             {activeTab === 'results' && (
//               <div className="bg-white rounded-lg shadow-md p-6">
//                 <div className="flex items-center justify-between mb-4">
//                   <h2 className="text-xl font-semibold text-gray-800">Test Results</h2>
//                   {currentReport && (
//                     <button onClick={handleExportData} className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg">
//                       <Download className="w-4 h-4" />
//                       <span>Export JSON</span>
//                     </button>
//                   )}
//                 </div>
                
//                 {testResults.length === 0 ? (
//                   <div className="text-center py-12 text-gray-500">
//                     <Database className="w-12 h-12 mx-auto mb-3 text-gray-400" />
//                     <p>No test results. Run a calibration to see results.</p>
//                   </div>
//                 ) : (
//                   <div className="overflow-x-auto">
//                     <table className="w-full text-sm">
//                       <thead className="bg-gray-50 border-b-2">
//                         <tr>
//                           <th className="px-4 py-3 text-left font-semibold">Point</th>
//                           <th className="px-4 py-3 text-right font-semibold">Nominal</th>
//                           <th className="px-4 py-3 text-right font-semibold">Mean</th>
//                           <th className="px-4 py-3 text-right font-semibold">Error %</th>
//                           <th className="px-4 py-3 text-right font-semibold">U (k=2)</th>
//                           <th className="px-4 py-3 text-center font-semibold">Result</th>
//                         </tr>
//                       </thead>
//                       <tbody>
//                         {testResults.map((result, idx) => (
//                           <tr key={idx} className="border-b hover:bg-gray-50">
//                             <td className="px-4 py-3">{idx + 1}</td>
//                             <td className="px-4 py-3 text-right font-mono">{result.calibrator_output.toFixed(6)} V</td>
//                             <td className="px-4 py-3 text-right font-mono">{result.mean_reading.toFixed(6)} V</td>
//                             <td className="px-4 py-3 text-right font-mono">{result.error_percentage.toFixed(4)}%</td>
//                             <td className="px-4 py-3 text-right font-mono">{result.expanded_uncertainty.toFixed(6)} V</td>
//                             <td className="px-4 py-3 text-center">
//                               <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
//                                 result.pass_fail === 'PASS' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
//                               }`}>
//                                 {result.pass_fail}
//                               </span>
//                             </td>
//                           </tr>
//                         ))}
//                       </tbody>
//                     </table>
//                   </div>
//                 )}
//               </div>
//             )}

//             {activeTab === 'reports' && (
//               <div className="bg-white rounded-lg shadow-md p-6">
//                 <div className="flex justify-between items-center mb-6">
//                   <h2 className="text-xl font-semibold text-gray-800">Saved Calibration Reports</h2>
//                   <button onClick={loadSavedReports} className="text-blue-600 hover:underline">Refresh</button>
//                 </div>
                
//                 <div className="space-y-3">
//                   {savedReports.length === 0 ? (
//                     <p className="text-center text-gray-500 py-10">No reports found.</p>
//                   ) : (
//                     savedReports.map(report => (
//                       <div key={report.report_id} className="flex items-center justify-between p-4 border rounded-lg hover:border-blue-400">
//                         <div>
//                           <div className="font-mono font-bold">{report.report_id}</div>
//                           <div className="text-sm text-gray-500">
//                             {new Date(report.created_at).toLocaleDateString()} • {report.operator} • {report.points_passed}/{report.total_points} Passed
//                           </div>
//                         </div>
//                         <div className="flex items-center space-x-2">
//                           <button onClick={() => handleViewReport(report.report_id)} className="px-4 py-2 bg-blue-600 text-white rounded text-sm">View</button>
//                           <button onClick={() => handleDeleteReport(report.report_id)} className="p-2 text-red-600 hover:bg-red-50 rounded"><Trash2 className="w-5 h-5" /></button>
//                         </div>
//                       </div>
//                     ))
//                   )}
//                 </div>
//               </div>
//             )}
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default WebApp;