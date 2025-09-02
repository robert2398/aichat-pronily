import React from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

interface ChartCardProps {
  title: string;
  data: any[];
  dataKey: string;
  color?: string;
}

export const ChartCard: React.FC<ChartCardProps> = ({ title, data, dataKey, color = '#6366F1' }) => (
  <div className="w-80 h-60 bg-white rounded-lg shadow-dashboard p-6 flex flex-col">
    <span className="font-inter text-sm text-gray-500 mb-2">{title}</span>
    <ResponsiveContainer width="100%" height="80%">
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip />
        <Line type="monotone" dataKey={dataKey} stroke={color} strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  </div>
);
