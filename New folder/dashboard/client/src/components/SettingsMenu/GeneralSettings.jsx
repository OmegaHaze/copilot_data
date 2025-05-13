import React from 'react'
import SysInfo from '../Panels/panel-modules/SysInformantion'
import SysGration from '../Panels/panel-modules/MlEnvironment'
import CpuGraph from '../Panels/panel-modules/CpuGraph/CPUGraph'

export default function GeneralSettings() {
  return (
    <div className="h-full p-2 overflow-y-auto bg-black/70 backdrop-blur-sm">
      <h3 className="text-green-200 text-lg font-medium border-b border-green-800 pb-3 mb-4">
        System Information
      </h3>
      
      <div className="border border-green-800/50 rounded bg-black/30 p-4 mb-4">
        <h4 className="text-green-300 font-bold mb-3 border-b border-green-800/50 pb-1">
          CPU Usage
        </h4>
        <CpuGraph />
      </div>
      
      <div className="border border-green-800/50 rounded bg-black/30 p-4 mb-4">
        <h4 className="text-green-300 font-bold mb-3 border-b border-green-800/50 pb-1">
          System Details
        </h4>
        <SysInfo />
      </div>
      
      <div className="border border-green-800/50 rounded bg-black/30 p-4 mb-4">
        <h4 className="text-green-300 font-bold mb-3 border-b border-green-800/50 pb-1">
          System Integration
        </h4>
        <SysGration />
      </div>
    </div>
  )
}