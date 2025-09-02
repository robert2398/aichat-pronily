import React from 'react';

interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
}

export const Toggle: React.FC<ToggleProps> = ({ checked, onChange, label }) => (
  <label className="flex items-center gap-2 cursor-pointer select-none">
    <span className="font-inter text-sm text-gray-900">{label}</span>
    <span
      className={`relative w-10 h-6 flex items-center bg-gray-200 rounded-full transition-colors duration-150 ${checked ? 'bg-primary-500' : ''}`}
      onClick={() => onChange(!checked)}
    >
      <span
        className={`absolute left-1 top-1 w-4 h-4 bg-white rounded-full shadow transition-transform duration-150 ${checked ? 'translate-x-4' : ''}`}
      />
    </span>
  </label>
);
