import React from 'react';

const CRTEffects = ({ isActive = true }) => {
  if (!isActive) return null;
  
  return (
    <div className="pointer-events-none fixed inset-0 z-[990] overflow-hidden" aria-hidden="true">
      {/* CRT scan lines */}
      <div 
        className="absolute inset-0"
        style={{
          backgroundImage: 'linear-gradient(to bottom, rgba(0,0,0,0) 50%, rgba(0,0,0,0.25) 50%)',
          backgroundSize: '100% 4px',
          zIndex: 1,
          mixBlendMode: 'overlay',
          opacity: 0.4
        }}
      />
      
      {/* CRT glow effect */}
      <div 
        className="absolute inset-0 rounded-lg"
        style={{
          boxShadow: 'inset 0 0 100px rgba(57, 255, 20, 0.1)',
          zIndex: 2,
          pointerEvents: 'none',
          opacity: 0.8
        }}
      />
            
      {/* CRT flicker animation */}
      <div 
        className="absolute inset-0"
        style={{
          animation: 'crtFlicker 8s infinite',
          background: 'rgba(57, 255, 20, 0.03)',
          opacity: 0.7,
          zIndex: 3,
          mixBlendMode: 'overlay'
        }}
      />
            
      {/* Add global styles for animations */}
      <style jsx global>{`
        @keyframes crtFlicker {
          0% { opacity: 0.5; }
          1% { opacity: 0.6; }
          2% { opacity: 0.8; }
          3% { opacity: 0.4; }
          4% { opacity: 0.6; }
          5% { opacity: 0.5; }
          10% { opacity: 0.4; }
          20% { opacity: 0.6; }
          30% { opacity: 0.5; }
          40% { opacity: 0.4; }
          50% { opacity: 0.5; }
          60% { opacity: 0.4; }
          70% { opacity: 0.6; }
          80% { opacity: 0.5; }
          90% { opacity: 0.6; }
          95% { opacity: 0.4; }
          98% { opacity: 0.6; }
          100% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
};

export default CRTEffects;
