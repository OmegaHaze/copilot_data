import React, { useEffect, useRef } from 'react';
import { registerEssentialComponents } from './tabs/DebugOverlayManualRegistration.jsx';
import { useError } from './ErrorNotificationSystem.jsx';
import registry from '../../Panes/Utility/Loader/Component/component-registry.js';
import { ErrorType, ErrorSeverity } from '../../Error-Handling/Diagnostics/types/errorTypes.js';

export default function ModuleChecker() {
  const { showError } = useError();
  const hasRunDiagnostic = useRef(false);
  const shownErrors = useRef(new Set());

  useEffect(() => {
    if (hasRunDiagnostic.current) return;
    hasRunDiagnostic.current = true;

    async function runDiagnostic() {
      console.log('🔍 RUNNING MODULE DIAGNOSTIC CHECK');

      let allSuccessful = true;
      let errorMessages = [];

      const moduleTypes = ['SYSTEM', 'SERVICE', 'USER'];

      // Dynamically import the module API for efficiency
      let moduleApi;
      try {
        
        moduleApi = await import('../../Panes/Utility/Loader/Module/module-api');
      } catch (err) {
        console.error('Failed to import module-api.js:', err);
        reportError && reportError('Failed to load module API', 'MODULE_SYSTEM', 'HIGH');
        return false;
      }

      for (const type of moduleTypes) {
        try {
          const data = await moduleApi.fetchModulesByType(type);
          if (Array.isArray(data) || (data && !data.error)) {
            console.log(`📋 ${type} MODULES:`, data);
          } else {
            const errorMsg = `${type} modules API error: ${data.error || 'Unknown error'}`;
            console.error(errorMsg);
            if (!shownErrors.current.has(errorMsg)) {
              errorMessages.push(errorMsg);
              shownErrors.current.add(errorMsg);
              allSuccessful = false;
            }
          }
        } catch (err) {
          const errorMsg = `${type} modules network error: ${err.message}`;
          console.error(errorMsg);
          if (!shownErrors.current.has(errorMsg)) {
            errorMessages.push(errorMsg);
            shownErrors.current.add(errorMsg);
            allSuccessful = false;
          }
        }
      }

      const supervisorKey = 'SYSTEM-SupervisorPane';
      let hasSupervisor = registry.hasComponent(supervisorKey);
      console.log(`👉 HAS ${supervisorKey}:`, hasSupervisor);

      if (!hasSupervisor) {
        console.warn(`⚠️ ${supervisorKey} is missing! Attempting emergency registration...`);

        try {
          const result = await registerEssentialComponents();
          if (result.success) {
            hasSupervisor = registry.hasComponent(supervisorKey);
            if (hasSupervisor) {
              console.log(`✅ ${supervisorKey} is now available`);
            } else {
              errorMessages.push(`${supervisorKey} still missing after registration`);
              allSuccessful = false;
            }
          } else {
            errorMessages.push(`${supervisorKey} registration failed`);
            allSuccessful = false;
          }
        } catch (err) {
          errorMessages.push(`${supervisorKey} registration error: ${err.message}`);
          allSuccessful = false;
        }
      }

      const isInitialized = registry.initialized;
      console.log('✓ REGISTRY INITIALIZED:', isInitialized);
      if (!isInitialized) {
        errorMessages.push('Component registry not initialized');
        allSuccessful = false;
      }

      const moduleData = registry.getModuleData();
      console.log('📊 MODULE DATA:', moduleData);

      const errors = registry.getErrors();
      if (Object.keys(errors).length > 0) {
        console.error('❌ COMPONENT LOADING ERRORS:', errors);
        Object.entries(errors).forEach(([key, error]) => {
          errorMessages.push(`${key}: ${error.error || 'Unknown error'}`);
        });
        allSuccessful = false;
      }

      if (allSuccessful) {
        console.log('✅ ALL DIAGNOSTICS PASSED');
      } else {
        console.error('❌ DIAGNOSTICS FAILED:', errorMessages);
        showError(
          `Component issues: ${errorMessages.join(', ')}`,
          ErrorType.MODULE,
          ErrorSeverity.MEDIUM
        );
      }
    }

    runDiagnostic();
  }, [showError]);

  return null;
}
