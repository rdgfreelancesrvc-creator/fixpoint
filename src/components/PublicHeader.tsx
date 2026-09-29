import { Menu, X } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { BrandMark } from "./BrandMark";

const links = [
  { label: "Home", href: "/" },
  { label: "Services", href: "/#services" },
  { label: "How It Works", href: "/#how-it-works" },
  { label: "About", href: "/#about" },
  { label: "Contact", href: "/#contact" },
];

export function PublicHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="absolute inset-x-0 top-0 z-30">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 sm:px-8 lg:px-10">
        <Link to="/" aria-label="FixPoint home"><BrandMark /></Link>
        <nav className="hidden items-center gap-7 lg:flex" aria-label="Primary navigation">
          {links.map((link) => <a key={link.label} href={link.href} className="text-sm font-semibold text-[#5F5B57] transition-colors hover:text-[#B4232C]">{link.label}</a>)}
        </nav>
        <div className="hidden items-center gap-5 lg:flex">
          <Link to="/track" className="text-sm font-bold text-[#B4232C] transition-colors hover:text-[#8f1f27]">Track My Repair</Link>
          <Link to="/login" className="text-xs font-bold uppercase tracking-[0.12em] text-[#5F5B57] transition-colors hover:text-[#B4232C]">Staff Login</Link>
          <Link to="/request" className="rounded-full bg-[#B4232C] px-5 py-3 text-sm font-bold text-white shadow-[0_10px_22px_rgba(180,35,44,0.2)] transition-transform hover:-translate-y-0.5">Request a Repair <span className="ml-1">↗</span></Link>
        </div>
        <button aria-label={open ? "Close menu" : "Open menu"} onClick={() => setOpen(!open)} className="rounded-xl border border-[#dedbd6] bg-white p-2.5 text-[#252525] lg:hidden">
          {open ? <X size={21} /> : <Menu size={21} />}
        </button>
      </div>
      {open && (
        <div className="mx-4 rounded-2xl border border-[#e8e4df] bg-white p-4 shadow-xl lg:hidden">
          <nav className="flex flex-col gap-1" aria-label="Mobile navigation">
            {links.map((link) => <a onClick={() => setOpen(false)} key={link.label} href={link.href} className="rounded-xl px-4 py-3 text-sm font-semibold text-[#5F5B57] hover:bg-[#f7f5f2]">{link.label}</a>)}
            <Link onClick={() => setOpen(false)} to="/track" className="rounded-xl px-4 py-3 text-sm font-semibold text-[#B4232C] hover:bg-[#fff4f3]">Track My Repair</Link>
            <Link onClick={() => setOpen(false)} to="/request" className="mt-2 rounded-xl bg-[#B4232C] px-4 py-3 text-center text-sm font-bold text-white">Request a Repair</Link>
            <Link onClick={() => setOpen(false)} to="/login" className="px-4 py-3 text-center text-xs font-bold uppercase tracking-[0.12em] text-[#77736e]">Staff Login</Link>
          </nav>
        </div>
      )}
    </header>
  );
}
