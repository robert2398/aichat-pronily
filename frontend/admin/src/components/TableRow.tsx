import React from 'react';
import { MoreVertical } from 'lucide-react';

interface TableRowProps {
  cells: React.ReactNode[];
  checked?: boolean;
  onCheck?: (checked: boolean) => void;
  actions?: React.ReactNode;
}

export const TableRow: React.FC<TableRowProps> = ({ cells, checked, onCheck, actions }) => (
  <tr className="bg-white border-b border-gray-100 hover:bg-gray-50 transition-colors duration-150">
    <td className="px-4 py-2">
      <input type="checkbox" checked={checked} onChange={e => onCheck?.(e.target.checked)} />
    </td>
    {cells.map((cell, idx) => (
      <td key={idx} className="px-4 py-2 font-inter text-sm text-gray-900">{cell}</td>
    ))}
    <td className="px-4 py-2 text-right">
      {actions || <MoreVertical className="w-5 h-5 text-gray-400 cursor-pointer" />}
    </td>
  </tr>
);
