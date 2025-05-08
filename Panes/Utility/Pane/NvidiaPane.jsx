import PaneHeader from '../PaneHeader'
import GpuPerfGraph from '../../../Panels/panel-modules/GpuGraph/GpuPerfGraph'
import { useError } from '../../../Error-Handling/Diagnostics/ErrorNotificationSystem.jsx'


export default function NvidiaPane({ name = "NVIDIA GPU", status = "Active", logo }) {
  const { showError } = useError();
  
  //--------------------------------------------------
  // COMPONENT RENDERING
  //--------------------------------------------------
  return (
    <div className="bg-[#08170D]/30 backdrop-blur-sm rounded crt-border-green6 shadow-inner overflow-hidden w-full h-full flex flex-col">
      <PaneHeader name={name} status={status} logo={logo} />
     
      <GpuPerfGraph />
     
    </div>
  )
}
