import React from 'react';

export type SelectState = 'default' | 'error' | 'success';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  state?: SelectState;
  label?: string;
  errorMessage?: string;
  successMessage?: string;
  options: { value: string; label: string }[];
}

const stateClasses: Record<SelectState, string> = {
  default: 'border-gray-300',
  error: 'border-danger-500 focus:border-danger-500',
  success: 'border-accent-500 focus:border-accent-500',
};

export const Select: React.FC<SelectProps> = ({
  state = 'default',
  label,
  errorMessage,
  successMessage,
  options,
  ...props
}) => (
  <div className="flex flex-col gap-1">
    {label && <label className="font-inter text-sm text-gray-900 mb-1">{label}</label>}
    <select
      className={`rounded-lg px-3 py-2 border outline-none font-inter text-base transition-all duration-150 ease-out ${stateClasses[state]}`}
      {...props}
    >
      {options.map(opt => (
        <option key={opt.value} value={opt.value}>{opt.label}</option>
      ))}
    </select>
    {state === 'error' && errorMessage && (
      <span className="text-danger-500 text-xs mt-1">{errorMessage}</span>
    )}
    {state === 'success' && successMessage && (
      <span className="text-accent-500 text-xs mt-1">{successMessage}</span>
    )}
  </div>
);
