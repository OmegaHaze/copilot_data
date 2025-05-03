import React, { useState } from 'react';
import { saveLayoutToSession } from '../../Panes/Utility/Loader/LayoutManager.js';

/**
 * Debug utility for testing save layout functionality
 */
export default function LayoutDebugUtil() {
  const [status, setStatus] = useState('idle');
  const [message, setMessage] = useState('');
  
  const testLayoutSave = async () => {
    try {
      setStatus('loading');
      setMessage('Testing layout save...');
      
      // Create a test layout with minimal content
      const testLayout = {
        lg: [
          {
            i: 'test-layout-item',
            x: 0,
            y: 0,
            w: 12,
            h: 8,
            moduleType: 'supervisor'
          }
        ],
        md: [
          {
            i: 'test-layout-item',
            x: 0,
            y: 0,
            w: 12,
            h: 8,
            moduleType: 'supervisor'
          }
        ],
        sm: [
          {
            i: 'test-layout-item',
            x: 0,
            y: 0,
            w: 6,
            h: 6,
            moduleType: 'supervisor'
          }
        ],
        xs: [
          {
            i: 'test-layout-item',
            x: 0,
            y: 0,
            w: 4,
            h: 6,
            moduleType: 'supervisor'
          }
        ],
        xxs: [
          {
            i: 'test-layout-item',
            x: 0,
            y: 0,
            w: 2,
            h: 4,
            moduleType: 'supervisor'
          }
        ]
      };
      
      // Try to save the layout
      const result = await saveLayoutToSession(testLayout);
      console.log('Layout save test result:', result);
      
      if (result) {
        setStatus('success');
        setMessage('Layout saved successfully! Check console for details.');
      } else {
        setStatus('error');
        setMessage('Layout save returned null or undefined.');
      }
    } catch (err) {
      console.error('Error testing layout save:', err);
      setStatus('error');
      setMessage(`Error: ${err.message}`);
    }
  };
  
  return (
    <div className="my-2 p-2 border border-gray-700 rounded text-xs">
      <h3 className="font-bold">Layout Debug Utility</h3>
      
      <div className="mt-1">
        <button
          onClick={testLayoutSave}
          disabled={status === 'loading'}
          className={`px-2 py-1 rounded text-white ${
            status === 'loading' ? 'bg-gray-500' : 'bg-green-600 hover:bg-green-500'
          }`}
        >
          {status === 'loading' ? 'Testing...' : 'Test Layout Save'}
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
