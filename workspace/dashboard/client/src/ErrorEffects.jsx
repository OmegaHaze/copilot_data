import React from 'react';

const ErrorEffects = ({ isActive }) => {
  if (!isActive) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center p-6">
      <div className="fixed inset-0 z-50 pointer-events-none scanlines boot-glow flash-flicker" style={{ backgroundColor: 'rgba(255, 0, 0, 0.1)' }} />
      {/* Pulse distortion scanline */}
      <div className="fixed inset-0 z-50 pointer-events-none scan-pulse" />
      {/* Additional visual effects can be added here */}
    </div>
  );
};

export default ErrorEffects;
