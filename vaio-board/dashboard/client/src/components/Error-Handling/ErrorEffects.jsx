import React, { useEffect, useState } from 'react';

const ErrorEffects = ({ isActive }) => {
  const [glitchActive, setGlitchActive] = useState(false);
  
  // Randomly trigger glitch effect
  useEffect(() => {
    if (!isActive) return;
    
    const glitchInterval = setInterval(() => {
      setGlitchActive(true);
      setTimeout(() => setGlitchActive(false), 150);
    }, 2000 + Math.random() * 3000);
    
    return () => clearInterval(glitchInterval);
  }, [isActive]);

  if (!isActive) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center p-6 ">
      {/* Main CRT effect overlay - original background with maroon glow */}
      <div 
        className="fixed inset-0  pointer-events-none scanlines boot-glow flash-flicker" 
        style={{ 
          backgroundColor: 'rgba(0, 30, 0, 0.25)', // Original dark green/black background
          boxShadow: 'inset 0 0 100px rgba(90, 20, 30, 0.5), inset 0 0 150px rgba(80, 25, 35, 0.5)', // Maroon glow
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 1px, rgba(0, 255, 0, 0.1) 1px, rgba(0, 255, 0, 0.15) 4px)', // Green scanlines
          backgroundSize: '100% 2px',
          animation: 'scanlines 1s steps(30) infinite',
          mixBlendMode: 'screen'
        }} 
      />
      
      {/* Intensified scan pulse with maroon color */}
      <div 
        className="fixed inset-0 z-50 pointer-events-none scan-pulse" 
        style={{
          backgroundImage: 'linear-gradient(transparent 50%, rgba(80, 20, 30, 0.6) 50%)', // Maroon scan pulse
          backgroundSize: '100% 4px',
          animation: 'scanpulse 4s ease-in-out infinite',
          opacity: 0.7
        }}
      />
      
      {/* Random glitch effect with maroon */}
      {glitchActive && (
        <div 
          className="fixed inset-0 z-51 pointer-events-none" 
          style={{
            backgroundImage: 'linear-gradient(90deg, transparent 0%, rgba(95, 25, 35, 0.8) 5%, transparent 5.5%, transparent 9%, rgba(80, 25, 35, 0.8) 10%, transparent 10.5%, transparent 100%)',
            transform: `translateX(${Math.random() * 10 - 5}px)`,
            mixBlendMode: 'screen'
          }}
        />
      )}
      
      {/* Maroon CRT flicker overlay */}
      <div 
        className="fixed inset-0 z-49 pointer-events-none" 
        style={{
          background: 'transparent',
          opacity: Math.random() * 0.1 + 0.1,
          boxShadow: 'inset 0 0 200px rgba(90, 20, 30, 0.7), inset 0 0 300px rgba(75, 25, 30, 0.5)',
          animation: 'flicker 0.3s infinite'
        }}
      />
      
      {/* Vignette effect with maroon tint */}
      <div 
        className="fixed inset-0 z-48 pointer-events-none" 
        style={{
          background: 'radial-gradient(ellipse at center, transparent 65%, rgba(80, 25, 35, 0.5) 100%)',
          mixBlendMode: 'multiply'
        }}
      />
    </div>
  );
};

export default ErrorEffects;
