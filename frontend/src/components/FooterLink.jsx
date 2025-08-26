export default function FooterLink({ href, children }) {
  console.log("FooterLink render", { href });
  return (
    <li>
      <a href={href} className="hover:text-white" onClick={() => console.log("Footer link click", href) }>
        {children}
      </a>
    </li>
  );
}
