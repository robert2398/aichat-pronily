import React from 'react';

interface RangeSliderProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  min?: number;
  max?: number;
  step?: number;
}

export const RangeSlider: React.FC<RangeSliderProps> = ({ label, min = 0, max = 100, step = 1, ...props }) => (
  <div className="flex flex-col gap-1">
    {label && <label className="font-inter text-sm text-gray-900 mb-1">{label}</label>}
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary-500"
      {...props}
    />
  </div>
);
