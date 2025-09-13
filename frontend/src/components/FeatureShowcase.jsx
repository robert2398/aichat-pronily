import { Sparkles } from "lucide-react";
import ImageFrame from "./ImageFrame";
// import the image via Vite so we get a URL that works in production
import showcaseImg from "../../assets/home/6th section/image.png?url";

export default function FeatureShowcase() {
  console.log("FeatureShowcase render");
  
  const showcase = [
    { src: showcaseImg, alt: "Showcase Image" },
  ];
  
  const bullets = [ { title: "AI Generated Porn to Help You Cum", body: "Porn videos making it hard to cum? No more of that! Get ready to drench your pants and bed with your own cum with Pornily! Design jaw-dropping sex pictures and videos, and calm your excited dick with AI generated porn. " }, { title: "Custom Experiences Made with AI Porn Creator", body: "Unleash brute force with Pornily's AI porn generator. Big luscious tits, tight pussies, and wide asses, everything you want is at your command. Turn your wildest lusts into custom AI porn visuals that make your dick twitch with excitement." }, { title: "Porn Creation & Sexting Combined in One", body: "Watch, touch, and tease your fucking dirty mind with Pornily. Try our AI porn chatbot for sex chat with your sex partners virtually. This is the hottest AI porn app ever for incessant orgasms." }, ];
  
  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-16">
      <h3 className="text-center text-3xl font-semibold tracking-tight">
        Why Our Product Stands Out
      </h3>
  <div className="mt-8 rounded-3xl border border-white/10 bg-white/[.03] p-6 sm:p-8 lg:p-10">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:items-center relative z-10">
          
          {/* Single image instead of grid of three */}
          <div>
            <ImageFrame 
              src={showcase[0].src} 
              alt={showcase[0].alt} 
              className="w-full rounded-xl object-cover aspect-[4/3]" 
            />
          </div>
          
          {/* Bullets */}
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
              <a
                href="#generate"
                className="inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-medium text-white bg-gradient-to-r from-fuchsia-500 to-sky-500 shadow-[0_6px_18px_rgba(79,70,229,0.12)]"
                onClick={() => console.log("Showcase Generate Now click")}
              >
                <Sparkles className="h-4 w-4" /> Generate Now
              </a>
            </div>
          </div>
          
        </div>
      </div>
    </section>
  );
}
