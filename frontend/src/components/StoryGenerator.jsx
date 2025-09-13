import storyBg from "../../assets/home/Story Generator/Story Generator.png?url";

export default function StoryGenerator() {
  console.log("StoryGenerator render");
  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-16" id="story">
      <h3 className="text-2xl sm:text-3xl font-semibold tracking-tight">Story Generator</h3>
      <div className="mt-6 overflow-hidden rounded-3xl border border-white/10 bg-transparent">
        <div className="relative aspect-[16/6] w-full">
          {/* background image (blurred and slightly scaled) */}
          {storyBg && (
            <img
              src={storyBg}
              alt="Story Generator"
              className="absolute inset-0 h-full w-full object-cover transform scale-105 filter blur-[4px]"
              style={{ objectPosition: 'center' }}
            />
          )}

          {/* radial vignette to match Figma (lighter center, dark edges) */}
          <div aria-hidden className="absolute inset-0 bg-[radial-gradient(50%_35%_at_50%_50%,rgba(0,0,0,0.15),rgba(0,0,0,0.6)_70%)]" />

          {/* subtle inner highlight to mimic the sample */}
          <div aria-hidden className="absolute inset-0 bg-[radial-gradient(60%_40%_at_50%_50%,rgba(255,255,255,0.06),rgba(255,255,255,0)_40%)] mix-blend-overlay" />

          <div className="absolute inset-0 grid place-items-center z-10">
            <span className="text-4xl sm:text-5xl font-semibold text-white/95">Coming Soon</span>
          </div>
        </div>
      </div>
    </section>
  );
}
