import PaneHeader from './PaneHeader'
import PaneInternal from './PaneInternal'

export default function QdrantDashboardPane({ name, status, logo }) {
  return (
    <div className="w-full h-full bg-black rounded border border-green-600 shadow-inner overflow-hidden">
      <PaneHeader name={name} status={status} logo={logo} />
      <PaneInternal name={name} />
    </div>
  )
}
