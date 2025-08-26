export default function Badge({ icon: Icon, label }) {
  console.log("Badge render", { label });
  return (
    <span className="inline-flex items-center gap-2 rounded-xl bg-white/8 px-3 py-2 ring-1 ring-inset ring-white/15">
      <Icon className="h-4 w-4" aria-hidden />
      <span className="text-xs font-semibold">{label}</span>
    </span>
  );
}
