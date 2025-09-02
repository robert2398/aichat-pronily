import React from 'react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({ open, onClose, title, children }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 backdrop-blur-sm transition-opacity duration-150">
      <div className="bg-white rounded-lg shadow-dashboard w-[600px] max-w-full p-8 relative">
        {title && <h2 className="font-inter text-xl font-semibold mb-4 text-gray-900">{title}</h2>}
        <button
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-900"
          onClick={onClose}
          aria-label="Close"
        >
          ×
        </button>
        {children}
      </div>
    </div>
  );
};
