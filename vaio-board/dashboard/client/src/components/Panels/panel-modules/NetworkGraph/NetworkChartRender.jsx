// Create a new file: /workspace/dashboard/client/src/components/Panels/panel-modules/NetworkGraph/NetworkChartRender.jsx
import React from 'react'
import {
  LineChart, Line, AreaChart, Area,
  XAxis, YAxis, Tooltip, CartesianGrid, 
  ReferenceLine, ReferenceArea, ResponsiveContainer
} from 'recharts';
import { format } from 'date-fns'

// Helper to format bits to human-readable network speeds - skipping Kbps
const formatNetworkSpeed = (bits) => {
  if (bits === undefined || bits === null || isNaN(bits)) return '0 bps';
  
  const absValue = Math.abs(bits);
  
  if (absValue < 1024) return bits.toFixed(1) + ' bps';
  // Skip Kbps and convert directly to Mbps for better readability
  else if (absValue < 1024 * 1024 * 1024) return (bits / (1024 * 1024)).toFixed(3) + ' Mbps';
  else return (bits / (1024 * 1024 * 1024)).toFixed(2) + ' Gbps';
};

export default function NetworkChartRender({
  data,
  zoomState,
  zoomHandlers,
  viewMode,
  themeColors,
  glowIntensity,
  tooltip,
  selectedInterface
}) {
  // Debug mode - set to false by default in production
  const DEBUG = false;
  
  // Data is already filtered for selected interface in useNetworkData hook
  const displayData = zoomState.isZoomed
    ? data.filter(d => d.timestamp >= zoomState.left && d.timestamp <= zoomState.right)
    : data;
    
  // Determine the best scale (bits, Mbits, Gbits) for the data - no Kbits
  const findAppropriateScale = (data) => {
    if (!data || data.length === 0) return { unit: 'Mb', divisor: 1024 };
    
    let maxValue = 0;
    data.forEach(item => {
      maxValue = Math.max(maxValue, item.rxKB || 0, item.txKB || 0);
    });
    
    // Always display in Mb or Gb units - never Kb
    
    if (DEBUG && maxValue > 0) {
      console.log(`Network graph max value: ${(maxValue/1024).toFixed(2)} Mbits, ${(maxValue/(1024*1024)).toFixed(4)} Gbits)`);
    }
    
    // Only bits for extremely small values, otherwise straight to Mb
    if (maxValue < 0.1) return { unit: 'bits', divisor: 1/1024 }; // Show tiny values in bits
    // For all normal values under 500Mbps, show Mbps
    if (maxValue < 500 * 1024) return { unit: 'Mb', divisor: 1024 }; // Show in Mbits
    // For anything over 500Mbps, show Gbps
    return { unit: 'Gb', divisor: 1024 * 1024 };                // Show in Gbits
  };
  
  const scale = findAppropriateScale(displayData);

  const sharedProps = {
    margin: { top: 10, right: 13, left: -20, bottom: 0 },
    data: displayData,
    onMouseDown: zoomHandlers.start,
    onMouseMove: zoomHandlers.move,
    onMouseUp: zoomHandlers.end
  }


  // Calculate reference line values from the data
  const calculateReferenceValues = () => {
    if (!displayData || displayData.length === 0) {
      return { avg: { rx: 50000, tx: 25000 }, max: { rx: 1048576, tx: 524288 } };
    }
    
    // Calculate averages and max values from the data
    let sumRx = 0, sumTx = 0;
    let maxRx = 0, maxTx = 0;
    
    displayData.forEach(item => {
      // Use rxKB and txKB from the transformed data
      sumRx += item.rxKB || 0;
      sumTx += item.txKB || 0;
      maxRx = Math.max(maxRx, item.rxKB || 0);
      maxTx = Math.max(maxTx, item.txKB || 0);
    });
    
    const avgRx = sumRx / displayData.length;
    const avgTx = sumTx / displayData.length;
    
    return { 
      avg: { rx: avgRx, tx: avgTx }, 
      max: { rx: maxRx, tx: maxTx } 
    };
  };
  
  const referenceValues = calculateReferenceValues();

  const sharedElements = (
    <>
      <CartesianGrid stroke={themeColors.primary} strokeDasharray="2 2" opacity={0.2} />
      <XAxis
        dataKey="timestamp"
        tickFormatter={(ts) => format(new Date(ts * 1000), 'HH:mm:ss')}
        stroke={themeColors.primary}
        tick={{ fontSize: 9 }}
        interval="preserveStartEnd"
        minTickGap={50}
      />
      <YAxis
        yAxisId="left"
        stroke={themeColors.primary}
        tick={{ fontSize: 9, fill: themeColors.primary }}
        tickFormatter={(value) => {
          // Value is in Kbits, convert according to current scale
          const scaledValue = value / scale.divisor;
          if (DEBUG && Math.abs(value) > 0.01) {
            console.log(`Y-axis tick: ${value}Kb => ${scaledValue.toFixed(2)} ${scale.unit}`);
          }
          return scaledValue.toFixed(1) + ' ' + scale.unit;
        }}
        domain={[0, dataMax => {
          // Get the maximum value in the data for dynamic scaling
          let maxDataValue = 0;
          if (displayData && displayData.length > 0) {
            displayData.forEach(item => {
              maxDataValue = Math.max(maxDataValue, item.rxKB || 0, item.txKB || 0);
            });
          }
          
          // Calculate a nice rounded maximum value based on the actual data
          // This is key to making the Y-axis scale properly like the CPU graph
          const scaledMax = maxDataValue / scale.divisor; // Convert to display units
          
          // Calculate a nice rounded maximum with enough headroom
          let niceMax;
          
          if (scale.unit === 'bits') {
            niceMax = Math.ceil(scaledMax * 1.2); // 20% headroom
          } else if (scale.unit === 'Mb') {
            // For Mb values, round to the next nice value based on magnitude
            if (scaledMax < 1) niceMax = 1;
            else if (scaledMax < 5) niceMax = 5;
            else if (scaledMax < 10) niceMax = 10;
            else if (scaledMax < 25) niceMax = 25; 
            else if (scaledMax < 50) niceMax = 50;
            else if (scaledMax < 100) niceMax = 100;
            else niceMax = Math.ceil(scaledMax / 100) * 100; // Round to next 100
          } else { // Gb
            if (scaledMax < 0.5) niceMax = 0.5;
            else if (scaledMax < 1) niceMax = 1;
            else if (scaledMax < 2) niceMax = 2;
            else if (scaledMax < 5) niceMax = 5;
            else if (scaledMax < 10) niceMax = 10;
            else niceMax = Math.ceil(scaledMax); 
          }
          
          // Convert back to Kbits for the chart's internal calculations
          const finalMaxKb = niceMax * (scale.unit === 'bits' ? 1/1024 : 
                             scale.unit === 'Mb' ? 1024 : 
                             1024 * 1024);
          
          if (DEBUG) {
            console.log(`Y-axis dynamic scaling: maxData=${maxDataValue.toFixed(2)}Kb, scaled=${scaledMax.toFixed(2)}${scale.unit}, rounded=${niceMax}${scale.unit}, final=${finalMaxKb}Kb`);
          }
          
          return finalMaxKb;
        }]}
        allowDataOverflow={false}
      />
      <Tooltip 
        content={tooltip} 
        formatter={(value, name, props) => {
          // Format values for tooltip to ensure they display correctly
          if (name === 'Download' || name === 'rx' || name === 'rxKB') {
            // Value is displayed in Kbits in the chart (from rxKB property)
            // We need to convert to bits for TooltipNet's formatNetworkSpeed
            const bitValue = value * 1024; // Convert Kbits to bits
            return [bitValue, 'Download']; 
          }
          if (name === 'Upload' || name === 'tx' || name === 'txKB') {
            // Value is displayed in Kbits in the chart (from txKB property)
            // We need to convert to bits for TooltipNet's formatNetworkSpeed
            const bitValue = value * 1024; // Convert Kbits to bits
            if (DEBUG) {
              console.log(`Tooltip TX: ${value} Kbits → ${bitValue} bits`);
            }
            return [bitValue, 'Upload']; 
          }
          return [value, name];
        }}
      />
      
      {/* Reference lines for download (rx) */}
      <ReferenceLine
        y={referenceValues.avg.rx}
        yAxisId="left"
        stroke={themeColors.primary}
        strokeWidth={0.5}
        strokeDasharray="3 3"
        strokeOpacity={0.4}
        label={{
          position: 'left',
          value: `Avg DL: ${(referenceValues.avg.rx / scale.divisor).toFixed(1)} ${scale.unit}`,
          fontSize: 9,
          fill: themeColors.primary,
          opacity: 0.8,
          style: { zIndex: 50 }
        }}
      />
      
      {/* Reference lines for upload (tx) */}
      <ReferenceLine
        y={referenceValues.avg.tx}
        yAxisId="left"
        stroke={themeColors.secondary}
        strokeWidth={0.5}
        strokeDasharray="3 3"
        strokeOpacity={0.4}
        label={{
          position: 'left',
          value: `Avg UL: ${(referenceValues.avg.tx / scale.divisor).toFixed(1)} ${scale.unit}`,
          fontSize: 9,
          fill: themeColors.secondary,
          opacity: 0.8,
          style: { zIndex: 50 }
        }}
      />
      
      {/* Dynamic bandwidth threshold based on data */}
      {(() => {
        // Calculate a nice round threshold value based on maximum
        const maxValue = Math.max(referenceValues.max.rx, referenceValues.max.tx);
        let thresholdValue = 0;
        
        if (scale.unit === 'bits') thresholdValue = 500; // 500 bits
        // No Kb option anymore
        else if (scale.unit === 'Mb') thresholdValue = 50; // 50 Mb
        else thresholdValue = 1; // 1 Gb
        
        // Convert threshold to Kbits for the chart
        const thresholdKb = thresholdValue * (scale.unit === 'bits' ? 1/1024 : 
                            scale.unit === 'Kb' ? 1 : 
                            scale.unit === 'Mb' ? 1024 : 1024 * 1024);
        
        return (
          <ReferenceLine
            y={thresholdKb}
            yAxisId="left"
            stroke="#fff"
            strokeDasharray="2 4"
            strokeWidth={0.5}
            strokeOpacity={0.3}
            label={{
              position: 'right',
              value: `${thresholdValue} ${scale.unit}`,
              fontSize: 8,
              fill: '#fff',
              opacity: 0.7,
              style: { zIndex: 10 }
            }}
          />
        );
      })()}
    </>
  );

  if (viewMode === 'area') {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart {...sharedProps}>
        <defs>
          <linearGradient id="rxGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={themeColors.primary} stopOpacity={0.8} />
            <stop offset="95%" stopColor={themeColors.primary} stopOpacity={0.1} />
          </linearGradient>
          <linearGradient id="txGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={themeColors.secondary} stopOpacity={0.8} />
            <stop offset="95%" stopColor={themeColors.secondary} stopOpacity={0.2} />
          </linearGradient>
          <filter id="glow" height="300%" width="300%" x="-100%" y="-100%">
            <feGaussianBlur stdDeviation={glowIntensity} result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        {sharedElements}
        <Area
          type="monotone"
          dataKey="rxKB"
          yAxisId="left"
          stroke={themeColors.primary}
          fill="url(#rxGradient)"
          strokeWidth={2}
          name="Download"
          isAnimationActive={true}
          animationDuration={500}
          dot={false}
          filter="url(#glow)"
          activeDot={{ r: 6, stroke: themeColors.primary, strokeWidth: 2, fill: '#081c08' }}
        />
        <Area
          type="monotone"
          dataKey="txKB"
          yAxisId="left"
          stroke={themeColors.secondary}
          fill="url(#txGradient)"
          strokeWidth={1.0}
          strokeDasharray="5 3"
          name="Upload"
          strokeOpacity={1.0}
          fillOpacity={0.7}
          isAnimationActive={true}
          animationDuration={500}
          dot={false}
          filter="url(#glow)"
          activeDot={{ r: 5, stroke: themeColors.secondary, strokeWidth: 1, fill: '#081c08' }}
        />
        {/* Add the missing ReferenceArea for zoom selection in AreaChart mode */}
        {zoomState.refAreaLeft && zoomState.refAreaRight && (
          <ReferenceArea
            x1={zoomState.refAreaLeft}
            x2={zoomState.refAreaRight}
            strokeWidth={0.5}
            strokeOpacity={0.5}
            stroke="rgb(67, 200, 110)"
            fill="rgb(67, 200, 110)" 
            fillOpacity={0.5}
            isFront={true} /* Critical: Use isFront to ensure visibility */
          />
        )}
      </AreaChart>
    </ResponsiveContainer>
  );
  }

  // Default line chart
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart {...sharedProps}>
        <defs>
          <linearGradient id="rxGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={themeColors.primary} stopOpacity={0.4} />
            <stop offset="95%" stopColor={themeColors.primary} stopOpacity={0} />
          </linearGradient>
          <linearGradient id="txGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={themeColors.secondary} stopOpacity={0.3} />
            <stop offset="95%" stopColor={themeColors.secondary} stopOpacity={0} />
          </linearGradient>
          <filter id="glow" height="300%" width="300%" x="-100%" y="-100%">
            <feGaussianBlur stdDeviation={glowIntensity} result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>          
        </defs>
        {sharedElements}
        <Line
          type="monotone"
          dataKey="rxKB"
          yAxisId="left"
          stroke={themeColors.primary}
          strokeWidth={0.5}
          name="Download"
          isAnimationActive={true}
          animationDuration={300}
          dot={false}
          filter="url(#glow)"
          activeDot={{ r: 4, stroke: themeColors.primary, strokeWidth: 2, fill: '#081c08' }}
        />
        <Line
          type="monotone"
          dataKey="txKB"
          yAxisId="left"
          stroke={themeColors.secondary}
          strokeWidth={0.5}
          strokeDasharray="5 3"
          name="Upload"
          isAnimationActive={true}
          animationDuration={300}
          dot={false}
          filter="url(#glow)"
          activeDot={{ r: 4, stroke: themeColors.secondary, strokeWidth: 1, fill: '#081c08' }}
        />
        {zoomState.refAreaLeft && zoomState.refAreaRight && (
          <ReferenceArea
            x1={zoomState.refAreaLeft}
            x2={zoomState.refAreaRight}
            strokeWidth={0.5} 
            strokeOpacity={0.5}
            stroke="rgb(67, 200, 110)"
            fill="rgb(67, 200, 110)"
            fillOpacity={0.5}
            isFront={true} /* Replace style={{zIndex}} with isFront */
          />
        )}
      </LineChart>
    </ResponsiveContainer>
  );
}