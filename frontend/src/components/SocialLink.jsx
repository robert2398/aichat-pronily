export default function SocialLink({ href, icon: Icon, label }) {
  console.log("SocialLink render", { href, label });
  return (
    <li>
      <a href={href} className="inline-flex items-center gap-3 hover:text-white" onClick={() => console.log("Social link click", label) }>
        <span className="grid h-7 w-7 place-items-center rounded-full bg-white/10">
          <Icon className="h-4 w-4" aria-hidden />
        </span>
        <span>{label}</span>
      </a>
    </li>
  );
}
