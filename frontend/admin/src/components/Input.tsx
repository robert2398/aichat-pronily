import React from 'react';

export type InputState = 'default' | 'error' | 'success';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  state?: InputState;
  label?: string;
  errorMessage?: string;
  successMessage?: string;
}

const stateClasses: Record<InputState, string> = {
  default: 'border-gray-300',
  error: 'border-danger-500 focus:border-danger-500',
  success: 'border-accent-500 focus:border-accent-500',
};

export const Input: React.FC<InputProps> = ({
  state = 'default',
  label,
  errorMessage,
  successMessage,
  ...props
}) => (
  <div className="flex flex-col gap-1">
    {label && <label className="font-inter text-sm text-gray-900 mb-1">{label}</label>}
    <input
      className={`rounded-lg px-3 py-2 border outline-none font-inter text-base transition-all duration-150 ease-out ${stateClasses[state]}`}
      {...props}
    />
    {state === 'error' && errorMessage && (
      <span className="text-danger-500 text-xs mt-1">{errorMessage}</span>
    )}
    {state === 'success' && successMessage && (
      <span className="text-accent-500 text-xs mt-1">{successMessage}</span>
    )}
  </div>
);
