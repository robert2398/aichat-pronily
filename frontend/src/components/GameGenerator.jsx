export default function GameGenerator() {
  console.log("GameGenerator render");
  const topSrc = "";
  const bottomSrc = "";
  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-12" id="game">
      <h3 className="text-2xl sm:text-3xl font-semibold tracking-tight text-center sm:text-left">Interactive Game Generator</h3>
      <div className="mt-6 overflow-hidden rounded-3xl border border-white/10 bg-white/[.04]">
        <div className="relative grid grid-rows-2">
          <div className="relative aspect-[16/5] w-full">
            {topSrc ? (
              <img src={topSrc} alt="Game top" className="absolute inset-0 h-full w-full object-cover" />
            ) : (
              <div aria-hidden className="absolute inset-0 bg-[radial-gradient(60%_60%_at_50%_50%,rgba(255,255,255,0.2),rgba(255,255,255,0)_70%)]" />
            )}
            <div className="absolute inset-0 bg-black/30" />
          </div>
          <div className="relative aspect-[16/5] w-full">
            {bottomSrc ? (
              <img src={bottomSrc} alt="Game bottom" className="absolute inset-0 h-full w-full object-cover" />
            ) : (
              <div aria-hidden className="absolute inset-0 bg-[radial-gradient(60%_60%_at_50%_50%,rgba(255,255,255,0.2),rgba(255,255,255,0)_70%)]" />
            )}
            <div className="absolute inset-0 bg-black/30" />
          </div>
          <div className="pointer-events-none absolute inset-0 grid place-items-center">
            <span className="text-4xl sm:text-5xl font-semibold text-white/95 drop-shadow">Coming Soon</span>
          </div>
        </div>
      </div>
    </section>
  );
}
