import { Sparkles, Plus } from "lucide-react";
import ImageFrame from "./ImageFrame";

export default function FeatureShowcase() {
  console.log("FeatureShowcase render");
  const showcase = [
    { src: "", alt: "Showcase 1" },
    { src: "", alt: "Showcase 2" },
    { src: "", alt: "Showcase 3" },
  ];
  const bullets = [
    { title: "Lorem Ipsum is simply", body: "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's" },
    { title: "Lorem Ipsum is simply", body: "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's" },
    { title: "Lorem Ipsum is simply", body: "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's" },
  ];
  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-16">
      <h3 className="text-center text-3xl font-semibold tracking-tight">Lorem Ipsum is simply dummy</h3>
      <div className="mt-8 rounded-3xl border border-white/10 bg-white/[.03] p-6 sm:p-8 lg:p-10">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:items-center">
          <div className="grid grid-cols-2 grid-rows-2 gap-4">
            <ImageFrame src={showcase[0].src} alt={showcase[0].alt} className="aspect-[4/4]" />
            <ImageFrame src={showcase[1].src} alt={showcase[1].alt} className="aspect-[4/4]" />
            <ImageFrame src={showcase[2].src} alt={showcase[2].alt} className="col-span-2 aspect-[16/7]" />
          </div>
          <div>
            <ul className="space-y-6">
              {bullets.map((b, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-pink-500 mt-1">
                    <Sparkles className="h-4 w-4 text-white" aria-hidden />
                  </span>
                  <div>
                    <h4 className="font-semibold">{b.title}</h4>
                    <p className="mt-1 text-sm text-white/75">{b.body}</p>
                  </div>
                </li>
              ))}
            </ul>
            <div className="mt-8">
              <a href="#generate" className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-fuchsia-500 to-sky-500 shadow-[0_0_0_1px_rgba(255,255,255,0.12)_inset]" onClick={() => console.log("Showcase Generate Now click") }>
                <Plus className="h-4 w-4" /> Generate Now
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
