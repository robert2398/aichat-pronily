import React from 'react';
import type { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  label: string;
  value: string;
  icon?: LucideIcon;
  tooltip?: string;
  trend?: {
    value: string;
    isPositive: boolean;
  };
}

export const StatsCard: React.FC<StatsCardProps> = ({ 
  label, 
  value, 
  icon: Icon,
  tooltip,
  trend 
}) => {
  return (
    <div 
      className="rounded-2xl shadow-sm border bg-white p-5 hover:shadow-md transition-shadow duration-200"
      title={tooltip}
    >
      <div className="flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <p 
            className="text-sm text-gray-600 font-medium mb-2"
            aria-describedby={`${label.replace(/\s+/g, '-').toLowerCase()}-value`}
          >
            {label}
          </p>
          <p 
            id={`${label.replace(/\s+/g, '-').toLowerCase()}-value`}
            className="text-3xl font-semibold tracking-tight text-gray-900"
            role="heading"
            aria-level={3}
          >
            {value}
          </p>
          {trend && (
            <div className="flex items-center mt-2">
              <span 
                className={`text-sm font-medium ${
                  trend.isPositive ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {trend.isPositive ? '+' : ''}{trend.value}
              </span>
            </div>
          )}
        </div>
        {Icon && (
          <div className="flex-shrink-0 ml-4">
            <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
              <Icon className="w-5 h-5 text-orange-600" aria-hidden="true" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
