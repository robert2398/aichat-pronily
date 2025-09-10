import React, { Suspense, useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from '../../admin/src/components/Sidebar';
import { DateRangeProvider } from '../../admin/src/contexts/DateRangeContext';
import { FiltersProvider } from '../../admin/src/context/FiltersContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const adminQueryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 5 * 60 * 1000, retry: 2 } }
});

// Note: importing directly from the admin folder. This keeps admin components
// colocated. We render the global Header (from main app) above, so this layout
// only renders the admin left sidebar and a content outlet.

export default function AdminLayout() {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className="min-h-screen bg-[#f8fafc] text-black">
      <QueryClientProvider client={adminQueryClient}>
        <DateRangeProvider>
        <FiltersProvider>
        {/* Sidebar */}
        <Sidebar isOpen={isOpen} onClose={() => setIsOpen(false)} />
        {/* Main content (FilterBar moved inside specific pages e.g. Dashboard) */}
        <main style={{ paddingTop: 16, marginLeft: isOpen ? 288 : 0, transition: 'margin-left 0.3s' }}>
          <div className="mx-auto max-w-7xl px-4 pb-6">
            <Suspense fallback={<div>Loading admin...</div>}>
              <Outlet />
            </Suspense>
          </div>
        </main>
        </FiltersProvider>
        </DateRangeProvider>
      </QueryClientProvider>
    </div>
  );
}
