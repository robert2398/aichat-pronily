import React from 'react';
import { Loader2 } from 'lucide-react';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'destructive';
export type ButtonState = 'default' | 'hover' | 'active' | 'disabled' | 'loading';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  state?: ButtonState;
  children: React.ReactNode;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'bg-primary-500 text-white hover:bg-primary-600',
  secondary: 'border border-gray-300 text-gray-900 bg-white hover:bg-gray-100',
  ghost: 'bg-transparent text-primary-500 hover:bg-primary-50',
  destructive: 'bg-danger-500 text-white hover:bg-danger-600',
};

const stateClasses: Record<ButtonState, string> = {
  default: '',
  hover: '',
  active: 'ring-2 ring-primary-500',
  disabled: 'opacity-50 cursor-not-allowed',
  loading: 'relative',
};

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  state = 'default',
  children,
  disabled,
  ...props
}) => {
  const isLoading = state === 'loading';
  return (
    <button
      className={`rounded-lg px-4 py-2 font-inter font-semibold transition-all duration-150 ease-out shadow-dashboard ${variantClasses[variant]} ${stateClasses[state]}`}
      disabled={disabled || state === 'disabled' || isLoading}
      {...props}
    >
      {isLoading ? (
        <span className="flex items-center justify-center gap-2">
          <Loader2 className="animate-spin w-4 h-4" />
          Loading
        </span>
      ) : (
        children
      )}
    </button>
  );
};
