// SupervisorPane.jsx

import { useEffect, useRef, useState, useCallback } from 'react';
import { useSocket } from '../Context/SocketContext.jsx';
import PaneHeader from '../PaneHeader.jsx';

export default function SupervisorPane({
  id,
  moduleType = 'SYSTEM',
  staticIdentifier = 'SupervisorPane',
  name = 'Supervisor',
  logo
}) {
  const [logs, setLogs] = useState('');
  const [status, setStatus] = useState('ONLINE');
  const [isLoading, setIsLoading] = useState(true);

  const { logStreams } = useSocket();
  const mountedRef = useRef(true);
  const terminalRef = useRef(null);
  const refreshTimerRef = useRef(null);
  const fetchingRef = useRef(false);

  // Clean up on unmount
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    };
  }, []);

  // Set status based on log content
  const evaluateStatus = useCallback((text) => {
    if (text.includes('ERROR')) return 'ERROR';
    if (text.includes('WARN')) return 'WARNING';
    return 'ONLINE';
  }, []);

  // Socket-based live logs
  useEffect(() => {
    const stream = logStreams?.['supervisord.log'];
    if (!mountedRef.current || !stream) return;

    setLogs(stream);
    setStatus(evaluateStatus(stream));
    setIsLoading(false);
  }, [logStreams, evaluateStatus]);

  // Fallback: poll logs if no socket stream available
  const fetchSupervisorLogs = useCallback(async () => {
    if (fetchingRef.current || !mountedRef.current) return;

    fetchingRef.current = true;
    setIsLoading(true);

    try {
      const res = await fetch(`/api/logs/file?filename=supervisord.log&_t=${Date.now()}`);
      if (!mountedRef.current) return;

      if (!res.ok) {
        const msg = res.status === 404
          ? 'supervisord.log not found. Supervisor might not be running.'
          : `Fetch failed: ${res.status} ${res.statusText}`;
        throw new Error(msg);
      }

      const text = await res.text();
      if (mountedRef.current) {
        setLogs(text);
        setStatus(evaluateStatus(text));
      }
    } catch (err) {
      if (mountedRef.current) {
        setLogs(`Error: ${err.message}`);
        setStatus('ERROR');
      }
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
        fetchingRef.current = false;
      }
    }
  }, [evaluateStatus]);

  // Start polling if no socket stream
  useEffect(() => {
    if (logStreams?.['supervisord.log']) return;

    fetchSupervisorLogs();
    const loop = () => {
      refreshTimerRef.current = setTimeout(() => {
        fetchSupervisorLogs();
        if (mountedRef.current) loop();
      }, 30000);
    };
    loop();

    return () => clearTimeout(refreshTimerRef.current);
  }, [logStreams, fetchSupervisorLogs]);

  // Scroll to bottom on log update
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div className="bg-[#08170D]/30 backdrop-blur-sm rounded crt-border-green6 shadow-inner overflow-hidden w-full h-full flex flex-col relative">
      <PaneHeader
        name={name}
        status={status}
        logo={logo}
        moduleType={moduleType}
        staticIdentifier={staticIdentifier}
        _gridId={id}
      />

      <div className="flex-grow flex flex-col overflow-hidden">
        <div className="flex items-center justify-between p-2 border-b border-gray-700">
          <div className="flex items-center gap-2">
            <span className={`px-2 py-1 rounded text-xs ${
              status === 'ERROR' ? 'bg-red-900/50 text-red-400' :
              status === 'WARNING' ? 'bg-yellow-900/50 text-yellow-400' :
              'bg-green-900/50 text-green-400'
            }`}>
              {status}
            </span>
            <button
              onClick={fetchSupervisorLogs}
              className="px-2 py-1 bg-gray-800 text-gray-300 hover:bg-gray-700 text-xs rounded"
            >
              Refresh Logs
            </button>
          </div>
          <div className="text-xs text-gray-400 font-mono">{id}</div>
        </div>

        <div
          ref={terminalRef}
          className="flex-grow p-2 overflow-y-auto bg-black font-mono text-xs text-green-300 whitespace-pre-wrap"
        >
          {isLoading && !logs ? (
            <div className="flex items-center justify-center h-full text-yellow-400">
              Loading supervisor logs...
            </div>
          ) : logs ? (
            logs
              .split('\n')
              .slice(-500) // only render last 500 lines
              .map((line, i) => (
                <div key={i} className="opacity-80 hover:opacity-100">{line}</div>
              ))
          ) : (
            <div className="flex items-center justify-center h-full text-red-400">
              No logs available
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
