import { BadgeCheck, Landmark, CreditCard, ShieldCheck, Instagram, Facebook, Twitter } from "lucide-react";
import { useNavigate } from "react-router-dom";
import FooterLink from "./FooterLink";
import SocialLink from "./SocialLink";
import Badge from "./Badge";

export default function Footer() {
  const navigate = useNavigate();
  console.log("Footer render");
  return (
    <footer className="mt-10 border-t border-white/10">
      <div aria-hidden className="h-0.5 w-full bg-gradient-to-r from-pink-500 via-fuchsia-500 to-sky-500 opacity-70" />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-4">
          <div>
        <a href="#home" className="inline-flex items-center gap-2" aria-label="Pornily home" onClick={(e) => { e.preventDefault(); navigate('/'); }}>
          <img src="/img/Pornily.png" alt="Triple Minds" className="h-8 w-auto" />
            </a>
            <p className="mt-4 max-w-xs text-sm text-white/70">
              Lorem Ipsum is simply dummy text of the printing and typesetting industry.
            </p>
          </div>
          <div>
            <h5 className="text-lg font-semibold">Features</h5>
            <ul className="mt-4 space-y-2 text-sm text-white/80">
              <FooterLink href="#">Cum Facial Generator</FooterLink>
              <FooterLink href="#">AI Sex Simulator</FooterLink>
              <FooterLink href="#">NSFW AI Image Generator</FooterLink>
              <FooterLink href="#">AI Slut</FooterLink>
              <FooterLink href="#">Generate Porn</FooterLink>
            </ul>
          </div>
          <div>
            <h5 className="text-lg font-semibold">Resources</h5>
            <ul className="mt-4 space-y-2 text-sm text-white/80">
              <FooterLink href="#">About</FooterLink>
              <FooterLink href="#">Press & announcements</FooterLink>
              <FooterLink href="#">Careers at Finder</FooterLink>
              <FooterLink href="#">Contact us</FooterLink>
              <FooterLink href="#">Terms of use</FooterLink>
            </ul>
          </div>
          <div>
            <h5 className="text-lg font-semibold">Social Media</h5>
            <ul className="mt-4 space-y-3 text-sm text-white/80">
              <SocialLink href="#" icon={Instagram} label="Triple Minds on Instagram" />
              <SocialLink href="#" icon={Facebook} label="Triple Minds on Facebook" />
              <SocialLink href="#" icon={Twitter} label="Triple Minds on Twitter" />
              <SocialLink href="#" icon={Instagram} label="Triple Minds on Instagram" />
            </ul>
          </div>
        </div>
        <div className="mt-10 h-px w-full bg-white/10" />
        <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-white/60">© All rights reserved.</p>
          <nav className="flex flex-wrap items-center gap-x-8 gap-y-2 text-sm text-white/75">
            <a href="#" className="hover:text-white" onClick={() => console.log("Footer link click", "Terms & Condition") }>Terms & Condition</a>
            <a href="#" className="hover:text-white" onClick={() => console.log("Footer link click", "Refund Policy") }>Refund Policy</a>
            <a href="#" className="hover:text-white" onClick={() => console.log("Footer link click", "Privacy Policy") }>Privacy Policy</a>
          </nav>
          <div className="flex items-center gap-2">
            <Badge icon={BadgeCheck} label="DMCA" />
            <Badge icon={Landmark} label="BANK" />
            <Badge icon={CreditCard} label="AMEX" />
            <Badge icon={ShieldCheck} label="CARD" />
          </div>
        </div>
      </div>
    </footer>
  );
}
