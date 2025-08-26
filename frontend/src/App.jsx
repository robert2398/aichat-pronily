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
import StoryGenerator from "./components/StoryGenerator";
import GameGenerator from "./components/GameGenerator";
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
import CreateCharacter from "./components/CreateCharacter";
import CreateCharacterSave from "./components/CreateCharacterSave";
import { Routes, Route } from "react-router-dom";
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
            <main className="mx-auto max-w-5xl px-4 py-12">
              <SelectCharacter />
            </main>
          }
        />
        <Route
          path="/ai-porn/image/character-image"
          element={
            <main className="mx-auto max-w-5xl px-4 py-12">
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
            <main className="mx-auto max-w-5xl px-4 py-12">
              <SelectCharacter />
            </main>
          }
        />
        <Route
          path="/ai-porn/video/character-video"
          element={
            <main className="mx-auto max-w-5xl px-4 py-12">
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
          path="/pricing"
          element={
            <main className="mx-auto max-w-7xl px-4 py-12">
              <Pricing />
            </main>
          }
        />
      </Routes>
      <Footer />

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
            path="/forgot"
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
