// // ===== src/components/ManualMode.jsx =====

// import React, { useState } from 'react';
// import { Send, Zap } from 'lucide-react';

// const ManualMode = ({ calibrator, dut, api }) => {
//   const [manualCommand, setManualCommand] = useState({
//     instrument: 'calibrator',
//     command_type: 'set_dc_voltage',
//     value: 10,
//     frequency: 60,
//     expect_response: false
//   });
  
//   const [manualResponse, setManualResponse] = useState(null);
//   const [sending, setSending] = useState(false);

//   const commandTemplates = {
//     calibrator: [
//       { value: 'set_dc_voltage', label: 'Set DC Voltage', needs_value: true, needs_frequency: false },
//       { value: 'set_ac_voltage', label: 'Set AC Voltage', needs_value: true, needs_frequency: true },
//       { value: 'set_dc_current', label: 'Set DC Current', needs_value: true, needs_frequency: false },
//       { value: 'set_ac_current', label: 'Set AC Current', needs_value: true, needs_frequency: true },
//       { value: 'operate', label: 'Operate (Turn ON)', needs_value: false, needs_frequency: false },
//       { value: 'standby', label: 'Standby (Turn OFF)', needs_value: false, needs_frequency: false },
//       { value: 'reset', label: 'Reset (*RST)', needs_value: false, needs_frequency: false }
//     ],
//     dut: [
//       { value: 'conf_dc_voltage', label: 'Configure DC Voltage', needs_value: false, needs_frequency: false },
//       { value: 'conf_ac_voltage', label: 'Configure AC Voltage', needs_value: false, needs_frequency: false },
//       { value: 'conf_dc_current', label: 'Configure DC Current', needs_value: false, needs_frequency: false },
//       { value: 'conf_ac_current', label: 'Configure AC Current', needs_value: false, needs_frequency: false },
//       { value: 'read', label: 'Read (*READ?)', needs_value: false, needs_frequency: false, has_response: true },
//       { value: 'reset', label: 'Reset (*RST)', needs_value: false, needs_frequency: false }
//     ]
//   };

//   const handleSendCommand = async () => {
//     setSending(true);
//     setManualResponse(null);

//     try {
//       const selectedTemplate = commandTemplates[manualCommand.instrument].find(
//         t => t.value === manualCommand.command_type
//       );

//       const parameters = {};
//       if (selectedTemplate.needs_value) {
//         parameters.value = parseFloat(manualCommand.value);
//       }
//       if (selectedTemplate.needs_frequency) {
//         parameters.frequency = parseFloat(manualCommand.frequency);
//       }

//       const response = await api.post('/api/manual/command', {
//         instrument: manualCommand.instrument,
//         command_name: manualCommand.command_type,
//         parameters: parameters,
//         expect_response: selectedTemplate.has_response || false
//       });

//       setManualResponse(response);
//     } catch (error) {
//       setManualResponse({
//         success: false,
//         message: error.message,
//         command_sent: 'Error'
//       });
//     } finally {
//       setSending(false);
//     }
//   };

//   const getCurrentTemplate = () => {
//     return commandTemplates[manualCommand.instrument].find(
//       t => t.value === manualCommand.command_type
//     );
//   };

//   const currentTemplate = getCurrentTemplate();

//   return (
//     <div className="space-y-6">
//       <div className="bg-white rounded-lg shadow-md p-6">
//         <h2 className="text-xl font-semibold text-gray-800 mb-4">Manual Command Mode</h2>
//         <p className="text-sm text-gray-600 mb-4">
//           Send individual commands directly to instruments. Each command is sent immediately.
//         </p>

//         {/* Instrument Selection */}
//         <div className="grid grid-cols-2 gap-4 mb-4">
//           <div>
//             <label className="block text-sm font-medium text-gray-700 mb-2">Target Instrument</label>
//             <select
//               value={manualCommand.instrument}
//               onChange={e => setManualCommand({...manualCommand, instrument: e.target.value})}
//               className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
//             >
//               <option value="calibrator">Calibrator</option>
//               <option value="dut">DUT (Multimeter/PSU)</option>
//             </select>
//           </div>

//           <div>
//             <label className="block text-sm font-medium text-gray-700 mb-2">Command</label>
//             <select
//               value={manualCommand.command_type}
//               onChange={e => setManualCommand({...manualCommand, command_type: e.target.value})}
//               className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
//             >
//               {commandTemplates[manualCommand.instrument].map(cmd => (
//                 <option key={cmd.value} value={cmd.value}>{cmd.label}</option>
//               ))}
//             </select>
//           </div>
//         </div>

//         {/* Parameters */}
//         {(currentTemplate.needs_value || currentTemplate.needs_frequency) && (
//           <div className="grid grid-cols-2 gap-4 mb-4">
//             {currentTemplate.needs_value && (
//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-2">
//                   Value {manualCommand.command_type.includes('current') ? '(Amps)' : '(Volts)'}
//                 </label>
//                 <input
//                   type="number"
//                   value={manualCommand.value}
//                   onChange={e => setManualCommand({...manualCommand, value: e.target.value})}
//                   className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
//                   step="0.001"
//                 />
//               </div>
//             )}

//             {currentTemplate.needs_frequency && (
//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-2">Frequency (Hz)</label>
//                 <input
//                   type="number"
//                   value={manualCommand.frequency}
//                   onChange={e => setManualCommand({...manualCommand, frequency: e.target.value})}
//                   className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
//                 />
//               </div>
//             )}
//           </div>
//         )}

//         {/* Send Button */}
//         <button
//           onClick={handleSendCommand}
//           disabled={sending || (!calibrator.connected && !dut.connected)}
//           className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium"
//         >
//           <Send className="w-5 h-5" />
//           <span>{sending ? 'Sending...' : 'Send Command'}</span>
//         </button>

//         {!calibrator.connected && !dut.connected && (
//           <p className="mt-3 text-sm text-red-600">
//             ⚠ Please connect instruments first
//           </p>
//         )}
//       </div>

//       {/* Response Display */}
//       {manualResponse && (
//         <div className={`rounded-lg shadow-md p-6 ${
//           manualResponse.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
//         }`}>
//           <h3 className="font-semibold text-lg mb-3 flex items-center space-x-2">
//             <Zap className={`w-5 h-5 ${manualResponse.success ? 'text-green-600' : 'text-red-600'}`} />
//             <span className={manualResponse.success ? 'text-green-900' : 'text-red-900'}>
//               Command Result
//             </span>
//           </h3>
          
//           <div className="space-y-2 text-sm">
//             <div className="flex">
//               <span className="font-medium text-gray-700 w-32">SCPI Sent:</span>
//               <code className="text-gray-900 bg-white px-2 py-1 rounded font-mono">
//                 {manualResponse.command_sent}
//               </code>
//             </div>
            
//             {manualResponse.response && (
//               <div className="flex">
//                 <span className="font-medium text-gray-700 w-32">Response:</span>
//                 <code className="text-gray-900 bg-white px-2 py-1 rounded font-mono">
//                   {manualResponse.response}
//                 </code>
//               </div>
//             )}
            
//             <div className="flex">
//               <span className="font-medium text-gray-700 w-32">Duration:</span>
//               <span className="text-gray-900">{manualResponse.duration_ms}ms</span>
//             </div>
            
//             <div className="flex">
//               <span className="font-medium text-gray-700 w-32">Status:</span>
//               <span className={manualResponse.success ? 'text-green-700 font-semibold' : 'text-red-700 font-semibold'}>
//                 {manualResponse.success ? '✓ Success' : '✗ Failed'}
//               </span>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* Quick Command Reference */}
//       <div className="bg-gray-50 rounded-lg p-4">
//         <h3 className="font-semibold text-gray-800 mb-2 text-sm">Quick Command Guide</h3>
//         <div className="text-xs text-gray-600 space-y-1">
//           <div>• <strong>Set Voltage/Current:</strong> Configure calibrator output</div>
//           <div>• <strong>Operate:</strong> Turn ON calibrator output (relay closes)</div>
//           <div>• <strong>Standby:</strong> Turn OFF calibrator output (safe state)</div>
//           <div>• <strong>Configure:</strong> Set DMM measurement mode</div>
//           <div>• <strong>Read:</strong> Get current reading from DMM</div>
//           <div>• <strong>Reset:</strong> Return instrument to default state</div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default ManualMode;

import React, { useState } from 'react';
import { Send, Zap } from 'lucide-react';

const ManualMode = ({ calibrator, dut, api }) => {
  const [manualCommand, setManualCommand] = useState({
    instrument: 'calibrator',
    command_type: 'set_dc_voltage',
    value: 10,
    frequency: 60,
    expect_response: false
  });
  
  const [manualResponse, setManualResponse] = useState(null);
  const [sending, setSending] = useState(false);

  const commandTemplates = {
    calibrator: [
      { value: 'set_dc_voltage', label: 'Set DC Voltage', needs_value: true, needs_frequency: false },
      { value: 'set_ac_voltage', label: 'Set AC Voltage', needs_value: true, needs_frequency: true },
      { value: 'set_dc_current', label: 'Set DC Current', needs_value: true, needs_frequency: false },
      { value: 'set_ac_current', label: 'Set AC Current', needs_value: true, needs_frequency: true },
      { value: 'operate', label: 'Operate (Turn ON)', needs_value: false, needs_frequency: false },
      { value: 'standby', label: 'Standby (Turn OFF)', needs_value: false, needs_frequency: false },
      { value: 'reset', label: 'Reset (*RST)', needs_value: false, needs_frequency: false }
    ],
    dut: [
      { value: 'conf_dc_voltage', label: 'Configure DC Voltage', needs_value: false, needs_frequency: false },
      { value: 'conf_ac_voltage', label: 'Configure AC Voltage', needs_value: false, needs_frequency: false },
      { value: 'conf_dc_current', label: 'Configure DC Current', needs_value: false, needs_frequency: false },
      { value: 'conf_ac_current', label: 'Configure AC Current', needs_value: false, needs_frequency: false },
      { value: 'read', label: 'Read (*READ?)', needs_value: false, needs_frequency: false, has_response: true },
      { value: 'reset', label: 'Reset (*RST)', needs_value: false, needs_frequency: false }
    ]
  };

  const handleInstrumentChange = (newInstrument) => {
    const firstCommand = commandTemplates[newInstrument][0];
    setManualCommand({
      ...manualCommand,
      instrument: newInstrument,
      command_type: firstCommand.value
    });
    setManualResponse(null);
  };

  const handleSendCommand = async () => {
    setSending(true);
    setManualResponse(null);

    try {
      const selectedTemplate = commandTemplates[manualCommand.instrument].find(
        t => t.value === manualCommand.command_type
      );

      const parameters = {};
      if (selectedTemplate.needs_value) {
        parameters.value = parseFloat(manualCommand.value);
      }
      if (selectedTemplate.needs_frequency) {
        parameters.frequency = parseFloat(manualCommand.frequency);
      }

      const response = await api.post('/api/manual/command', {
        instrument: manualCommand.instrument,
        command_name: manualCommand.command_type,
        parameters: parameters,
        expect_response: selectedTemplate.has_response || false
      });

      setManualResponse(response);
    } catch (error) {
      setManualResponse({
        success: false,
        message: error.message,
        command_sent: 'Error'
      });
    } finally {
      setSending(false);
    }
  };

  const getCurrentTemplate = () => {
    return commandTemplates[manualCommand.instrument].find(
      t => t.value === manualCommand.command_type
    ) || commandTemplates[manualCommand.instrument][0];
  };

  const currentTemplate = getCurrentTemplate();

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-lg shadow-md p-5">
        <h2 className="text-lg font-semibold text-gray-800 mb-1">Manual Command Mode</h2>
        <p className="text-xs text-gray-500 mb-4">
          Send individual commands directly to instruments.
        </p>

        {/* Instrument Selection */}
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Target Instrument</label>
            <select
              value={manualCommand.instrument}
              onChange={e => handleInstrumentChange(e.target.value)}
              className="w-full p-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="calibrator">Calibrator</option>
              <option value="dut">DUT (Multimeter/PSU)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Command</label>
            <select
              value={manualCommand.command_type}
              onChange={e => setManualCommand({...manualCommand, command_type: e.target.value})}
              className="w-full p-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {commandTemplates[manualCommand.instrument].map(cmd => (
                <option key={cmd.value} value={cmd.value}>{cmd.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Parameters */}
        {(currentTemplate.needs_value || currentTemplate.needs_frequency) && (
          <div className="grid grid-cols-2 gap-3 mb-3">
            {currentTemplate.needs_value && (
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Value {manualCommand.command_type.includes('current') ? '(Amps)' : '(Volts)'}
                </label>
                <input
                  type="number"
                  value={manualCommand.value}
                  onChange={e => setManualCommand({...manualCommand, value: e.target.value})}
                  className="w-full p-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  step="0.001"
                />
              </div>
            )}

            {currentTemplate.needs_frequency && (
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Frequency (Hz)</label>
                <input
                  type="number"
                  value={manualCommand.frequency}
                  onChange={e => setManualCommand({...manualCommand, frequency: e.target.value})}
                  className="w-full p-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            )}
          </div>
        )}

        {/* Send Button */}
        <button
          onClick={handleSendCommand}
          disabled={sending || (!calibrator.connected && !dut.connected)}
          className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors text-sm font-medium"
        >
          <Send className="w-4 h-4" />
          <span>{sending ? 'Sending...' : 'Send Command'}</span>
        </button>

        {!calibrator.connected && !dut.connected && (
          <p className="mt-2 text-xs text-red-600 flex items-center gap-1">
            <span>⚠</span> Please connect instruments first
          </p>
        )}
      </div>

      {/* Response Display */}
      {manualResponse && (
        <div className={`rounded-lg shadow-md p-4 ${
          manualResponse.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
        }`}>
          <div className="flex items-center space-x-2 mb-2">
            <Zap className={`w-4 h-4 ${manualResponse.success ? 'text-green-600' : 'text-red-600'}`} />
            <h3 className={`font-semibold text-sm ${manualResponse.success ? 'text-green-900' : 'text-red-900'}`}>
              Command Result
            </h3>
          </div>
          
          <div className="space-y-1.5 text-xs">
            <div className="flex items-start">
              <span className="font-medium text-gray-700 w-20 flex-shrink-0">SCPI:</span>
              <code className="text-gray-900 bg-white px-2 py-0.5 rounded font-mono flex-1">
                {manualResponse.command_sent}
              </code>
            </div>
            
            {manualResponse.response && (
              <div className="flex items-start">
                <span className="font-medium text-gray-700 w-20 flex-shrink-0">Response:</span>
                <code className="text-gray-900 bg-white px-2 py-0.5 rounded font-mono flex-1">
                  {manualResponse.response}
                </code>
              </div>
            )}
            
            <div className="flex items-center">
              <span className="font-medium text-gray-700 w-20">Duration:</span>
              <span className="text-gray-900">{manualResponse.duration_ms}ms</span>
            </div>
            
            <div className="flex items-center">
              <span className="font-medium text-gray-700 w-20">Status:</span>
              <span className={manualResponse.success ? 'text-green-700 font-semibold' : 'text-red-700 font-semibold'}>
                {manualResponse.success ? '✓ Success' : '✗ Failed'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Quick Command Reference */}
      <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
        <h3 className="font-semibold text-gray-800 mb-1.5 text-xs">Quick Command Guide</h3>
        <div className="text-xs text-gray-600 space-y-0.5" style={{ lineHeight: '1.4' }}>
          <div>• <strong>Set Voltage/Current:</strong> Configure calibrator output</div>
          <div>• <strong>Operate:</strong> Turn ON calibrator output</div>
          <div>• <strong>Standby:</strong> Turn OFF calibrator output</div>
          <div>• <strong>Configure:</strong> Set DMM measurement mode</div>
          <div>• <strong>Read:</strong> Get current reading from DMM</div>
          <div>• <strong>Reset:</strong> Return instrument to default state</div>
        </div>
      </div>
    </div>
  );
};

export default ManualMode;