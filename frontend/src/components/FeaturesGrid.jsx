import { Sparkles } from "lucide-react";

export default function FeaturesGrid() {
  console.log("FeaturesGrid render");

  // 🔹 Just edit this array with your own content
  const items = [
    {
      id: 1,
      title: "Free AI Porn Characters for Your Wildest Imagination",
      body: "Are juicy boobs with apple-sized nipples bouncing just the way you like your thing? With free AI porn at Pornily, visuals are made to exactly match your cravings. Forget the boring studios, this is where your wild imagination comes to life, and the thrills of watching sexy bodies crafted to suit your lustful needs.",
    },
    {
      id: 2,
      title: "AI Porn Maker That Pleases Every Desire",
      body: "Do you want to see pussies laid open and heavy butts shaking with heat? This AI porn maker can help you make those scenes. Be the master and dictate every single detail: from body types to positions, this custom AI porn maker fabricates scenes designed to bring pleasure into your life. ",
    },
    {
      id: 3,
      title: "Porn AI That Knows Your Kinks",
      body: "Do you like hot, tight curves or dripping cum fantasies come to life? With porn AI, all your private kinks are finally no longer a dream. You type in the details, and the generator just renders them all hot and steamy. No wait time, no restrictions! Just lusty creations that really make you feel like you are directing your own porn.",
    },
    {
      id: 4,
      title: "Free AI Porn Generator for a Never-Ending Good Time",
      body: "Do you want endless sexy moments with zero limitations? The free AI porn generator gives you options on demand. Soft teasing, sensual teasing, and hard-core lusty visuals; the choice is yours. Watch free, wild, and meant to stimulate your raw cravings with erotic bodies that do not grow tiresome or repetitive. ",
    },
    {
      id: 5,
      title: "AI Generated Porn with Realistic Pleasure",
      body: "Would you love to behold hot bodies crafted in such a way as to feel real and intense? Create AI realistic porn that gives you just that opportunity; every curve, every thrust, every moan is designed to appear the way you like it. This is not recycled content, so consider this your very own fantasy rendered into raw, visual pleasure.",
    },
    {
      id: 6,
      title: "AI Porn Creator to Give You Instant Orgasms ",
      body: "Wanna cum even without jerking off? Explore Pornily’s AI porn video generator to craft hot sex videos. An easy way to explore new lustful ideas: that's what this AI porn creator helps you do. Wild kinky bodies or sweet teasing moments, you say it, and they can all be generated here. Your only place where fantasies meet technology to provide you with the sexiest retreat you have ever dreamed of.",
    },
  ];

  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-12">
      {/* 🔹 Change this heading too */}
      <h3 className="text-center text-3xl font-semibold tracking-tight">
        My Custom Heading
      </h3>

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
            <p className="mt-3 text-sm text-white/75 max-w-prose mx-auto">
              {it.body}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
