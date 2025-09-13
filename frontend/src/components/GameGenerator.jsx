import gameBg from "../../assets/home/Interactive Game Generator/Interactive Game Generator.png?url";

export default function GameGenerator() {
  console.log("GameGenerator render");
  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-12" id="game">
      <h3 className="text-2xl sm:text-3xl font-semibold tracking-tight text-center sm:text-left">Interactive Game Generator</h3>
      <div className="mt-6 overflow-hidden rounded-3xl border border-white/10 bg-transparent">
        <div className="relative aspect-[16/6] w-full">
          {gameBg && (
            <img
              src={gameBg}
              alt="Interactive Game Generator"
              className="absolute inset-0 h-full w-full object-cover transform scale-105 filter blur-[4px]"
              style={{ objectPosition: 'center' }}
            />
          )}

          {/* radial vignette and subtle highlight */}
          <div aria-hidden className="absolute inset-0 bg-[radial-gradient(50%_35%_at_50%_50%,rgba(0,0,0,0.15),rgba(0,0,0,0.6)_70%)]" />
          <div aria-hidden className="absolute inset-0 bg-[radial-gradient(60%_40%_at_50%_50%,rgba(255,255,255,0.04),rgba(255,255,255,0)_40%)] mix-blend-overlay" />

          <div className="pointer-events-none absolute inset-0 grid place-items-center z-10">
            <span className="text-4xl sm:text-5xl font-semibold text-white/95 drop-shadow">Coming Soon</span>
          </div>
        </div>
      </div>
    </section>
  );
}
