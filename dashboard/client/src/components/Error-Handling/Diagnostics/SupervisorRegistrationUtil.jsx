import React, { useState } from 'react';
// Remove static import of ComponentRegistry and use dynamic import
import { registerEssentialComponents } from './tabs/DebugOverlayManualRegistration.jsx';
import { registerModule } from '../../Panes/Utility/Loader/Module/module-api';

/**
 * Utility to manually register the supervisor module if it's missing
 */
export default function SupervisorRegistrationUtil() {
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState('idle'); // idle, loading, success, error
  
  const registerSupervisor = async () => {
    try {
      setStatus('loading');
      setMessage('Registering supervisor module...');
      
      // Dynamically import ComponentRegistry
      const { componentRegistry } = await import('../../Panes/Utility/Loader/Component/component-registry.js');
      
      // First check if supervisor is already registered
      if (componentRegistry.hasComponent('supervisor')) {
        setMessage('Supervisor module is already registered.');
        setStatus('success');
        return;
      }
      
      // Try emergency registration first
      const registrationResult = await registerEssentialComponents();
      
      if (registrationResult.success && componentRegistry.hasComponent('supervisor')) {
        setMessage('Successfully registered Supervisor component via emergency registration!');
        setStatus('success');
        return;
      }
      
      // If emergency registration failed, try loading the regular way
      const component = await componentRegistry.loadComponent('supervisor', 'SupervisorPane');
      
      if (component) {
        // Successfully loaded the component
        setMessage('Successfully loaded Supervisor component!');
        setStatus('success');
        
        // Create a module entry for it using the centralized module-api
        try {
          const moduleData = {
            name: 'Supervisor',
            paneComponent: 'SupervisorPane',
            visible: true,
            supportsStatus: true,
            socketNamespace: '/supervisor',
            description: 'System Supervisor Module',
            category: 'SYSTEM'
          };

          const result = await registerModule('SYSTEM', moduleData);
          
          if (result) {
            setMessage('Supervisor module registered successfully!');
            console.log('Registered supervisor module:', result);
          } else {
            setMessage('Failed to register supervisor module');
            setStatus('error');
          }
        } catch (apiErr) {
          setMessage(`API error: ${apiErr.message}`);
          setStatus('error');
        }
      } else {
        setMessage('Failed to load Supervisor component.');
        setStatus('error');
      }
    } catch (err) {
      console.error('Error registering supervisor:', err);
      setMessage(`Error: ${err.message}`);
      setStatus('error');
    }
  };
  
  return (
    <div className="my-2 p-2 border border-gray-700 rounded text-xs">
      <h3 className="font-bold">Module Registration Utility</h3>
      
      <div className="mt-1">
        <button
          onClick={registerSupervisor}
          disabled={status === 'loading'}
          className={`px-2 py-1 rounded text-white ${
            status === 'loading' ? 'bg-gray-500' : 'bg-blue-600 hover:bg-blue-500'
          }`}
        >
          {status === 'loading' ? 'Registering...' : 'Register Supervisor'}
        </button>
      </div>
      
      {message && (
        <div className={`mt-1 p-1 text-xs ${
          status === 'error' ? 'text-red-500' : 
          status === 'success' ? 'text-green-500' : 
          'text-yellow-500'
        }`}>
          {message}
        </div>
      )}
    </div>
  );
}
