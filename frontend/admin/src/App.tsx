import React from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { DashboardLayout } from './layout/DashboardLayout';
import DashboardPage from './pages/Dashboard';
import { Users } from './pages/Users';
import { AIModelControl } from './pages/AIModelControl';
import { ContentModeration } from './pages/ContentModeration';
// Subscriptions removed
import PricingManagement from './pages/PricingManagement';
import { Analytics } from './pages/Analytics';
import { Characters } from './pages/Characters';
import { Messaging } from './pages/Messaging';
import { Support } from './pages/Support';
import { Settings } from './pages/Settings';
import PromoManagement from './pages/PromoManagement';
import OrderHistory from './pages/OrderHistory';
import CoinTransactions from './pages/CoinTransactions';
import { PushNotification } from './pages/PushNotification';
import { APIsManagement } from './pages/APIsManagement';
import { CodeInjections } from './pages/CodeInjections';
import { AdminAccess } from './pages/AdminAccess';
// PlanReview removed
import { SetPassword } from './pages/SetPassword';
import { ActivationFailed } from './pages/ActivationFailed';
// Success/Cancel removed

const routes = [
  { path: '/dashboard', element: <DashboardPage /> },
  { path: '/users', element: <Users /> },
  // payment routes removed
  { path: '/pricing', element: <PricingManagement /> },
  { path: '/promo', element: <PromoManagement /> },
  { path: '/orders', element: <OrderHistory /> },
  { path: '/admin/coin-transactions', element: <CoinTransactions /> },
  { path: '/content-moderation', element: <ContentModeration /> },
  { path: '/characters', element: <Characters /> },
  { path: '/notification', element: <PushNotification /> },
  { path: '/settings', element: <Settings /> },
  { path: '/apis', element: <APIsManagement /> },
  { path: '/code-injections', element: <CodeInjections /> },
  { path: '/admin', element: <AdminAccess /> },
  // Legacy routes for backward compatibility
  { path: '/ai-model-control', element: <AIModelControl /> },
  { path: '/analytics', element: <Analytics /> },
  { path: '/messaging', element: <Messaging /> },
  { path: '/support', element: <Support /> },
];

const App: React.FC = () => {
  const AppLayout = () => (
    <DashboardLayout>
      <Outlet />
    </DashboardLayout>
  );

  return (
    <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
  {/* payment callback routes removed */}
        <Route path="/users/set-password" element={<SetPassword />} />
        <Route path="/activation-failed" element={<ActivationFailed />} />
        <Route element={<AppLayout />}>
          {routes.map(route => (
            <Route key={route.path} path={route.path} element={route.element} />
          ))}
        </Route>
  </Routes>
  );
};

export default App;
