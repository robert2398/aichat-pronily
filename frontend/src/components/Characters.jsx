import { useState } from "react";
import { ChevronDown, SlidersHorizontal, Heart, Eye } from "lucide-react";
import CharacterCard from "./CharacterCard";

export default function Characters() {
  const [style, setStyle] = useState("all");
  console.log("Characters render", { style });
  const data = [
    { id: 1, name: "Luna, 20", style: "realistic", likes: "1.5k", views: "1M" },
    { id: 2, name: "Luna, 20", style: "realistic", likes: "1.5k", views: "1M" },
    { id: 3, name: "Luna, 20", style: "realistic", likes: "1.5k", views: "1M" },
    { id: 4, name: "Luna, 20", style: "realistic", likes: "1.5k", views: "1M" },
    { id: 5, name: "Luna, 20", style: "realistic", likes: "1.5k", views: "1M" },
    { id: 6, name: "Luna, 20", style: "realistic", likes: "1.5k", views: "1M" },
    { id: 7, name: "Luna, 20", style: "realistic", likes: "1.5k", views: "1M" },
    { id: 8, name: "Luna, 20", style: "realistic", likes: "1.5k", views: "1M" },
    { id: 9, name: "Luna, 20", style: "realistic", likes: "1.5k", views: "1M" },
    { id: 10, name: "Luna, 20", style: "realistic", likes: "1.5k", views: "1M" },
    { id: 11, name: "Luna, 20", style: "anime", likes: "1.5k", views: "1M" },
    { id: 12, name: "Luna, 20", style: "anime", likes: "1.5k", views: "1M" },
    { id: 13, name: "Luna, 20", style: "anime", likes: "1.5k", views: "1M" },
    { id: 14, name: "Luna, 20", style: "realistic", likes: "1.5k", views: "1M" },
    { id: 15, name: "Luna, 20", style: "realistic", likes: "1.5k", views: "1M" },
  ];
  const filtered = data.filter((c) => (style === "all" ? true : c.style === style));
  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-16">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight">Pronily Character</h2>
        <div className="flex items-center gap-2">
          <button type="button" className="relative rounded-xl px-3 py-1.5 text-sm/6 text-white/90 hover:bg-white/5" onClick={() => { console.log("Gender tab click"); }}>
            <span className="inline-flex items-center gap-1.5">Gender <ChevronDown className="h-4 w-4 opacity-70" /></span>
            <span aria-hidden className="absolute left-3 -bottom-0.5 h-[2px] w-10 rounded-full bg-pink-500" />
          </button>
          <button onClick={() => { console.log("Style change", "realistic"); setStyle("realistic"); }} className={`${style === "realistic" ? "bg-white/10" : "hover:bg-white/5"} rounded-xl px-3 py-1.5 text-sm/6 text-white/90`}>
            Realistic
          </button>
          <button onClick={() => { console.log("Style change", "anime"); setStyle("anime"); }} className={`${style === "anime" ? "bg-white/10" : "hover:bg-white/5"} rounded-xl px-3 py-1.5 text-sm/6 text-white/90`}>
            Anime
          </button>
        </div>
      </div>
      <div className="mt-4 flex items-center justify-end gap-2">
        <button className="inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-sm/6 text-white/90 ring-1 ring-inset ring-white/15 hover:bg-white/5" onClick={() => console.log("Filter click") }>
          <SlidersHorizontal className="h-4 w-4" /> Filter
        </button>
        <button onClick={() => { console.log("Style change", "all"); setStyle("all"); }} className="rounded-xl px-3 py-1.5 text-sm/6 text-white/90 ring-1 ring-inset ring-white/15 hover:bg-white/5">
          All Models
        </button>
      </div>
      <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {filtered.map((c) => (
          <CharacterCard key={c.id} {...c} />
        ))}
      </div>
      <div className="mt-6 flex justify-center">
        <button className="rounded-full px-5 py-2 text-sm/6 text-white/90 bg-white/10 hover:bg-white/15 ring-1 ring-inset ring-white/15" onClick={() => console.log("Load More click") }>
          Load More
        </button>
      </div>
    </section>
  );
}
