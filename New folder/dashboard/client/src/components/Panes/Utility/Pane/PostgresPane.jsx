// import PaneHeader from '../PaneHeader'
// import { useEffect, useRef } from 'react'
// import { useSocket } from '../Context/SocketContext.jsx'

// export default function PostgresPane({ name, status, logo }) {
//   const { logStreams } = useSocket();
//   const terminalRef = useRef(null);
//   const logs = logStreams?.postgres || '';

//   useEffect(() => {
//     const terminal = terminalRef.current
//     if (terminal) {
//       terminal.scrollTop = terminal.scrollHeight
//     }
//   }, [logs])

//   return (
//     <div className="w-full h-full bg-black rounded border border-green-600 shadow-inner overflow-hidden flex flex-col">
//       <PaneHeader name={name} status={status} logo={logo} />
 
//       <div
//         ref={terminalRef}
//         className="flex-grow overflow-y-auto mt-1 text-green-200 bg-black border-t border-green-700 p-2 scroll-panel text-[10px] leading-tight font-mono whitespace-pre-wrap shadow-inner"
//       >
//         {logs.length > 0 
//           ? <div dangerouslySetInnerHTML={{ __html: logs }} />
//           : '░░░ Awaiting output ░░░'}
//       </div>
//     </div>
//   )
// }
