import { Bell, ChevronDown, CircleHelp, FileText, Gauge, Laptop, LogOut, Menu, MonitorCog, Package, Settings, Users, Wrench, X } from "lucide-react";
import { useState, type ElementType, type ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { BrandMark } from "./BrandMark";

type Role = "Admin" | "Staff" | "Technician";

const roleNav: Record<Role, { label: string; icon: ElementType; href: string }[]> = {
  Admin: [
    { label: "Dashboard", icon: Gauge, href: "/app/dashboard" },
    { label: "Service Requests", icon: FileText, href: "/app/service-requests" },
    { label: "Customers", icon: Users, href: "/app/customers" },
    { label: "Technicians", icon: Wrench, href: "/app/technicians" },
    { label: "Services & Pricing", icon: Package, href: "/app/services" },
    { label: "Notifications", icon: Bell, href: "/app/notifications" },
    { label: "Reports", icon: MonitorCog, href: "/app/reports" },
    { label: "Settings", icon: Settings, href: "/app/settings" },
  ],
  Staff: [
    { label: "Dashboard", icon: Gauge, href: "/app/dashboard" },
    { label: "Service Requests", icon: FileText, href: "/app/service-requests" },
    { label: "Customers", icon: Users, href: "/app/customers" },
    { label: "Technicians", icon: Wrench, href: "/app/technicians" },
    { label: "Notifications", icon: Bell, href: "/app/notifications" },
  ],
  Technician: [
    { label: "Dashboard", icon: Gauge, href: "/app/dashboard" },
    { label: "My Repairs", icon: Laptop, href: "/app/my-repairs" },
    { label: "Notifications", icon: Bell, href: "/app/notifications" },
    { label: "Settings", icon: Settings, href: "/app/settings" },
  ],
};

export function AppShell({ children }: { children: ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [role, setRole] = useState<Role>("Admin");
  const location = useLocation();
  const navItems = roleNav[role];

  return (
    <div className="min-h-screen bg-[#f5f4f1] text-[#252525]">
      <aside className={`fixed inset-y-0 left-0 z-40 flex w-[270px] flex-col bg-[#252525] px-5 py-6 text-white transition-transform duration-300 lg:translate-x-0 ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="mb-9 flex items-center justify-between"><BrandMark inverse /><button onClick={() => setMobileOpen(false)} className="rounded-lg p-2 text-white/60 hover:bg-white/10 lg:hidden"><X size={18} /></button></div>
        <div className="mb-5 rounded-2xl border border-white/10 bg-white/[0.06] p-2">
          <div className="px-2 pb-2 text-[0.6rem] font-bold uppercase tracking-[0.18em] text-white/35">Viewing as</div>
          <div className="grid grid-cols-3 gap-1">
            {(Object.keys(roleNav) as Role[]).map((item) => <button key={item} onClick={() => setRole(item)} className={`rounded-lg px-1 py-2 text-[0.62rem] font-bold transition-colors ${role === item ? "bg-[#B4232C] text-white" : "text-white/50 hover:bg-white/10 hover:text-white"}`}>{item}</button>)}
          </div>
        </div>
        <div className="mb-3 px-3 text-[0.65rem] font-bold uppercase tracking-[0.2em] text-white/35">Workspace</div>
        <nav className="space-y-1">
          {navItems.map(({ label, icon: Icon, href }) => {
            const active = location.pathname === href || (href === "/app/dashboard" && location.pathname === "/app");
            return <Link key={label} to={href} onClick={() => setMobileOpen(false)} className={`flex items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-semibold transition-all ${active ? "bg-white text-[#252525] shadow-sm" : "text-white/60 hover:bg-white/10 hover:text-white"}`}><Icon size={17} strokeWidth={active ? 2.5 : 2} />{label}</Link>;
          })}
        </nav>
        <div className="mt-auto space-y-3">
          <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-4"><div className="flex items-center gap-3"><div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#F3C7C6] text-sm font-bold text-[#8b2028]">FP</div><div><div className="text-sm font-bold">FixPoint Team</div><div className="text-xs text-white/45">{role} workspace</div></div></div></div>
          <button className="flex w-full items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-semibold text-white/50 transition-colors hover:bg-white/10 hover:text-white"><LogOut size={17} />Log out <span className="ml-auto text-[0.6rem] uppercase tracking-widest text-white/30">Soon</span></button>
        </div>
      </aside>
      {mobileOpen && <button aria-label="Close sidebar" onClick={() => setMobileOpen(false)} className="fixed inset-0 z-30 bg-[#252525]/40 lg:hidden" />}
      <div className="lg:pl-[270px]">
        <header className="sticky top-0 z-20 flex h-[76px] items-center justify-between border-b border-[#e5e2dd] bg-[#f5f4f1]/95 px-5 backdrop-blur sm:px-8">
          <div className="flex items-center gap-3"><button onClick={() => setMobileOpen(true)} className="rounded-xl border border-[#dedbd6] bg-white p-2.5 lg:hidden"><Menu size={19} /></button><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-[#9a9690]">{role} workspace</p><h1 className="font-display text-xl font-bold tracking-[-0.03em]">{location.pathname === "/app" || location.pathname === "/app/dashboard" ? "Good morning, team" : navItems.find((item) => item.href === location.pathname)?.label || "Workspace"}</h1></div></div>
          <div className="flex items-center gap-2 sm:gap-5"><button className="relative rounded-xl p-2.5 text-[#77736e] hover:bg-white"><Bell size={19} /><span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-[#B4232C]" /></button><div className="hidden h-8 w-px bg-[#dedbd6] sm:block" /><button className="flex items-center gap-2 rounded-xl p-1.5 pr-2 hover:bg-white"><span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#F3C7C6] text-sm font-bold text-[#8b2028]">FP</span><span className="hidden text-left sm:block"><span className="block text-sm font-bold">FixPoint Team</span><span className="block text-[0.65rem] text-[#9a9690]">{role} access</span></span><ChevronDown size={15} className="hidden text-[#9a9690] sm:block" /></button></div>
        </header>
        <main className="p-5 sm:p-8">{children}</main>
      </div>
    </div>
  );
}

export function ShellPlaceholder({ title }: { title: string }) {
  return <div className="mx-auto max-w-6xl"><div className="mb-8 flex items-end justify-between gap-4"><div><p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-[#B4232C]">FixPoint workspace</p><h2 className="font-display text-3xl font-bold tracking-[-0.05em] sm:text-4xl">{title}</h2><p className="mt-2 max-w-xl text-sm leading-6 text-[#77736e]">This workspace is ready for the next build step. The visual foundation is in place without connected data or account actions.</p></div><button className="hidden items-center gap-2 rounded-xl border border-[#dedbd6] bg-white px-4 py-3 text-sm font-bold text-[#5F5B57] sm:flex"><CircleHelp size={16} />Guide</button></div><div className="rounded-[1.5rem] border border-dashed border-[#d7d3ce] bg-white/50 p-8 text-center sm:p-16"><div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#fff0ef] text-[#B4232C]"><Wrench size={25} /></div><h3 className="font-display text-xl font-bold">{title} will live here</h3><p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#85817b]">No mock records or pretend backend behavior have been added. Connect this section when the next product step is ready.</p></div></div>;
}
