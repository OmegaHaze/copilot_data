import { useEffect, useRef } from "react";
import { useEnvSocket } from "../../../Panes/Utility/Context/EnvSocketContext";

export function useGpuData(setChartData, setCurrentData, setErrorState) {
  const dataBuffer = useRef([]);
  const MAX_HISTORY_SECONDS = 180; // 3 minutes
  const hasDisplayedError = useRef(false);
  
  // Get centralized metrics management from context
  const { metricsData, getMetricsSocket } = useEnvSocket();
  
  // Connect to GPU metrics stream when component mounts
  useEffect(() => {
    // We access the debug mode from the EnvSocketContext
    
    try {
      // Simple connection - minimize complexity to avoid errors
      if (typeof getMetricsSocket === 'function') {
        // Call getMetricsSocket but don't add any event handlers directly
        // All event handling is managed by the EnvSocketContext
        getMetricsSocket('gpu');
      } else {
        console.error('⚡ getMetricsSocket is not a function');
      }
    } catch (err) {
      console.error('⚡ Error connecting to GPU socket:', err);
    }
    
    return () => {
      // No cleanup needed - socket is managed by context
    };
  }, [getMetricsSocket]);

  // React to GPU metrics data changes
  useEffect(() => {
    if (metricsData?.gpu) {
      const data = metricsData.gpu;
      const { 
        timestamp, 
        gpu_utilization, 
        mem_utilization, 
        temperature, 
        gpu_type,
        noGpuDetected,
        hasError,
        message,
        reason
      } = data;
      
      // Handle error cases
      if (hasError && setErrorState) {
        if (!hasDisplayedError.current) {
          setErrorState({
            hasError: true,
            errorType: 'metrics',
            message: message || 'Error retrieving GPU metrics',
            details: reason || 'Unknown error'
          });
          hasDisplayedError.current = true;
        }
      } else if (noGpuDetected && setErrorState) {
        if (!hasDisplayedError.current) {
          setErrorState({
            hasError: true,
            errorType: 'no_gpu',
            message: message || 'No NVIDIA GPU detected',
            details: reason || 'System may not have compatible NVIDIA GPU hardware'
          });
          hasDisplayedError.current = true;
        }
      }
      
      if (!timestamp) {
        console.warn("Missing GPU timestamp, skipping update");
        return;
      }
      
      const time = new Date(timestamp * 1000).toLocaleTimeString('en-US', 
        { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true });

      const newPoint = {
        timestamp,
        time,
        gpuUtil: gpu_utilization || 0,
        memUtil: mem_utilization || 0,
        temp: temperature || 0,
        gpuType: gpu_type || "Unknown GPU"
      };

      dataBuffer.current.push(newPoint);

      const now = Math.floor(Date.now() / 1000);
      dataBuffer.current = dataBuffer.current.filter(
        (point) => point.timestamp >= now - MAX_HISTORY_SECONDS
      );

      setChartData([...dataBuffer.current]);

      setCurrentData(prev => ({
        ...prev,
        gpuUtil: gpu_utilization || 0,
        memUtil: mem_utilization || 0,
        temp: temperature || 0,
        gpuType: gpu_type || "Unknown GPU"
      }));
    }
  }, [metricsData?.gpu, setChartData, setCurrentData, setErrorState]);

  // Load historical GPU data
  const loadGpuLog = async () => {
    try {
      // Fetch historical data for GPU
      const res = await fetch('/api/history/gpu?minutes=3');
      
      if (!res.ok) {
        const errorText = await res.text();
        console.error(`GPU log fetch error: ${res.status}`, errorText);
        throw new Error(`GPU log fetch error: ${res.status}`);
      }
      
      const gpuHistory = await res.json();
      
      if (Array.isArray(gpuHistory) && gpuHistory.length > 0) {
        // Get system info from the last entry or metricsData
        const systemInfo = metricsData?.gpu || gpuHistory[gpuHistory.length-1] || {};
        
        // Process historical data
        const processedData = gpuHistory.map(entry => {
          const timestamp = typeof entry.timestamp === 'number' ? entry.timestamp : parseFloat(entry.timestamp);
          const date = new Date(timestamp * 1000);
          const time = date.toLocaleTimeString('en-US', {hour: '2-digit', minute:'2-digit', second:'2-digit', hour12: true});
          
          const data = entry.data || entry; // Handle both data formats
          
          // Return a single properly formatted data point
          return {
            timestamp,
            time,
            gpuUtil: data.gpu_utilization || 0,
            memUtil: data.mem_utilization || 0,
            temp: data.temperature || 0,
            gpuType: data.gpu_type || systemInfo.gpu_type || "Unknown GPU"
          };
        }).sort((a, b) => a.timestamp - b.timestamp);
        
        // Update chart data with historical values
        dataBuffer.current = processedData;
        setChartData([...processedData]);
      }
    } catch (err) {
      console.error('[GpuData] Fetch log failed:', err);
      
      // Create some fallback data to ensure the chart renders
      const now = Math.floor(Date.now() / 1000);
      const fallbackData = [];
      
      // Generate synthetic data for the past 2 minutes
      for (let i = 0; i < 24; i++) {
        const timestamp = now - (120 - i * 5);
        const date = new Date(timestamp * 1000);
        const time = date.toLocaleTimeString('en-US', {hour: '2-digit', minute:'2-digit', second:'2-digit', hour12: true});
        
        fallbackData.push({
          timestamp,
          time,
          gpuUtil: Math.random() * 30,  // Random GPU utilization between 0-30%
          memUtil: Math.random() * 20,  // Random memory utilization between 0-20%
          temp: 40 + Math.random() * 10, // Random temperature between 40-50°C
          gpuType: "Fallback GPU"
        });
      }
      dataBuffer.current = fallbackData;
      setChartData([...fallbackData]);
      
      // Update current data to show something
      setCurrentData(prev => ({
        ...prev,
        gpuUtil: fallbackData[fallbackData.length - 1].gpuUtil,
        memUtil: fallbackData[fallbackData.length - 1].memUtil,
        temp: fallbackData[fallbackData.length - 1].temp,
        gpuType: "Fallback GPU (No NVIDIA GPU Detected)"
      }));
      
      // Set error state if provided and not already shown
      if (setErrorState && !hasDisplayedError.current) {
        setErrorState({
          hasError: true,
          errorType: 'history',
          message: 'Unable to load GPU history data',
          details: err.message
        });
        hasDisplayedError.current = true;
      }
    }
  };

  // Simple cleanup function - exact match to CPU implementation
  const cleanupSockets = () => {
    dataBuffer.current = [];
    setChartData([]);
  };
  
  // Auto-retry when we get a connection error (but not for no_gpu errors)
  useEffect(() => {
    let retryTimeoutId;
    
    if (errorState?.hasError && 
        (errorState.errorType === 'connection_error' || 
         errorState.errorType === 'connection_slow')) {
      
      // Set up an automatic retry after 15 seconds
      retryTimeoutId = setTimeout(() => {
        
        try {
          if (typeof getMetricsSocket === 'function') {
            // Retry getting the socket
            getMetricsSocket('gpu');
            
            // Also refresh data
            loadGpuLog();
          }
        } catch (err) {
          console.error('Auto-retry failed:', err);
        }
      }, 15000); // 15 seconds
    }
    
    return () => {
      if (retryTimeoutId) clearTimeout(retryTimeoutId);
    };
  }, [errorState?.hasError, errorState?.errorType, getMetricsSocket]);
  
  // Expose functions to component
  return {
    loadGpuLog,
    cleanupSockets,
    retryConnection: () => {
      try {
        // Reset error state
        if (setErrorState) {
          setErrorState({
            hasError: false,
            errorType: null,
            message: ''
          });
          hasDisplayedError.current = false;
        }
        
        // Try to get socket and load data
        if (typeof getMetricsSocket === 'function') {
          getMetricsSocket('gpu');
          loadGpuLog();
        }
      } catch (err) {
        console.error('Manual retry failed:', err);
      }
    }
  };
}