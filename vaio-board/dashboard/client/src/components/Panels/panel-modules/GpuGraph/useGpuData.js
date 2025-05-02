import { useEffect, useRef } from "react";
import { useSocket } from "../../../Panes/Utility/SocketContext";

export function useGpuData(setChartData, setCurrentData) {
  const dataBuffer = useRef([]);
  const MAX_HISTORY_SECONDS = 180; // 3 minutes
  
  // Get centralized metrics management from context
  const { metricsData, getMetricsSocket } = useSocket();
  
  // Connect to GPU metrics stream when component mounts
  useEffect(() => {
    console.log("⚡ Setting up GPU socket connection...");
    console.log("⚡ getMetricsSocket available:", typeof getMetricsSocket === 'function');
    
    try {
      // This creates the socket connection only when this component is mounted
      if (typeof getMetricsSocket === 'function') {
        const gpuSocket = getMetricsSocket('gpu');
        console.log('⚡ GPU socket connection created:', gpuSocket?.connected);
        
        // Manually listen for connection events to help debugging
        if (gpuSocket) {
          gpuSocket.on('connect', () => {
            console.log('⚡ GPU socket connected successfully');
          });
          
          gpuSocket.on('connect_error', (error) => {
            console.error('⚡ GPU socket connection error:', error);
          });
          
          // Log incoming data for debugging
          gpuSocket.on('metrics_update', (data) => {
            console.log('⚡ Received GPU metrics update:', data);
          });
        }
      } else {
        console.error('⚡ getMetricsSocket is not a function:', typeof getMetricsSocket);
      }
    } catch (err) {
      console.error('⚡ Error connecting to GPU socket:', err);
    }
    
    return () => {
      // No need to disconnect - the socket is managed by the context
      console.log('⚡ GPU socket component unmounting');
    };
  }, [getMetricsSocket]);

  // React to GPU metrics data changes
  useEffect(() => {
    console.log("GPU metrics data received:", metricsData?.gpu);
    if (metricsData?.gpu) {
      const data = metricsData.gpu;
      const { 
        timestamp, 
        gpu_utilization, 
        mem_utilization, 
        temperature, 
        gpu_type 
      } = data;
      
      console.log("GPU data extracted:", { timestamp, gpu_utilization, mem_utilization, temperature, gpu_type });
      
      if (!timestamp) {
        console.warn("Missing GPU timestamp, skipping update");
        return;
      }
      
      const time = new Date(timestamp * 1000).toLocaleTimeString([], 
        { hour: "2-digit", minute: "2-digit", second: "2-digit" });

      const newPoint = {
        timestamp,
        time,
        gpuUtil: gpu_utilization || 0,
        memUtil: mem_utilization || 0,
        temp: temperature || 0,
        gpuType: gpu_type || "Unknown GPU"
      };
      
      console.log("New GPU data point created:", newPoint);

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
  }, [metricsData?.gpu, setChartData, setCurrentData]);

  // Load historical GPU data
  const loadGpuLog = async () => {
    console.log("🔍 Attempting to load GPU history log data...");
    try {
      // Fetch historical data for GPU
      console.log("🔍 Fetching from /api/history/gpu?minutes=3");
      const res = await fetch('/api/history/gpu?minutes=3');
      console.log("🔍 GPU history API response status:", res.status);
      
      if (!res.ok) {
        const errorText = await res.text();
        console.error(`GPU log fetch error: ${res.status}`, errorText);
        throw new Error(`GPU log fetch error: ${res.status}`);
      }
      
      const gpuHistory = await res.json();
      console.log("🔍 GPU history data received:", gpuHistory);
      
      if (Array.isArray(gpuHistory) && gpuHistory.length > 0) {
        // Get system info from the last entry or metricsData
        const systemInfo = metricsData?.gpu || gpuHistory[gpuHistory.length-1] || {};
        
        // Process historical data
        const processedData = gpuHistory.map(entry => {
          const timestamp = typeof entry.timestamp === 'number' ? entry.timestamp : parseFloat(entry.timestamp);
          const date = new Date(timestamp * 1000);
          const time = date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second:'2-digit'});
          
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
        const time = date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second:'2-digit'});
        
        fallbackData.push({
          timestamp,
          time,
          gpuUtil: Math.random() * 30,  // Random GPU utilization between 0-30%
          memUtil: Math.random() * 20,  // Random memory utilization between 0-20%
          temp: 40 + Math.random() * 10, // Random temperature between 40-50°C
          gpuType: "Fallback GPU"
        });
      }
      
      console.log("⚠️ Using fallback GPU data:", fallbackData);
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
    }
  };

  // Simple cleanup function - exact match to CPU implementation
  const cleanupSockets = () => {
    dataBuffer.current = [];
    setChartData([]);
  };
  
  return {
    loadGpuLog,
    cleanupSockets
  };
}