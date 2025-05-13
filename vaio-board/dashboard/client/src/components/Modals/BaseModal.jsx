import React from "react";
import ReactDOM from "react-dom";

export default function BaseModal({ open, onClose, title = "Modal", children }) {
  if (!open) return null;

  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70">
      <div className="crt-border6 rounded-lg bg-black text-white w-full max-w-xl p-4 shadow-lg relative">
        <div className="flex justify-between items-center mb-3 border-b border-gray-600 pb-2">
          <h2 className="text-sm font-bold crt-text4">{title}</h2>
          <button
            onClick={onClose}
            className="text-sm px-2 py-1 bg-red-700 hover:bg-red-800 rounded crt-link5"
          >
            Close
          </button>
        </div>
        <div className="modal-content text-sm crt-text4 space-y-3">{children}</div>
      </div>
    </div>,
    document.body
  );
}