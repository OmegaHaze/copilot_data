import React, { useEffect } from 'react';
import { componentRegistry } from '../../Panes/Utility/Loader/ComponentRegistry.js';
import { registerEssentialComponents } from '../../Error-Handling/tabs/DebugOverlayManualRegistration.jsx';

/**
 * Diagnostic component to inspect module initialization
 */
export default function ModuleChecker() {
  useEffect(() => {
    async function runDiagnostic() {
      console.log('🔍 RUNNING MODULE DIAGNOSTIC CHECK');
      
      let allSuccessful = true;
      let errorMessages = [];
      
      // Display environment information
      console.log('🌐 ENVIRONMENT:', {
        nodeEnv: process.env.NODE_ENV,
        isProd: process.env.NODE_ENV === 'production',
        isDev: process.env.NODE_ENV === 'development'
      });
      
      // Check system modules
      let systemData = [];
      try {
        const systemRes = await fetch('/api/modules?module_type=system');
        if (systemRes.ok) {
          systemData = await systemRes.json();
          console.log('📋 SYSTEM MODULES:', systemData);
        } else {
          const errorText = await systemRes.text();
          console.error(`Failed to fetch system modules: HTTP ${systemRes.status}`, errorText);
          errorMessages.push(`System modules API error: ${systemRes.status}`);
          allSuccessful = false;
        }
      } catch (err) {
        console.error('Error fetching system modules:', err);
        errorMessages.push(`System modules network error: ${err.message}`);
        allSuccessful = false;
      }
      
      // Check service modules
      let serviceData = [];
      try {
        const serviceRes = await fetch('/api/modules?module_type=service');
        if (serviceRes.ok) {
          serviceData = await serviceRes.json();
          console.log('📋 SERVICE MODULES:', serviceData);
        } else {
          const errorText = await serviceRes.text();
          console.error(`Failed to fetch service modules: HTTP ${serviceRes.status}`, errorText);
          errorMessages.push(`Service modules API error: ${serviceRes.status}`);
          allSuccessful = false;
        }
      } catch (err) {
        console.error('Error fetching service modules:', err);
        errorMessages.push(`Service modules network error: ${err.message}`);
        allSuccessful = false;
      }
      
      // Check user modules
      let userData = [];
      try {
        const userRes = await fetch('/api/modules?module_type=user');
        if (userRes.ok) {
          userData = await userRes.json();
          console.log('📋 USER MODULES:', userData);
        } else {
          const errorText = await userRes.text();
          console.error(`Failed to fetch user modules: HTTP ${userRes.status}`, errorText);
          errorMessages.push(`User modules API error: ${userRes.status}`);
          allSuccessful = false;
        }
      } catch (err) {
        console.error('Error fetching user modules:', err);
        errorMessages.push(`User modules network error: ${err.message}`);
        allSuccessful = false;
      }
      
      // Get registered components
      const registeredComponents = componentRegistry.getAllComponentKeys();
      console.log('🧩 REGISTERED COMPONENTS:', registeredComponents);
      
      // Check for specific components
      let hasSupervisor = componentRegistry.hasComponent('supervisor');
      console.log('👉 HAS SUPERVISOR:', hasSupervisor);
      
      if (!hasSupervisor) {
        console.warn('⚠️ Supervisor component is missing! Attempting emergency registration...');
        
        try {
          // Try emergency registration of essential components
          const registrationResult = await registerEssentialComponents();
          
          if (registrationResult.success) {
            console.log('✅ Emergency component registration successful');
            hasSupervisor = componentRegistry.hasComponent('supervisor');
            if (hasSupervisor) {
              console.log('✅ Supervisor component is now available after emergency registration');
            } else {
              console.error('❌ Supervisor component still missing after emergency registration');
              errorMessages.push('Supervisor component is missing (emergency registration failed)');
              allSuccessful = false;
            }
          } else {
            console.error('❌ Emergency component registration failed:', registrationResult.error);
            errorMessages.push('Supervisor component is missing (emergency registration failed)');
            allSuccessful = false;
          }
        } catch (err) {
          console.error('❌ Error during emergency component registration:', err);
          errorMessages.push('Supervisor component is missing (emergency registration error)');
          allSuccessful = false;
        }
      }
      
      // Check component registry initialization status
      const isInitialized = componentRegistry.isInitialized();
      console.log('✓ REGISTRY INITIALIZED:', isInitialized);
      
      if (!isInitialized) {
        console.warn('⚠️ Component registry is not initialized!');
        errorMessages.push('Component registry not initialized');
        allSuccessful = false;
      }
      
      // Get module data from registry
      const moduleData = componentRegistry.getModuleData();
      console.log('📊 MODULE DATA:', moduleData);
      
      // Check for loading errors
      const errors = componentRegistry.getErrors();
      if (Object.keys(errors).length > 0) {
        console.error('❌ COMPONENT LOADING ERRORS:', errors);
        Object.entries(errors).forEach(([key, error]) => {
          errorMessages.push(`${key}: ${error.error || 'Unknown error'}`);
        });
        allSuccessful = false;
      }
      
      // Summary
      if (allSuccessful) {
        console.log('✅ ALL DIAGNOSTICS PASSED');
      } else {
        console.error('❌ DIAGNOSTICS FAILED:', errorMessages);
        
        // Show error in notification system if available
        if (window.errorSystem && typeof window.errorSystem.showError === 'function') {
          window.errorSystem.showError(
            `Component loading issues detected: ${errorMessages.join(', ')}`,
            'error',
            10000
          );
        }
      }
    }
    
    runDiagnostic();
  }, []);
  
  return null; // This component doesn't render anything
}
