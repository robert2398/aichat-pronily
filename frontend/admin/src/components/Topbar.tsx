import React from 'react';
import { Search, Sun, User } from 'lucide-react';

interface TopbarProps {
  userName?: string;
  avatarUrl?: string;
  onThemeToggle?: () => void;
}

export const Topbar: React.FC<TopbarProps> = ({ userName, avatarUrl, onThemeToggle }) => (
  <header className="w-full h-16 bg-white shadow-dashboard flex items-center justify-between px-6">
    <div className="flex items-center gap-4">
      <Search className="w-5 h-5 text-gray-400" />
      <input
        type="text"
        placeholder="Search..."
        className="px-3 py-2 rounded-lg border border-gray-100 font-inter text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500"
      />
    </div>
    <div className="flex items-center gap-4">
      <button onClick={onThemeToggle} className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200">
        <Sun className="w-5 h-5 text-gray-600" />
      </button>
      <div className="flex items-center gap-2">
        {avatarUrl ? (
          <img src={avatarUrl} alt="avatar" className="w-10 h-10 rounded-full object-cover" />
        ) : (
          <User className="w-10 h-10 rounded-full bg-gray-200 text-gray-400" />
        )}
        <span className="font-inter text-sm text-gray-900">{userName || 'Admin'}</span>
      </div>
    </div>
  </header>
);
