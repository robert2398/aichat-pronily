import React, { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';
import { subDays, format } from 'date-fns';
import type { DateRangeContextType } from '../types/dashboard';

const DateRangeContext = createContext<DateRangeContextType | undefined>(undefined);

export const useDateRange = () => {
  const context = useContext(DateRangeContext);
  if (!context) {
    throw new Error('useDateRange must be used within a DateRangeProvider');
  }
  return context;
};

interface DateRangeProviderProps {
  children: ReactNode;
}

export const DateRangeProvider: React.FC<DateRangeProviderProps> = ({ children }) => {
  // Default to last 30 days
  const defaultTo = new Date();
  const defaultFrom = subDays(defaultTo, 30);
  
  const [from, setFrom] = useState(format(defaultFrom, 'yyyy-MM-dd'));
  const [to, setTo] = useState(format(defaultTo, 'yyyy-MM-dd'));

  const setDateRange = (newFrom: string, newTo: string) => {
    setFrom(newFrom);
    setTo(newTo);
  };

  return (
    <DateRangeContext.Provider value={{ from, to, setDateRange }}>
      {children}
    </DateRangeContext.Provider>
  );
};
