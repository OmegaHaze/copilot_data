import { useEffect, useRef } from "react";
import { useEnvSocket } from "../../../Panes/Utility/Context/EnvSocketContext";

// Store decay timer globally so we can clean it up properly
let decayTimer = null;

export function useNetworkData(setChartData, setCurrentData) {
  const lastActivityTimeRef = useRef(Date.now());
  const { metricsData, getMetricsSocket } = useEnvSocket();
  
  // Connect to network metrics stream when component mounts
  useEffect(() => {
    try {
      // This creates the socket connection only when this component is mounted
      if (typeof getMetricsSocket === 'function') {
        getMetricsSocket('network');
      } else {
        console.error('getMetricsSocket is not a function:', typeof getMetricsSocket);
      }
    } catch (err) {
      console.error('Error connecting to Network socket:', err);
    }
    
    return () => {
      // No need to disconnect - the socket is managed by the context
    };
  }, [getMetricsSocket]);
  
  // Format megabytes to human-readable network speeds
  const formatNetworkSpeed = (mbPerSec) => {
    if (mbPerSec === undefined || mbPerSec === null || isNaN(mbPerSec)) return '0 MB/s';
    
    const absValue = Math.abs(mbPerSec);
    
    if (absValue < 0.001) return (mbPerSec * 1024).toFixed(1) + ' KB/s';
    if (absValue < 1) return (mbPerSec).toFixed(3) + ' MB/s';
    if (absValue < 1024) return (mbPerSec).toFixed(2) + ' MB/s';
    return (mbPerSec / 1024).toFixed(2) + ' GB/s';
  };
  
  // Set up decay effect for smooth decreases
  useEffect(() => {
    const DECAY_FACTOR = 0.8;
    const DECAY_INTERVAL_MS = 500;
    
    if (decayTimer) clearInterval(decayTimer);
    
    decayTimer = setInterval(() => {
      const now = Date.now();
      if (now - lastActivityTimeRef.current > 1500) {
        setCurrentData(prev => {
          if (!prev) return prev;
          const newRxRaw = Math.max(0, prev.rxRaw * DECAY_FACTOR);
          const newTxRaw = Math.max(0, prev.txRaw * DECAY_FACTOR);
          if (newRxRaw < 0.01 && newTxRaw < 0.01) return prev;
          return {
            ...prev,
            rx: formatNetworkSpeed(newRxRaw),
            tx: formatNetworkSpeed(newTxRaw),
            rxRaw: newRxRaw,
            txRaw: newTxRaw
          };
        });
      }
    }, DECAY_INTERVAL_MS);
    
    return () => {
      if (decayTimer) {
        clearInterval(decayTimer);
        decayTimer = null;
      }
    };
  }, [setCurrentData]);
  
  // React to network metrics changes from SocketContext
  useEffect(() => {
    if (metricsData?.network) {
      const data = metricsData.network;
      // Data comes directly from backend in the new architecture
      const tx = data.tx || 0;
      const rx = data.rx || 0;

      if (rx > 0.01 || tx > 0.01) {
        lastActivityTimeRef.current = Date.now();
      }

      setCurrentData(prev => {
        const txDisplay = formatNetworkSpeed(tx);
        const rxDisplay = formatNetworkSpeed(rx);

        // Use threshold of 0.01 MB/s (10 KB/s) for "significant" activity
        const lastNonZeroTx = tx > 0.01 ? txDisplay : prev?.lastNonZeroTx || '0 MB/s';
        const lastNonZeroRx = rx > 0.01 ? rxDisplay : prev?.lastNonZeroRx || '0 MB/s';

        return {
          ...prev,
          tx: txDisplay,
          rx: rxDisplay,
          txRaw: tx,
          rxRaw: rx,
          lastNonZeroTx,
          lastNonZeroRx
        };
      });
    }
  }, [metricsData?.network, setCurrentData]);


  const fetchNetworkLog = async () => {
    try {
      // Use the metrics history endpoint for network data
      // Reduced to 1 minute for more recent data with higher update frequency
      const res = await fetch('/api/history/network?minutes=1');
      if (!res.ok) throw new Error(`Network log fetch error: ${res.status}`);
      
      // Process the response
      let networkHistory = await res.json();
      
      // Ensure networkHistory is an array
      if (!Array.isArray(networkHistory)) {
        console.error('Network history is not an array:', networkHistory);
        networkHistory = [];
      }
      
      // No debug logging needed
      
      // Format megabytes to human-readable network speeds
      const formatNetworkSpeed = (mbPerSec) => {
        if (mbPerSec === undefined || mbPerSec === null || isNaN(mbPerSec)) return '0 MB/s';
        
        const absValue = Math.abs(mbPerSec);
        
        if (absValue < 0.001) return (mbPerSec * 1024).toFixed(1) + ' KB/s';
        if (absValue < 1) return (mbPerSec).toFixed(3) + ' MB/s';
        if (absValue < 1024) return (mbPerSec).toFixed(2) + ' MB/s';
        return (mbPerSec / 1024).toFixed(2) + ' GB/s';
      };
      
      // First map all entries to processed data
      let mappedData = networkHistory.map(entry => {
        // Ensure timestamp is treated as a number
        const timestamp = typeof entry.timestamp === 'number' ? entry.timestamp : parseFloat(entry.timestamp);
        
        // Create a properly formatted time string with seconds precision
        const date = new Date(timestamp * 1000);
        const time = date.toLocaleTimeString('en-US', {hour: '2-digit', minute:'2-digit', second:'2-digit', hour12: true});
        
        // Get network data, handling the Python backend's nested structure
        const data = entry.data || {};
        
        // Values now come in megabytes per second (MB/s) from the backend
        // with raw bytes/sec values in tx_bytes and rx_bytes
        const tx = data.tx || 0;  // MB/s
        const rx = data.rx || 0;  // MB/s
        
        // For chart display, convert to KB if needed for consistency
        const txKb = tx * 1024; // kilobytes
        const rxKb = rx * 1024; // kilobytes
        
        return {
          timestamp,
          time,
          // Graph needs consistent units, using kilobytes
          txKB: txKb, // KB from MB
          rxKB: rxKb, // KB from MB
          // Raw values in MB/s - retained for calculations
          tx: tx,  // MB/s
          rx: rx,  // MB/s
          // Display friendly formats with appropriate units
          txDisplay: formatNetworkSpeed(tx),
          rxDisplay: formatNetworkSpeed(rx),
          interface: data.interface || 'default'
        };
      }).sort((a, b) => a.timestamp - b.timestamp);
      
      // Now add smoothing to the data similar to how memory is processed
      // This prevents sharp drops to zero, making the graph look more like memory
      const smoothedData = [];
      let lastSignificantRx = 0;
      let lastSignificantTx = 0;
      
      for (let i = 0; i < mappedData.length; i++) {
        const item = mappedData[i];
        
        // Update the "last significant" value if we have real activity
        // Now using MB/s, so the threshold is much smaller (0.01 MB/s = 10 KB/s)
        if (item.rx > 0.01) lastSignificantRx = item.rx;
        if (item.tx > 0.01) lastSignificantTx = item.tx;
        
        // For low or zero values, apply decay instead of showing zeros
        // This creates a more gentle slope similar to memory graph
        if (item.rx < 0.01 && lastSignificantRx > 0) {
          // Calculate how many positions since the last significant value
          let decay = 1.0;
          for (let j = i - 1; j >= 0; j--) {
            if (mappedData[j].rx > 0.01) {
              // Apply 80% decay for each position away from significant value
              decay = Math.pow(0.8, i - j);
              break;
            }
          }
          
          // Apply the decay to the last significant value
          const decayedRx = lastSignificantRx * decay;
          item.rx = Math.max(item.rx, decayedRx);
          item.rxKB = item.rx / 1024;
          item.rxDisplay = formatNetworkSpeed(item.rx);
        }
        
        // Same for tx values
        if (item.tx < 0.01 && lastSignificantTx > 0) {
          let decay = 1.0;
          for (let j = i - 1; j >= 0; j--) {
            if (mappedData[j].tx > 0.01) {
              decay = Math.pow(0.8, i - j);
              break;
            }
          }
          
          const decayedTx = lastSignificantTx * decay;
          item.tx = Math.max(item.tx, decayedTx);
          item.txKB = item.tx / 1024;
          item.txDisplay = formatNetworkSpeed(item.tx);
        }
        
        smoothedData.push(item);
      }
      
      // Return the smoothed data
      return smoothedData;
    } catch (err) {
      console.error('[NetworkData] Fetch log failed:', err);
      return [];
    }
  };

  const loadNetworkLog = async () => {
    try {
      // Fetch historical data
      const data = await fetchNetworkLog();
      
      // Ensure data is an array and has length before proceeding
      if (Array.isArray(data) && data.length > 0) {
        setChartData(data);
        const latest = data[data.length - 1];
        
        // Find the last entry with non-zero values (using MB/s threshold of 0.01)
        const lastNonZeroEntry = [...data].reverse().find(d => 
          (d.tx > 0.01 || d.rx > 0.01) && (d.txDisplay && d.rxDisplay)
        ) || latest;
        
        // Update current data with the latest values
        setCurrentData(prev => {
          const txDisplay = latest.txDisplay || '0 MB/s';
          const rxDisplay = latest.rxDisplay || '0 MB/s';
          
          // Use the last non-zero values if current values are zero
          const lastNonZeroTx = latest.tx > 0.01 ? txDisplay : 
                              (lastNonZeroEntry.tx > 0.01 ? lastNonZeroEntry.txDisplay : prev?.lastNonZeroTx || '0 MB/s');
          const lastNonZeroRx = latest.rx > 0.01 ? rxDisplay : 
                              (lastNonZeroEntry.rx > 0.01 ? lastNonZeroEntry.rxDisplay : prev?.lastNonZeroRx || '0 MB/s');
          
          return {
            ...prev,
            tx: txDisplay,
            rx: rxDisplay,
            txRaw: latest.tx || 0, 
            rxRaw: latest.rx || 0,
            lastNonZeroTx,
            lastNonZeroRx
          };
        });
      } else {
        console.warn('No network data received or empty array returned');
        // Set default empty data if needed
        setChartData([]);
      }
    } catch (error) {
      console.error('Error loading network log:', error);
      // Handle the error gracefully - set default empty data
      setChartData([]);
    }
  };

  // Cleanup function - just clears the chart data
  const cleanupSockets = () => {
    if (decayTimer) {
      console.log('Clearing decay timer');
      clearInterval(decayTimer);
      decayTimer = null;
    }
  };

  return { 
    loadNetworkLog,
    cleanupSockets
  };
}
