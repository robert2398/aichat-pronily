export default function StoryGenerator() {
  console.log("StoryGenerator render");
  const src = "";
  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-16" id="story">
      <h3 className="text-2xl sm:text-3xl font-semibold tracking-tight">Story Generator</h3>
      <div className="mt-6 overflow-hidden rounded-3xl border border-white/10 bg-white/[.04]">
        <div className="relative aspect-[16/6] w-full">
          {src ? (
            <img src={src} alt="Story Generator" className="absolute inset-0 h-full w-full object-cover" />
          ) : (
            <div aria-hidden className="absolute inset-0 bg-[radial-gradient(60%_60%_at_50%_50%,rgba(255,255,255,0.2),rgba(255,255,255,0)_70%)]" />
          )}
          <div className="absolute inset-0 bg-black/30" />
          <div className="absolute inset-0 grid place-items-center">
            <span className="text-4xl sm:text-5xl font-semibold text-white/95">Coming Soon</span>
          </div>
        </div>
      </div>
    </section>
  );
}
