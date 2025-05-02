// // filepath: /home/vaio/vaio-board/dashboard/client/src/components/Error-Handling/DebugPopup.jsx
// import React, { useState, useEffect } from 'react';

// export const DebugContext = React.createContext({
//   showDebug: () => {},
//   hideDebug: () => {},
// });

// export const DebugProvider = ({ children }) => {
//   const [message, setMessage] = useState('');
//   const [visible, setVisible] = useState(false);
//   const [type, setType] = useState('info'); // 'info', 'error', 'warning', 'success'

//   const showDebug = (msg, msgType = 'info', duration = 5000) => {
//     setMessage(msg);
//     setType(msgType);
//     setVisible(true);
    
//     if (duration > 0) {
//       setTimeout(hideDebug, duration);
//     }
//   };

//   const hideDebug = () => {
//     setVisible(false);
//   };

//   return (
//     <DebugContext.Provider value={{ showDebug, hideDebug }}>
//       {children}
//       {visible && <DebugPopup message={message} type={type} onClose={hideDebug} />}
//     </DebugContext.Provider>
//   );
// };

// export default function DebugPopup({ message, type = 'info', onClose }) {
//   const [isVisible, setIsVisible] = useState(true);
  
//   // Apply theme-based styling based on message type
//   const getTypeStyles = () => {
//     switch(type) {
//       case 'error':
//         return 'bg-red-900/40 border-red-600 text-red-300';
//       case 'warning':
//         return 'bg-yellow-900/40 border-yellow-600 text-yellow-300';
//       case 'success':
//         return 'bg-green-900/40 border-green-600 text-green-300';
//       case 'info':
//       default:
//         return 'bg-green-900/40 border-green-600 text-green-300'; // Default to green theme
//     }
//   };

//   useEffect(() => {
//     const timeout = setTimeout(() => {
//       setIsVisible(false);
//       setTimeout(onClose, 300); // Wait for animation to complete
//     }, 5000);
    
//     return () => clearTimeout(timeout);
//   }, [onClose]);

//   return (
//     <div className={`fixed top-2 left-1/2 transform -translate-x-1/2 z-50 transition-all duration-300 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}>
//       <div className={`h-10 flex items-center justify-between px-4 py-1 rounded 
//                       ${getTypeStyles()} border scanlines 
//                       shadow-lg crt-glow min-w-[300px] max-w-[600px]`}>
//         <div className="flex-1 font-mono text-xs typing-line">
//           {message || 'Debug information'}
//         </div>
//         <button 
//           onClick={onClose}
//           className="text-xs ml-4 hover-cursor opacity-70 hover:opacity-100"
//         >
//           ×
//         </button>
//       </div>
//     </div>
//   );
// }
