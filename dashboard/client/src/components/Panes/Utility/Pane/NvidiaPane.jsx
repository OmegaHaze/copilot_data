// NvidiaPane.jsx

import { useEffect, useState, useRef } from 'react';
import PaneHeader from '../PaneHeader';
import GpuPerfGraph from '../../../Panels/panel-modules/GpuGraph/GpuPerfGraph';

export default function NvidiaPane({
  id, // Full paneId format: SERVICE-nvidiapane-instanceId
  moduleType = 'SERVICE',
  staticIdentifier = 'NvidiaPane',
  name = 'NvidiaPane',
  status = '',
  logo
}) {
  const mountedRef = useRef(true);
  const refreshTimerRef = useRef(null);

  useEffect(() => {
    console.log(`[NvidiaPane] Mounted: ${id} (${moduleType}-${staticIdentifier})`);

    return () => {
      mountedRef.current = false;
      if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    };
  }, [id, moduleType, staticIdentifier]);

  return (
    <div className="bg-[#08170D]/30 backdrop-blur-sm rounded crt-border-green6 shadow-inner overflow-hidden w-full h-full flex flex-col relative">
      <PaneHeader 
        name={name}
        status={status}
        logo={logo}
        moduleType={moduleType}
        staticIdentifier={staticIdentifier}
        _gridId={id}
      />

      <div className="flex-grow">
        <GpuPerfGraph />
      </div>
    </div>
  );
}
