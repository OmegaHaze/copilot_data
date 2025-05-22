import React from 'react'
import {
  LineChart, Line, AreaChart, Area,
  XAxis, YAxis, Tooltip, CartesianGrid,
  ReferenceLine, ReferenceArea, ResponsiveContainer
} from 'recharts'
import { format } from 'date-fns'

export default function ChartRenderer({
  data,
  zoomState,
  zoomHandlers,
  viewMode,
  themeColors,
  glowIntensity,
  hoverColor,
  tooltip
}) {
  const displayData = zoomState.isZoomed
    ? data.filter(d => d.timestamp >= zoomState.left && d.timestamp <= zoomState.right)
    : data

  const sharedProps = {
    margin: { top: 10, right: 15, left: -20, bottom: 0 },
    data: displayData,
    onMouseDown: zoomHandlers.start,
    onMouseMove: zoomHandlers.move,
    onMouseUp: zoomHandlers.end
  }

  const renderDefs = (type) => (
    <defs>
      <linearGradient id="temp" x1="0" y1="0" x2="0" y2="1">
        <stop offset="5%" stopColor={hoverColor} stopOpacity={type === 'area' ? 0.15 : 0.4} />
        <stop offset="95%" stopColor={hoverColor} stopOpacity={0} />
      </linearGradient>
      <linearGradient id="gpu" x1="0" y1="0" x2="0" y2="1">
        <stop offset="5%" stopColor={themeColors.secondary} stopOpacity={type === 'area' ? 0.12 : 0.3} />
        <stop offset="95%" stopColor={themeColors.secondary} stopOpacity={0} />
      </linearGradient>
      <linearGradient id="mem" x1="0" y1="0" x2="0" y2="1">
        <stop offset="5%" stopColor={themeColors.tertiary} stopOpacity={type === 'area' ? 0.1 : 0.2} />
        <stop offset="95%" stopColor={themeColors.tertiary} stopOpacity={0} />
      </linearGradient>
      <filter id="glow" height="300%" width="300%" x="-100%" y="-100%">
        <feGaussianBlur stdDeviation={glowIntensity} result="coloredBlur" />
        <feMerge>
          <feMergeNode in="coloredBlur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
    </defs>
  )

  // NOTE: Removed renderReference() function as we now inline the ReferenceArea
  // component with z-index styling directly in each chart type for better visibility

  const renderXAxis = () => (
    <XAxis
      dataKey="timestamp"
      tickFormatter={(ts) => format(new Date(ts), 'hh:mm:ssa')}
      stroke={themeColors.primary}
      tick={{ fontSize: 10 }}
      interval="preserveStartEnd"
      minTickGap={50}
    />
  )

  const renderYAxis = () => (
    <YAxis stroke={themeColors.primary} tick={{ fontSize: 10, fill: themeColors.primary }} />
  )

  const renderAreaChart = () => (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart {...sharedProps}>
        {renderDefs('area')}
        <CartesianGrid stroke={themeColors.primary} strokeDasharray="2 2" opacity={0.2} />
        {renderXAxis()}
        {renderYAxis()}
        <Tooltip content={tooltip} />
        <ReferenceLine y={80} stroke={themeColors.danger} strokeDasharray="3 3" />
        <Area
          type="monotone" dataKey="temp"
          stroke={hoverColor} fill="url(#temp)" strokeWidth={1.5}
          filter="url(#glow)" activeDot={{ r: 4, stroke: hoverColor, strokeWidth: 2, fill: '#081c08' }}
          isAnimationActive animationDuration={300} strokeOpacity={0.8}
        />
        <Area
          type="monotone" dataKey="gpuUtil"
          stroke={themeColors.secondary} fill="url(#gpu)" strokeWidth={1.25}
          filter="url(#glow)" activeDot={{ r: 3.5, stroke: themeColors.secondary, strokeWidth: 2, fill: '#081c08' }}
          isAnimationActive animationDuration={300} strokeOpacity={0.7}
        />
        <Area
          type="monotone" dataKey="memUtil"
          stroke={themeColors.tertiary} fill="url(#mem)" strokeWidth={1}
          filter="url(#glow)" activeDot={{ r: 3, stroke: themeColors.tertiary, strokeWidth: 2, fill: '#081c08' }}
          isAnimationActive animationDuration={300} strokeOpacity={0.6}
        />
        {zoomState.refAreaLeft && zoomState.refAreaRight && (
          <ReferenceArea
            x1={zoomState.refAreaLeft}
            x2={zoomState.refAreaRight}
            strokeWidth={0.5}
            strokeOpacity={0.7}
            stroke="rgb(67, 200, 110)"
            fill="rgb(67, 200, 110)"
            fillOpacity={0.5}
          />
        )}
      </AreaChart>
    </ResponsiveContainer>
  )

  const renderLineChart = () => (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart {...sharedProps}>
        {renderDefs('line')}
        <CartesianGrid stroke={themeColors.primary} strokeDasharray="2 2" opacity={0.2} />
        {renderXAxis()}
        {renderYAxis()}
        <Tooltip content={tooltip} />
        <ReferenceLine y={80} stroke={themeColors.danger} strokeDasharray="3 3" />
        <Line
          type="monotone" dataKey="temp" stroke={hoverColor} strokeWidth={2}
          dot={false} animationDuration={300} filter="url(#glow)"
          activeDot={{ r: 4, stroke: hoverColor, strokeWidth: 1, fill: '#081c08' }}
        />
        <Line
          type="monotone" dataKey="gpuUtil" stroke={themeColors.secondary} strokeWidth={1.5}
          strokeDasharray="5 2" dot={false} animationDuration={300}
          activeDot={{ r: 4, stroke: themeColors.secondary, strokeWidth: 1, fill: '#081c08' }}
        />
        <Line
          type="monotone" dataKey="memUtil" stroke={themeColors.tertiary} strokeWidth={1.5}
          strokeDasharray="3 3" dot={false} animationDuration={300}
          activeDot={{ r: 4, stroke: themeColors.tertiary, strokeWidth: 1, fill: '#081c08' }}
        />
        {zoomState.refAreaLeft && zoomState.refAreaRight && (
          <ReferenceArea
            x1={zoomState.refAreaLeft}
            x2={zoomState.refAreaRight}
            strokeWidth={0.5}
            strokeOpacity={0.7}
            stroke="rgb(67, 200, 110)"
            fill="rgb(67, 200, 110)"
            fillOpacity={0.5}
          />
        )}
      </LineChart>
    </ResponsiveContainer>
  )

  return viewMode === 'area' ? renderAreaChart() : renderLineChart()
}
