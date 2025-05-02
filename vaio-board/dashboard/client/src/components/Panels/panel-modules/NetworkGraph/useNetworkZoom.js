import { useState } from 'react'

export function useNetworkZoom(chartData) {
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

    // Network has rxKB and txKB instead of cpu
    let rxMin = Infinity, rxMax = -Infinity, txMin = Infinity, txMax = -Infinity

    for (const d of filtered) {
      if (d.rxKB < rxMin) rxMin = d.rxKB
      if (d.rxKB > rxMax) rxMax = d.rxKB
      if (d.txKB < txMin) txMin = d.txKB
      if (d.txKB > txMax) txMax = d.txKB
    }
    
    // Use the maximum of both metrics
    const min = Math.min(rxMin, txMin)
    const max = Math.max(rxMax, txMax)

    return [Math.max(0, min - 5), max + 5]
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
