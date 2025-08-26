import { Plus } from "lucide-react";

export default function Promo() {
  console.log("Promo render");
  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-12">
      <div className="rounded-3xl border border-white/10 bg-white/[.03] p-6 sm:p-8 lg:p-10">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 lg:items-center">
          <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/[.04] aspect-[4/5]">
            <div aria-hidden className="absolute inset-0 bg-[radial-gradient(75%_60%_at_50%_30%,rgba(255,255,255,0.18),rgba(255,255,255,0)_70%)]" />
            <div aria-hidden className="absolute inset-0 rounded-2xl shadow-[inset_0_-1px_0_0_rgba(255,255,255,0.12)]" />
          </div>
          <div className="px-1">
            <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight">
              <span className="bg-gradient-to-r from-pink-400 to-pink-500 bg-clip-text text-transparent">Lorem Ipsum</span>
              <span className="text-white"> is simply is dummy text</span>
            </h2>
            <p className="mt-3 text-sm text-white/75 max-w-prose">
              Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s.
            </p>
            <div className="mt-4">
              <a href="#generate" className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-fuchsia-500 to-sky-500 shadow-[0_0_0_1px_rgba(255,255,255,0.12)_inset]" onClick={() => console.log("Promo Generate Now click") }>
                <Plus className="h-4 w-4" /> Generate Now
              </a>
            </div>
          </div>
          <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/[.04] aspect-[4/5] max-w-[220px] justify-self-end hidden lg:block">
            <div aria-hidden className="absolute inset-0 bg-[radial-gradient(75%_60%_at_50%_30%,rgba(255,255,255,0.18),rgba(255,255,255,0)_70%)]" />
            <div aria-hidden className="absolute inset-0 rounded-2xl shadow-[inset_0_-1px_0_0_rgba(255,255,255,0.12)]" />
          </div>
        </div>
      </div>
    </section>
  );
}
