import Header from "./components/Header";
import Hero from "./components/Hero";
import Characters from "./components/Characters";
import Promo from "./components/Promo";
import ImagesSection from "./components/ImagesSection";
import VideosSection from "./components/VideosSection";
import FeaturesGrid from "./components/FeaturesGrid";
import FeatureShowcase from "./components/FeatureShowcase";
import PricingPlans from "./components/PricingPlans";
import Pricing from "./components/Pricing";
import Verify from "./components/Verify";
import VerifyConfirm from "./components/VerifyConfirm";
import Success from "./components/Success";
import Cancel from "./components/Cancel";
import BuyGems from "./components/BuyGems";
import StoryGenerator from "./components/StoryGenerator";
import GameGenerator from "./components/GameGenerator";
import Signature from "./components/Signature";
import FaqSection from "./components/FaqSection";

import Footer from "./components/Footer";
import AuthLayout from "./components/auth/AuthLayout";
import SignIn from "./components/auth/SignIn";
import SignUp from "./components/auth/SignUp";
import SignUpCompact from "./components/auth/SignUpCompact";
import ForgotPassword from "./components/auth/ForgotPassword";
import OtpVerification from "./components/auth/OtpVerification";
import AiPornIndex from "./components/ai/AiPornIndex";
import AiPornImage from "./components/ai/AiPornImage";
import SelectCharacter from "./components/ai/SelectCharacter";
import SelectBackground from "./components/ai/SelectBackground";
import SelectPose from "./components/ai/SelectPose";
import SelectOutfit from "./components/ai/SelectOutfit";
import SelectCharacterImage from "./components/ai/SelectCharacterImage";
import SelectCharacterVideo from "./components/ai/SelectCharacterVideo";
import AiPornVideo from "./components/ai/AiPornVideo";
import AiChat from "./components/AiChat";
import MyAI from "./components/MyAI";
import CreateCharacter from "./components/CreateCharacter";
import CreateCharacterSave from "./components/CreateCharacterSave";
import Gallery from "./components/ai/Gallery";
import Settings from "./components/Settings";
import ChangePassword from "./components/auth/ChangePassword";
import { Routes, Route, Navigate } from "react-router-dom";
import { lazy, Suspense } from 'react';
import AdminLayout from './admin/AdminLayout';

// Lazy-load admin pages from the admin subproject to preserve code-splitting
const AdminDashboard = lazy(() => import('../admin/src/pages/Dashboard').then(mod => ({ default: mod.default || mod.Dashboard || mod.DashboardPage || Object.values(mod)[0] })));
const AdminUsers = lazy(() => import('../admin/src/pages/Users').then(mod => ({ default: mod.Users || mod.default })));
// The admin pages sometimes use named exports (e.g. `export const Characters`).
// React.lazy expects a default export, so wrap the dynamic import and
// return the named export as the module default when necessary.
const AdminCharacters = lazy(() =>
  import('../admin/src/pages/Characters').then((mod) => ({ default: mod.Characters || mod.default }))
);
// AdminSubscriptions removed
const AdminPricing = lazy(() => import('../admin/src/pages/PricingManagement').then(mod => ({ default: mod.PricingManagement || mod.default })));
const AdminPromo = lazy(() => import('../admin/src/pages/PromoManagement').then(mod => ({ default: mod.PromoManagement || mod.default })));
const AdminContentModeration = lazy(() => import('../admin/src/pages/ContentModeration').then(mod => ({ default: mod.ContentModeration || mod.default })));
const AdminAPIs = lazy(() => import('../admin/src/pages/APIsManagement').then(mod => ({ default: mod.APIsManagement || mod.default })));
const AdminSettings = lazy(() => import('../admin/src/pages/Settings').then(mod => ({ default: mod.Settings || mod.default })));
// Order history admin page
const AdminOrders = lazy(() => import('../admin/src/pages/OrderHistory').then(mod => ({ default: mod.default || mod.OrderHistory })));
const AdminCoinTransactions = lazy(() => import('../admin/src/pages/CoinTransactions').then(mod => ({ default: mod.default || mod.CoinTransactions })));
import { useLocation } from "react-router-dom";

export default function App() {
  const location = useLocation();
  // When a modal is opened we store the previous location in location.state.background
  const state = location.state;
  const background = state && state.background;

  return (
    <div className="min-h-screen bg-[#100921] text-white">
      <Header />
      <Routes location={background || location}>
        <Route
          path="/"
          element={
            <>
              <Hero />
              <Characters />
              <Promo />
              <ImagesSection />
              <VideosSection />
              <FeaturesGrid />
              <FeatureShowcase />
              <PricingPlans />
              <StoryGenerator />
              <GameGenerator />
              <Signature />
              <FaqSection />
            </>
          }
        />
        <Route
          path="/ai-porn"
          element={
            <main className="mx-auto max-w-5xl px-4 py-12">
              <AiPornIndex />
            </main>
          }
        />
        <Route
          path="/ai-chat"
          element={
            <main className="mx-auto max-w-7xl px-4 py-12">
              <AiChat />
            </main>
          }
        />
        <Route
          path="/my-ai"
          element={
            <main className="mx-auto max-w-7xl px-4 py-12">
              <MyAI />
            </main>
          }
        />
        <Route
          path="/characters"
          element={
            <main className="mx-auto max-w-7xl px-4 py-12">
              <AiChat />
            </main>
          }
        />
        <Route
          path="/ai-chat/:id"
          element={
            <main className="mx-auto max-w-7xl px-4 py-12">
              <AiChat />
            </main>
          }
        />
        <Route
          path="/create-character"
          element={
            <main className="mx-auto max-w-7xl px-4 py-12">
              <CreateCharacter />
            </main>
          }
        />
        <Route
          path="/create-character/save"
          element={
            <main className="mx-auto max-w-7xl px-4 py-12">
              <CreateCharacterSave />
            </main>
          }
        />
        <Route
          path="/ai-porn/image"
          element={
            <main className="mx-auto max-w-5xl px-4 py-12">
              <AiPornImage />
            </main>
          }
        />
        <Route
          path="/ai-porn/image/character"
          element={
            <main className="mx-auto max-w-7xl px-4 py-12">
              <SelectCharacter />
            </main>
          }
        />
        <Route
          path="/ai-porn/image/character-image"
          element={
            <main className="mx-auto max-w-7xl px-4 py-12">
              <SelectCharacterImage />
            </main>
          }
        />
        <Route
          path="/ai-porn/image/background"
          element={
            <main className="mx-auto max-w-5xl px-4 py-12">
              <SelectBackground />
            </main>
          }
        />
        <Route
          path="/ai-porn/image/pose"
          element={
            <main className="mx-auto max-w-5xl px-4 py-12">
              <SelectPose />
            </main>
          }
        />
        <Route
          path="/ai-porn/image/outfit"
          element={
            <main className="mx-auto max-w-5xl px-4 py-12">
              <SelectOutfit />
            </main>
          }
        />
        <Route
          path="/ai-porn/video"
          element={
            <main className="mx-auto max-w-5xl px-4 py-12">
              <AiPornVideo />
            </main>
          }
        />
        <Route
          path="/ai-porn/video/character"
          element={
            <main className="mx-auto max-w-7xl px-4 py-12">
              <SelectCharacter />
            </main>
          }
        />
        <Route
          path="/ai-porn/video/character-video"
          element={
            <main className="mx-auto max-w-7xl px-4 py-12">
              <SelectCharacterVideo />
            </main>
          }
        />
        <Route
          path="/ai-porn/video/background"
          element={
            <main className="mx-auto max-w-5xl px-4 py-12">
              <SelectBackground />
            </main>
          }
        />
        <Route
          path="/ai-porn/video/pose"
          element={
            <main className="mx-auto max-w-5xl px-4 py-12">
              <SelectPose />
            </main>
          }
        />
        <Route
          path="/ai-porn/video/outfit"
          element={
            <main className="mx-auto max-w-5xl px-4 py-12">
              <SelectOutfit />
            </main>
          }
        />
        <Route
          path="/ai-porn/gallery"
          element={
            <main className="mx-auto max-w-7xl px-4 py-12">
              <Gallery />
            </main>
          }
        />
        <Route
          path="/pricing"
          element={
            <main className="mx-auto max-w-7xl px-4 py-12">
              <Pricing />
            </main>
          }
        />
        <Route
          path="/buy-gems"
          element={
            <main className="mx-auto max-w-7xl px-4 py-12">
              <BuyGems />
            </main>
          }
        />
        <Route
          path="/settings"
          element={
            <main className="mx-auto max-w-7xl px-4 py-12">
              <Settings />
            </main>
          }
        />

        {/* Admin routes integrated into main router under /admin - uses global Header above and AdminLayout for sidebar */}
        <Route path="/admin" element={<AdminLayout />}> 
          <Route index element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="dashboard" element={<Suspense fallback={<div>Loading...</div>}><AdminDashboard /></Suspense>} />
          <Route path="users" element={<Suspense fallback={<div>Loading...</div>}><AdminUsers /></Suspense>} />
          <Route path="characters" element={<Suspense fallback={<div>Loading...</div>}><AdminCharacters /></Suspense>} />
          {/* subscriptions admin route removed */}
          <Route path="pricing" element={<Suspense fallback={<div>Loading...</div>}><AdminPricing /></Suspense>} />
          <Route path="promo" element={<Suspense fallback={<div>Loading...</div>}><AdminPromo /></Suspense>} />
          <Route path="orders" element={<Suspense fallback={<div>Loading...</div>}><AdminOrders /></Suspense>} />
          <Route path="coin-transactions" element={<Suspense fallback={<div>Loading...</div>}><AdminCoinTransactions /></Suspense>} />
          <Route path="content-moderation" element={<Suspense fallback={<div>Loading...</div>}><AdminContentModeration /></Suspense>} />
          <Route path="apis" element={<Suspense fallback={<div>Loading...</div>}><AdminAPIs /></Suspense>} />
          <Route path="settings" element={<Suspense fallback={<div>Loading...</div>}><AdminSettings /></Suspense>} />
        </Route>
        <Route
          path="/change-password"
          element={
            <main className="mx-auto max-w-2xl px-4 py-12">
              <ChangePassword />
            </main>
          }
        />
        <Route
          path="/verify"
          element={
            <main className="mx-auto max-w-7xl px-4 py-12">
              <Verify />
            </main>
          }
        />
        <Route
          path="/verify/confirm"
          element={
            <main className="mx-auto max-w-7xl px-4 py-12">
              <VerifyConfirm />
            </main>
          }
        />
        <Route
          path="/success"
          element={
            <main className="mx-auto max-w-7xl px-4 py-12">
              <Success />
            </main>
          }
        />
        <Route
          path="/cancel"
          element={
            <main className="mx-auto max-w-7xl px-4 py-12">
              <Cancel />
            </main>
          }
        />
      </Routes>
  {/* Don't show global Footer on admin routes (admin has own layout) */}
  {!location.pathname.startsWith('/admin') && <Footer />}

      {/* Modal routes: these render on top when navigated with location.state.background */}
      {background && (
        <Routes>
          <Route
            path="/signin"
            element={
              <AuthLayout>
                <SignIn />
              </AuthLayout>
            }
          />
          <Route
            path="/signup"
            element={
              <AuthLayout>
                <SignUp />
              </AuthLayout>
            }
          />
          <Route
            path="/signup-compact"
            element={
              <AuthLayout>
                <SignUpCompact />
              </AuthLayout>
            }
          />
          <Route
            path="/forgot-password"
            element={
              <AuthLayout>
                <ForgotPassword />
              </AuthLayout>
            }
          />
          <Route
            path="/otp"
            element={
              <AuthLayout>
                <OtpVerification />
              </AuthLayout>
            }
          />
        </Routes>
      )}
    </div>
  );
}
