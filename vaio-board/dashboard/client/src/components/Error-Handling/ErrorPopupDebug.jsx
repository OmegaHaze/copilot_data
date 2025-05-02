// // filepath: /home/vaio/vaio-board/dashboard/client/src/components/Error-Handling/ErrorPopupDebug.jsx
// import React, { useState, useEffect, createContext, useContext } from 'react';

// // Create debug context
// export const DebugContext = createContext({
//   showDebug: () => {},
//   hideDebug: () => {},
//   messages: []
// });

// // Hook to use the debug context
// export const useDebug = () => useContext(DebugContext);

// // Debug provider component
// export const DebugProvider = ({ children }) => {
//   const [messages, setMessages] = useState([]);

//   const showDebug = (message, type = 'info', duration = 5000) => {
//     const id = Date.now();
//     const newMessage = { id, message, type, createdAt: new Date() };
    
//     setMessages(prev => [newMessage, ...prev]);
    
//     if (duration > 0) {
//       setTimeout(() => {
//         hideDebug(id);
//       }, duration);
//     }

//     // Log to console for additional visibility
//     console.log(`[DEBUG ${type.toUpperCase()}]:`, message);
//     return id;
//   };

//   const hideDebug = (id) => {
//     setMessages(prev => prev.filter(msg => msg.id !== id));
//   };

//   return (
//     <DebugContext.Provider value={{ showDebug, hideDebug, messages }}>
//       {children}
//       <ErrorPopupDebug messages={messages} onClose={hideDebug} />
//     </DebugContext.Provider>
//   );
// };

// // Main debug popup component
// export default function ErrorPopupDebug({ messages, onClose }) {
//   if (!messages.length) return null;
  
//   return (
//     <div className="fixed top-2 left-1/2 transform -translate-x-1/2 z-50 flex flex-col gap-2">
//       {messages.map(msg => (
//         <DebugMessage 
//           key={msg.id}
//           id={msg.id}
//           message={msg.message}
//           type={msg.type}
//           onClose={onClose}
//         />
//       ))}
//     </div>
//   );
// }

// // Individual debug message component with effects
// function DebugMessage({ id, message, type, onClose }) {
//   const [isVisible, setIsVisible] = useState(false);
  
//   // Get theme styling based on message type
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
  
//   // Animation entry effect
//   useEffect(() => {
//     // Small delay to trigger the CSS transition
//     const timer = setTimeout(() => {
//       setIsVisible(true);
//     }, 10);
//     return () => clearTimeout(timer);
//   }, []);
  
//   // Handle close
//   const handleClose = () => {
//     setIsVisible(false);
//     // Wait for exit animation
//     setTimeout(() => {
//       onClose(id);
//     }, 300);
//   };
  
//   return (
//     <div 
//       className={`transition-all duration-300 transform ${
//         isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'
//       }`}
//     >
//       <div 
//         className={`h-10 flex items-center justify-between px-4 py-1 rounded 
//                   ${getTypeStyles()} border scanlines 
//                   shadow-lg crt-glow min-w-[300px] max-w-[600px]
//                   flash-flicker`}
//       >
//         <div className="flex-1 font-mono text-xs typing-line overflow-hidden whitespace-nowrap">
//           {message || 'Debug information'}
//         </div>
//         <button 
//           onClick={handleClose}
//           className="text-xs ml-4 hover-cursor opacity-70 hover:opacity-100 crt-text2"
//         >
//           ×
//         </button>
//       </div>
//     </div>
//   );
// }
