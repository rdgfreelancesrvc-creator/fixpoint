import { ArrowUpRight, ClipboardList, Users, Wrench } from "lucide-react";
import { Link } from "react-router-dom";
import { AppShell, ShellPlaceholder } from "@/components/AppShell";

export default function AdminDashboard() {
  return (
    <AppShell>
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-[#B4232C]">Overview</p>
            <h2 className="font-display text-3xl font-bold tracking-[-0.05em] sm:text-4xl">Your service desk, ready.</h2>
            <p className="mt-2 max-w-xl text-sm leading-6 text-[#77736e]">A calm home base for managing the work that keeps your customers moving.</p>
          </div>
          <button className="flex items-center gap-2 self-start rounded-xl bg-[#B4232C] px-4 py-3 text-sm font-bold text-white shadow-sm sm:self-auto">New request <ArrowUpRight size={16} /></button>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-[#e5e2dd] bg-white p-5"><div className="flex items-center justify-between"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#fff0ef] text-[#B4232C]"><ClipboardList size={19} /></span><span className="text-xs font-bold uppercase tracking-[0.12em] text-[#aaa59e]">Next step</span></div><p className="mt-6 font-display text-2xl font-bold">Service Requests</p><p className="mt-1 text-sm text-[#8b867f]">Your request queue will appear here.</p></div>
          <div className="rounded-2xl border border-[#e5e2dd] bg-white p-5"><div className="flex items-center justify-between"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#f2f0ec] text-[#5f5b57]"><Users size={19} /></span><span className="text-xs font-bold uppercase tracking-[0.12em] text-[#aaa59e]">Workspace</span></div><p className="mt-6 font-display text-2xl font-bold">Customers</p><p className="mt-1 text-sm text-[#8b867f]">Customer records will live here.</p></div>
          <div className="rounded-2xl border border-[#e5e2dd] bg-white p-5"><div className="flex items-center justify-between"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#f2f0ec] text-[#5f5b57]"><Wrench size={19} /></span><span className="text-xs font-bold uppercase tracking-[0.12em] text-[#aaa59e]">Workspace</span></div><p className="mt-6 font-display text-2xl font-bold">Technicians</p><p className="mt-1 text-sm text-[#8b867f]">Team management will live here.</p></div>
        </div>
        <div className="mt-8 grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="rounded-[1.5rem] border border-dashed border-[#d7d3ce] bg-white/60 p-7 sm:p-9"><div className="flex items-center justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-[#B4232C]">Activity</p><h3 className="mt-2 font-display text-2xl font-bold">Recent service activity</h3></div><Link to="/app/service-requests" className="text-sm font-bold text-[#B4232C]">View section <ArrowUpRight size={15} className="inline" /></Link></div><div className="mt-12 text-center"><p className="text-sm font-semibold text-[#6f6a64]">No connected activity yet</p><p className="mx-auto mt-2 max-w-xs text-sm leading-6 text-[#9a9690]">This initial foundation intentionally contains no mock records.</p></div></div>
          <div className="rounded-[1.5rem] bg-[#252525] p-7 text-white sm:p-9"><p className="text-xs font-bold uppercase tracking-[0.16em] text-[#F06B70]">Build note</p><h3 className="mt-3 font-display text-2xl font-bold leading-tight">A thoughtful system starts with a clear foundation.</h3><p className="mt-4 text-sm leading-6 text-white/50">Roles, navigation, and workspace structure are ready for the next product layer.</p></div>
        </div>
      </div>
    </AppShell>
  );
}

export function AdminSection({ title }: { title: string }) {
  return <AppShell><ShellPlaceholder title={title} /></AppShell>;
}
