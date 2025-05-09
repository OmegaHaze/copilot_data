// filepath: /dashboard/client/src/components/Panels/panel-modules/CpuGraph/useCpuData.js

import { useEffect, useRef } from "react";
import { useEnvSocket } from "../../../Panes/Utility/Context/EnvSocketContext";

export function useCpuData(setChartData, setCurrentData) {
  const dataBuffer = useRef([]);
  const MAX_HISTORY_SECONDS = 120; // 2 minutes
  
  // Get centralized metrics management from context
  const { metricsData, getMetricsSocket } = useEnvSocket();
  
  // Connect to CPU metrics stream when component mounts
  useEffect(() => {
    try {
      // This creates the socket connection only when this component is mounted
      if (typeof getMetricsSocket === 'function') {
        getMetricsSocket('cpu');
      } else {
        console.error('getMetricsSocket is not a function:', typeof getMetricsSocket);
      }
    } catch (err) {
      console.error('Error connecting to CPU socket:', err);
    }
    
    return () => {
      // No need to disconnect - the socket is managed by the context
    };
  }, [getMetricsSocket]);

  // React to CPU metrics data changes
  useEffect(() => {
    if (metricsData?.cpu) {
      const data = metricsData.cpu;
      const { 
        timestamp, 
        cpu_usage, 
        memory_usage, 
        cpu_temperature, 
        cpu_model, 
        cpu_cores, 
        total_memory_gb 
      } = data;
      
      if (!timestamp) return;
      
      const time = new Date(timestamp * 1000).toLocaleTimeString('en-US', 
        { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true });

      const newPoint = {
        timestamp,
        time,
        cpu: cpu_usage || 0,
        memory: memory_usage || 0,
        temperature: cpu_temperature || 0,
        cpuModel: cpu_model || "AMD CPU",
        cpuCores: cpu_cores || 0,
        totalMemoryGB: total_memory_gb || 0
      };

      dataBuffer.current.push(newPoint);

      const now = Math.floor(Date.now() / 1000);
      dataBuffer.current = dataBuffer.current.filter(
        (point) => point.timestamp >= now - MAX_HISTORY_SECONDS
      );

      setChartData([...dataBuffer.current]);

      setCurrentData(prev => ({
        ...prev,
        cpu: cpu_usage || 0,
        memory: memory_usage || 0,
        temperature: cpu_temperature || 0,
        cpuModel: cpu_model || "AMD CPU",
        cpuCores: cpu_cores || 0,
        totalMemoryGB: total_memory_gb || 0
      }));
    }
  }, [metricsData?.cpu, setChartData, setCurrentData]);

  // Load historical CPU data
  const loadCpuLog = async () => {
    try {
      // Fetch historical data for CPU
      const res = await fetch('/api/history/cpu?minutes=3');
      if (!res.ok) throw new Error(`CPU log fetch error: ${res.status}`);
      
      const cpuHistory = await res.json();
      
      if (Array.isArray(cpuHistory) && cpuHistory.length > 0) {
        // Get system info from the last entry or metricsData
        const systemInfo = metricsData?.cpu || cpuHistory[cpuHistory.length-1] || {};
        
        // Process historical data
        const processedData = cpuHistory.map(entry => {
          const timestamp = typeof entry.timestamp === 'number' ? entry.timestamp : parseFloat(entry.timestamp);
          const date = new Date(timestamp * 1000);
          const time = date.toLocaleTimeString('en-US', {hour: '2-digit', minute:'2-digit', second:'2-digit', hour12: true});
          
          const data = entry.data || entry; // Handle both data formats
          
          // Return a single properly formatted data point
          return {
            timestamp,
            time,
            cpu: data.cpu_usage || 0,
            memory: data.memory_usage || 0,
            temperature: data.cpu_temperature || 0,
            cpuModel: entry.cpu_model || systemInfo.cpu_model || "",
            cpuCores: entry.cpu_cores || systemInfo.cpu_cores || 0,
            totalMemoryGB: entry.total_memory_gb || systemInfo.total_memory_gb || 0
          };
        }).sort((a, b) => a.timestamp - b.timestamp);
        
        // Update chart data with historical values
        dataBuffer.current = processedData;
        setChartData([...processedData]);
      }
    } catch (err) {
      console.error('[CpuData] Fetch log failed:', err);
    }
  };

  // Simple cleanup function
  const cleanupSockets = () => {
    dataBuffer.current = [];
    setChartData([]);
  };
  
  return {
    loadCpuLog,
    cleanupSockets
  };
}
