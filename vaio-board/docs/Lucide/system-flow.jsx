import React from 'react';
import { ArrowDownCircle, AlertTriangle, CheckCircle, X, AlertCircle } from 'lucide-react';

const ErrorSystemVisualization = () => {
  return (
    <div className="p-6 bg-gray-50 rounded-lg shadow">
      {/* Architecture Overview */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Error System Architecture</h2>
        <div className="flex flex-col space-y-4">
          
          {/* Application Entry */}
          <div className="relative">
            <div className="absolute left-6 top-16 h-full border-l-2 border-blue-300 border-dashed" />
            <div className="flex items-center">
              <div className="bg-blue-100 p-4 rounded-lg shadow-sm border border-blue-200 w-full">
                <h3 className="font-medium text-blue-800">App Entry</h3>
                <p className="text-sm text-gray-600">main.jsx wraps &lt;App /&gt; with &lt;ErrorProvider&gt;</p>
              </div>
            </div>
            
            {/* Error Provider */}
            <div className="ml-12 mt-8">
              <div className="bg-green-100 p-4 rounded-lg shadow-sm border border-green-200 w-full">
                <h3 className="font-medium text-green-800">ErrorProvider</h3>
                <ul className="text-sm text-gray-600 pl-5 list-disc">
                  <li>Initializes internal state (errors[], shownErrors, dismissedErrors)</li>
                  <li>Registers global window.__VAIO_ERROR_SYSTEM__</li>
                  <li>Renders &lt;ErrorDisplay&gt; with sorted + visible errors</li>
                </ul>
              </div>
              
              {/* Error Sources */}
              <div className="mt-8 flex flex-col space-y-4">
                <h3 className="font-medium text-gray-700">Error Sources</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-yellow-50 p-3 rounded border border-yellow-200">
                    <div className="flex items-center mb-2">
                      <AlertCircle size={16} className="text-yellow-500 mr-2" />
                      <span className="font-medium">UI Components</span>
                    </div>
                    <p className="text-xs text-gray-600">ServiceMatrix & SidePanels call useError().showError()</p>
                  </div>
                  <div className="bg-yellow-50 p-3 rounded border border-yellow-200">
                    <div className="flex items-center mb-2">
                      <AlertCircle size={16} className="text-yellow-500 mr-2" />
                      <span className="font-medium">Console Overrides</span>
                    </div>
                    <p className="text-xs text-gray-600">console.error/warn trigger showError()</p>
                  </div>
                  <div className="bg-yellow-50 p-3 rounded border border-yellow-200">
                    <div className="flex items-center mb-2">
                      <AlertCircle size={16} className="text-yellow-500 mr-2" />
                      <span className="font-medium">Socket Events</span>
                    </div>
                    <p className="text-xs text-gray-600">Telemetry from services with errors</p>
                  </div>
                </div>
              </div>
              
              {/* Error Flow */}
              <div className="mt-8">
                <h3 className="font-medium text-gray-700 mb-3">Error Handling Flow</h3>
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <div className="flex flex-col">
                    <div className="flex items-center">
                      <div className="bg-blue-600 text-white px-3 py-1 rounded text-sm">showError(message, type)</div>
                      <ArrowDownCircle className="mx-4 text-blue-500" size={20} />
                    </div>
                    
                    <div className="ml-8 mt-3 space-y-2">
                      <div className="flex items-center">
                        <AlertTriangle size={16} className="text-amber-500 mr-2" />
                        <div className="text-sm text-gray-700">Check if in dismissedErrors (within 1 min)</div>
                      </div>
                      <div className="flex items-center">
                        <AlertTriangle size={16} className="text-amber-500 mr-2" />
                        <div className="text-sm text-gray-700">Check if in shownErrors (within debounce period)</div>
                      </div>
                      <div className="flex items-center">
                        <CheckCircle size={16} className="text-green-500 mr-2" />
                        <div className="text-sm text-gray-700">Add new error to top of list</div>
                      </div>
                    </div>
                    
                    <div className="mt-4 flex items-center">
                      <div className="bg-red-600 text-white px-3 py-1 rounded text-sm">hideError(id)</div>
                      <ArrowDownCircle className="mx-4 text-red-500" size={20} />
                      <div className="text-sm text-gray-700">Mark as dismissed and remove from state</div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Error Rendering */}
              <div className="mt-8">
                <h3 className="font-medium text-gray-700 mb-3">Error Rendering</h3>
                <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-200">
                  <div className="flex flex-col">
                    <div className="font-medium text-indigo-800 mb-2">ErrorDisplay Component</div>
                    <div className="bg-white p-3 rounded border border-gray-200 mb-2">
                      <div className="flex justify-between items-center">
                        <div className="text-sm font-medium">Error Item 1</div>
                        <X size={16} className="text-gray-500" />
                      </div>
                      <div className="text-xs text-gray-600">High priority system error</div>
                    </div>
                    <div className="bg-white p-3 rounded border border-gray-200">
                      <div className="flex justify-between items-center">
                        <div className="text-sm font-medium">Error Item 2</div>
                        <X size={16} className="text-gray-500" />
                      </div>
                      <div className="text-xs text-gray-600">Medium priority UI error</div>
                    </div>
                    <div className="text-xs text-gray-500 mt-2">
                      Animation: translateY(100%) → 0, top = index * 65px
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Problem Zones */}
              <div className="mt-8">
                <h3 className="font-medium text-gray-700 mb-3">Problem Zones</h3>
                <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                  <ul className="text-sm text-gray-700 space-y-2">
                    <li className="flex items-start">
                      <AlertTriangle size={16} className="text-red-500 mr-2 mt-0.5" />
                      <span>Global window object is tightly coupled</span>
                    </li>
                    <li className="flex items-start">
                      <AlertTriangle size={16} className="text-red-500 mr-2 mt-0.5" />
                      <span>Console overrides may inject benign logs</span>
                    </li>
                    <li className="flex items-start">
                      <AlertTriangle size={16} className="text-red-500 mr-2 mt-0.5" />
                      <span>Errors dismissed by user may resurface unless suppressed</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ErrorSystemVisualization;