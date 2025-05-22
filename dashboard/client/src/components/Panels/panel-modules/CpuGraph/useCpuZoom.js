import { useState } from 'react'

export function useCpuZoom(chartData) {
  const [zoomState, setZoomState] = useState({
    left: null,
    right: null,
    refAreaLeft: '',
    refAreaRight: '',
    top: null,
    bottom: null,
    isZoomed: false
  })

  const getAxisYDomain = (from, to) => {
    if (!chartData?.length) return [0, 100]
    const filtered = chartData.filter(d => d.timestamp >= from && d.timestamp <= to)
    if (!filtered.length) return [0, 100]

    let cpuMin = Infinity, cpuMax = -Infinity

    for (const d of filtered) {
      if (d.cpu < cpuMin) cpuMin = d.cpu
      if (d.cpu > cpuMax) cpuMax = d.cpu
    }

    return [Math.max(0, cpuMin - 5), cpuMax + 5]
  }

  const start = (e) => {
    if (e?.activeLabel) {
      setZoomState(prev => ({ ...prev, refAreaLeft: e.activeLabel }))
    }
  }

  const move = (e) => {
    if (e?.activeLabel && zoomState.refAreaLeft) {
      setZoomState(prev => ({ ...prev, refAreaRight: e.activeLabel }))
    }
  }

  const end = () => {
    let { refAreaLeft, refAreaRight } = zoomState
    if (!refAreaLeft || !refAreaRight) {
      setZoomState(prev => ({ ...prev, refAreaLeft: '', refAreaRight: '' }))
      return
    }
    if (refAreaLeft > refAreaRight) [refAreaLeft, refAreaRight] = [refAreaRight, refAreaLeft]
    const [bottom, top] = getAxisYDomain(refAreaLeft, refAreaRight)
    setZoomState({
      refAreaLeft: '',
      refAreaRight: '',
      left: refAreaLeft,
      right: refAreaRight,
      top,
      bottom,
      isZoomed: true
    })
  }

  const reset = () => {
    setZoomState({
      left: 'dataMin',
      right: 'dataMax',
      refAreaLeft: '',
      refAreaRight: '',
      top: 'dataMax+5',
      bottom: 0,
      isZoomed: false
    })
  }

  return {
    zoomState,
    zoomHandlers: { start, move, end },
    handleZoomReset: reset
  }
}
