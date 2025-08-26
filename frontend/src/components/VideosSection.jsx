import MediaCard from "./MediaCard";

export default function VideosSection() {
  console.log("VideosSection render");
  const items = Array.from({ length: 12 }, (_, i) => ({ id: i + 1, name: "Luna, 20", likes: "1.5k" }));
  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-16">
      <h3 className="text-center text-2xl sm:text-3xl font-semibold tracking-tight">Our AI Porn Videos</h3>
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {items.map((it) => (
          <MediaCard key={it.id} variant="video" name={it.name} likes={it.likes} />
        ))}
      </div>
    </section>
  );
}
