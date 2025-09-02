import React from "react";
import PrimaryButton from "../auth/PrimaryButton";
import { useNavigate } from "react-router-dom";
import PreviewCard from "../PreviewCard";

export default function AiPornIndex(){
  const navigate = useNavigate();
  return (
  <section className="w-full max-w-3xl bg-white/3 rounded-2xl border border-white/8 p-8 sm:p-10 shadow-lg mx-auto">
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="grid h-9 w-9 place-items-center rounded-full border border-white/10 hover:bg-white/5"
            aria-label="Back"
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M15 6 9 12l6 6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <h1 className="text-3xl font-semibold">AI Porn Generator</h1>
        </div>
        <p className="text-white/80">Choose an option below to get started. Both generators follow the site theme and will open in this UI.</p>
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            {/* Row 1: Text blocks */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold">AI Porn Image Generator</h3>
              <p className="text-white/70">Generate high-quality images from text prompts. Customize style, resolution and more.</p>
            </div>
            <div className="space-y-3">
              <h3 className="text-lg font-semibold">AI Porn Video Generator</h3>
              <p className="text-white/70">Create short video clips from prompts. Configure length, fps and visual style.</p>
            </div>

            {/* Row 2: Previews */}
            <div className="space-y-3">
              <p className="text-white/70">Preview (Image)</p>
              <PreviewCard name="Sample image" likes="0" />
              <div className="mt-3">
                <PrimaryButton onClick={()=>navigate('/ai-porn/image')}>Select Image Generator</PrimaryButton>
              </div>
            </div>
            <div className="space-y-3">
              <p className="text-white/70">Preview (Video)</p>
              <PreviewCard variant="video" name="Sample video" likes="0" />
              <div className="mt-3">
                <button onClick={()=>navigate('/ai-porn/video')} className="w-full rounded-2xl border border-white/10 px-5 py-4 text-base font-medium text-white hover:bg-white/5">Select Video Generator</button>
              </div>
            </div>
          </div>
        </div>
        <div className="pt-2">
          <button onClick={() => navigate(-1)} className="rounded-md border px-4 py-2 text-sm text-white/90 hover:bg-white/5">Back</button>
        </div>
      </div>
    </section>
  );
}
