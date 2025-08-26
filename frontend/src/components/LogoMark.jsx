export default function LogoMark() {
  console.log("LogoMark render");
  return (
    <svg
      aria-hidden
      viewBox="0 0 32 32"
      className="h-7 w-7 drop-shadow-[0_1px_10px_rgba(180,140,255,0.5)]"
    >
      <defs>
        <linearGradient id="g" x1="0" x2="1" y1="1" y2="0">
          <stop offset="0%" stopColor="#7C3AED" />
          <stop offset="50%" stopColor="#A78BFA" />
          <stop offset="100%" stopColor="#38BDF8" />
        </linearGradient>
      </defs>
      <path
        d="M16 2.5c.5 0 1 .13 1.44.39l9 5.2A2.5 2.5 0 0 1 28 10.2v11.6c0 .9-.48 1.73-1.26 2.18l-9 5.2c-.88.5-1.96.5-2.84 0l-9-5.2A2.5 2.5 0 0 1 4 21.8V10.2c0-.9.48-1.73 1.26-2.18l9-5.2c.44-.26.94-.39 1.44-.39Z"
        fill="url(#g)"
      />
      <path
        d="M10.5 16.5l3.3 3.3 7.7-7.7"
        fill="none"
        stroke="white"
        strokeWidth="2.25"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity=".95"
      />
    </svg>
  );
}
