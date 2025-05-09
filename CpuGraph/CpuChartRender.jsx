import React from 'react'
import {
  AreaChart, Area, LineChart, Line,
  XAxis, YAxis, Tooltip, CartesianGrid,
  ReferenceLine, ReferenceArea, ResponsiveContainer
} from 'recharts'
import { format } from 'date-fns'

export default function CpuChartRender({
  data,
  zoomState,
  zoomHandlers,
  viewMode,
  themeColors,
  glowIntensity,
  tooltip
}) {
  const displayData = zoomState.isZoomed
    ? data.filter(d => d.timestamp >= zoomState.left && d.timestamp <= zoomState.right)
    : data

  const sharedProps = {
    margin: { top: 10, right: 13, left: -20, bottom: 0 },
    data: displayData,
    onMouseDown: zoomHandlers.start,
    onMouseMove: zoomHandlers.move,
    onMouseUp: zoomHandlers.end
  }

  // NOTE: Removed renderReference() in favor of inlined ReferenceArea components
  // with better z-index and visibility settings

  const sharedElements = (
    <>
      <CartesianGrid stroke={themeColors.primary} strokeDasharray="2 2" opacity={0.2} />
      <XAxis
        dataKey="timestamp"
        tickFormatter={(ts) => format(new Date(ts * 1000), 'HH:mm:ss')}
        stroke={themeColors.primary}
        tick={{ fontSize: 9}}
        interval="preserveStartEnd"
        minTickGap={50}
        // domain={['dataMin', 'dataMax']}
        // type="number"
      />
      <YAxis
        stroke={themeColors.primary}
        tick={{ fontSize: 9, fill: themeColors.primary }}
        domain={['auto', 'auto']} 
        allowDecimals={false}
      />
      <Tooltip 
        content={tooltip} 
        formatter={(value, name, props) => {
          // Explicitly format values to ensure they're passed correctly to tooltip
          if (name === 'CPU' || name === 'cpu') {
            return [parseFloat(value).toFixed(1) + '%', 'CPU'];
          } 
          if (name === 'Memory' || name === 'memory') {
            return [parseFloat(value).toFixed(1) + '%', 'Memory'];
          }
          if (name === 'Temperature' || name === 'temperature') {
            return [parseFloat(value).toFixed(1) + '°C', 'Temperature'];
          }
          return [value, name];
        }}
      />
      <ReferenceLine y={80} stroke={themeColors.danger} strokeDasharray="3 3" />
    </>
  )

  if (viewMode === 'area') {
    return (
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart {...sharedProps}>
          <defs>
            <linearGradient id="cpuAreaFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={themeColors.primary} stopOpacity={0.8} />
              <stop offset="95%" stopColor={themeColors.primary} stopOpacity={0.1} />
            </linearGradient>
            <linearGradient id="memAreaFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={themeColors.secondary} stopOpacity={0.8} />
              <stop offset="95%" stopColor={themeColors.secondary} stopOpacity={0.2} />
            </linearGradient>
            <linearGradient id="tempAreaFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={themeColors.tertiary || '#ff9800'} stopOpacity={0.8} />
              <stop offset="95%" stopColor={themeColors.tertiary || '#ff9800'} stopOpacity={0.2} />
            </linearGradient>
            <filter id="areaGlow" height="300%" width="300%" x="-100%" y="-100%">
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
            dataKey="cpu"
            stroke={themeColors.primary}
            fill="url(#cpuAreaFill)"
            strokeWidth={2}
            name="CPU"
            filter="url(#areaGlow)"
            activeDot={{ r: 6, stroke: themeColors.primary, strokeWidth: 2, fill: '#081c08' }}
            isAnimationActive={true}
            animationDuration={500}
          />
          <Area
            type="monotone"
            dataKey="memory"
            stroke={themeColors.secondary}
            fill="url(#memAreaFill)"
            strokeWidth={1.0} // Make it even thicker for visibility
            name="Memory"
            strokeOpacity={1.0} // Make it fully visible
            fillOpacity={0.7} // Increase fill opacity
            activeDot={{ r: 5, stroke: themeColors.secondary, strokeWidth: 1, fill: '#081c08' }}
            isAnimationActive={true}
            animationDuration={500}
          />
          <Area
            type="monotone"
            dataKey="temperature"
            stroke={themeColors.tertiary || '#ff9800'}
            fill="url(#tempAreaFill)"
            strokeWidth={0.5}
            strokeDasharray="3 2"
            name="Temperature"
            strokeOpacity={0.8}
            fillOpacity={0.3}
            activeDot={{ r: 4, stroke: themeColors.tertiary || '#ff9800', strokeWidth: 2, fill: '#081c08' }}
            isAnimationActive={true}
            animationDuration={500}
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
                     />
        )}
        </AreaChart>
      </ResponsiveContainer>
    )
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart {...sharedProps}>
        <defs>
          <linearGradient id="cpuGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={themeColors.primary} stopOpacity={0.4} />
            <stop offset="95%" stopColor={themeColors.primary} stopOpacity={0} />
          </linearGradient>
          <linearGradient id="memGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={themeColors.secondary} stopOpacity={0.3} />
            <stop offset="95%" stopColor={themeColors.secondary} stopOpacity={0} />
          </linearGradient>
          <linearGradient id="tempGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={themeColors.tertiary || '#ff9800'} stopOpacity={0.3} />
            <stop offset="95%" stopColor={themeColors.tertiary || '#ff9800'} stopOpacity={0} />
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
          dataKey="cpu"
          stroke={themeColors.primary}
          strokeWidth={0.5}
          strokeDasharray="5 3"
          strokeOpacity={0.9}
          name="CPU"
          animationDuration={300}
          dot={false}
          activeDot={{ r: 4, stroke: themeColors.primary, strokeWidth: 2, fill: '#081c08' }}
        />
        <Line
          type="monotone"
          dataKey="memory"
          stroke={themeColors.secondary}
          strokeWidth={0.5} // Make it thicker for visibility
          name="Memory"
          animationDuration={300}
          dot={false}
          filter="url(#glow)"
          fill="none"
          strokeOpacity={1.0} // Make it fully visible
          activeDot={{ r: 4, stroke: themeColors.secondary, strokeWidth: 2, fill: '#081c08' }}
        />
        <Line
          type="monotone"
          dataKey="temperature"
          stroke={themeColors.tertiary || '#ff9800'}
          strokeWidth={0.5}
          strokeDasharray="3 2"
          name="Temperature"
          animationDuration={300}
          dot={false}
          filter="url(#glow)"
          fill="none"
          strokeOpacity={0.8}
          activeDot={{ r: 4, stroke: themeColors.tertiary || '#ff9800', strokeWidth: 2, fill: '#081c08' }}
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
                   />
        )}
      </LineChart>
    </ResponsiveContainer>
  )
}
