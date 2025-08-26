import { Sparkles } from "lucide-react";

export default function FeaturesGrid() {
  console.log("FeaturesGrid render");
  const items = Array.from({ length: 6 }, (_, i) => ({
    id: i + 1,
    title: "Ipsum is simply dummy",
    body:
      "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s.",
  }));
  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-12">
      <h3 className="text-center text-3xl font-semibold tracking-tight">Lorem Ipsum is simply</h3>
      <div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
        {items.map((it) => (
          <div
            key={it.id}
            className="rounded-3xl border border-white/10 bg-white/[.03] p-8 text-center shadow-[0_0_0_1px_rgba(255,255,255,0.05)_inset]"
          >
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-pink-500">
              <Sparkles className="h-7 w-7 text-white" aria-hidden />
            </div>
            <h4 className="mt-5 text-xl font-semibold">{it.title}</h4>
            <p className="mt-3 text-sm text-white/75 max-w-prose mx-auto">{it.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
