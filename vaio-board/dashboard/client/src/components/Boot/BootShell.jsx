import CRTEffects from '../Services/CRT-Effects';

export default function BootShell({ children }) {
  return (
    <div className="fixed inset-0 crt-text4 font-mono text-sm z-50 flex items-center justify-center p-6 boot-glow">
      {/* Screen scanline overlay */}
      <div className="fixed inset-0 z-50 pointer-events-none scanlines" />
      <CRTEffects isActive={true} />

      {/* Box frame with green border */}
      <div className="w-full max-w-xl min-h-64 crt-border-green6 p-4 shadow-inner z-40">
        {children}
      </div>

      {/* CRT screen vignette dark edges */}
      <div
        className="fixed inset-0 pointer-events-none z-[51]"
        style={{
          background: 'radial-gradient(circle at center, transparent 60%, rgba(0, 10, 2, 0.3) 100%)',
          boxShadow: 'inset 0 0 100px 20px rgba(0, 0, 0, 0.8)',
        }}
      />
    </div>
  );
}
