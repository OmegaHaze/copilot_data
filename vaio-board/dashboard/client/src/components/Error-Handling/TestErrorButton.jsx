// TestErrorButton.jsx - For testing error notifications
import React from 'react';

export default function TestErrorButton() {
  const triggerConsoleError = () => {
    console.error('Test console error - This should appear in the notification system!');
  };

  return (
    <button 
      onClick={triggerConsoleError}
      className="fixed right-4 bottom-4 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded z-50"
    >
      Test Error Notification
    </button>
  );
}
