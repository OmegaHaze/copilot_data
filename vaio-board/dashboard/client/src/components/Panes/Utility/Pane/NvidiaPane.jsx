import PaneHeader from '../PaneHeader'
import GpuPerfGraph from '../../../Panels/panel-modules/GpuGraph/GpuPerfGraph'
import ErrorBoundary from '../../../Error-Handling/ErrorBoundary'


export default function NvidiaPane({ name = "NVIDIA GPU", status = "Active", logo }) {
  
  //--------------------------------------------------
  // COMPONENT RENDERING
  //--------------------------------------------------
  return (
    <div className="bg-[#08170D]/30 backdrop-blur-sm rounded crt-border-green6 shadow-inner overflow-hidden w-full h-full flex flex-col">
      <PaneHeader name={name} status={status} logo={logo} />
     
      {/* Wrap the GPU graph in an error boundary to catch any React errors */}
      <ErrorBoundary componentName="GpuPerfGraph" showStack={true}>
        <GpuPerfGraph/>
      </ErrorBoundary>
     
    </div>
  )
}
