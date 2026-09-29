import { useEffect, useState } from "react";
import { ArrowUpRight, ClipboardList, Users, Wrench } from "lucide-react";
import { Link } from "react-router-dom";
import { AppShell, ShellPlaceholder } from "@/components/AppShell";
import { useAuth } from "@/contexts/AuthContext";
import { getNewRequestsToday } from "@/lib/adminServiceRequests";

export default function AdminDashboard() {
  const { profile } = useAuth();
  const [newRequestsToday, setNewRequestsToday] = useState<number | null>(null);

  useEffect(() => {
    if (profile?.role !== "admin" && profile?.role !== "staff") return;
    void getNewRequestsToday().then(setNewRequestsToday).catch(() => setNewRequestsToday(null));
  }, [profile?.role]);

  return (
    <AppShell>
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-[#B4232C]">Overview</p>
            <h2 className="font-display text-3xl font-bold tracking-[-0.05em] sm:text-4xl">Your service desk, ready.</h2>
            <p className="mt-2 max-w-xl text-sm leading-6 text-[#77736e]">A calm home base for managing the work that keeps your customers moving.</p>
          </div>
          <Link to="/app/requests" className="flex items-center gap-2 self-start rounded-xl bg-[#B4232C] px-4 py-3 text-sm font-bold text-white shadow-sm sm:self-auto">Open request queue <ArrowUpRight size={16} /></Link>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <Link to="/app/requests" className="rounded-2xl border border-[#e5e2dd] bg-white p-5 transition-shadow hover:shadow-[0_12px_30px_rgba(37,37,37,0.06)]"><div className="flex items-center justify-between"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#fff0ef] text-[#B4232C]"><ClipboardList size={19} /></span><span className="text-xs font-bold uppercase tracking-[0.12em] text-[#aaa59e]">Today</span></div><p className="mt-6 font-display text-2xl font-bold">New Requests Today</p><p className="mt-1 text-3xl font-bold text-[#B4232C]">{newRequestsToday === null ? "—" : newRequestsToday}</p></Link>
          <div className="rounded-2xl border border-[#e5e2dd] bg-white p-5"><div className="flex items-center justify-between"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#f2f0ec] text-[#5f5b57]"><Users size={19} /></span><span className="text-xs font-bold uppercase tracking-[0.12em] text-[#aaa59e]">Workspace</span></div><p className="mt-6 font-display text-2xl font-bold">Customers</p><p className="mt-1 text-sm text-[#8b867f]">Customer records are connected to service requests.</p></div>
          <Link to="/app/technicians" className="rounded-2xl border border-[#e5e2dd] bg-white p-5 transition-shadow hover:shadow-[0_12px_30px_rgba(37,37,37,0.06)]"><div className="flex items-center justify-between"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#f2f0ec] text-[#5f5b57]"><Wrench size={19} /></span><span className="text-xs font-bold uppercase tracking-[0.12em] text-[#aaa59e]">Live workload</span></div><p className="mt-6 font-display text-2xl font-bold">Technicians</p><p className="mt-1 text-sm text-[#8b867f]">View active repairs by technician.</p></Link>
        </div>
        <div className="mt-8 grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="rounded-[1.5rem] border border-[#e5e2dd] bg-white p-7 sm:p-9"><div className="flex items-center justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-[#B4232C]">Activity</p><h3 className="mt-2 font-display text-2xl font-bold">Request queue</h3></div><Link to="/app/requests" className="text-sm font-bold text-[#B4232C]">View requests <ArrowUpRight size={15} className="inline" /></Link></div><div className="mt-12 text-center"><p className="text-sm font-semibold text-[#6f6a64]">Open the queue to manage incoming repairs</p><p className="mx-auto mt-2 max-w-xs text-sm leading-6 text-[#9a9690]">Requests submitted by customers appear there with their real status and history.</p></div></div>
          <div className="rounded-[1.5rem] bg-[#252525] p-7 text-white sm:p-9"><p className="text-xs font-bold uppercase tracking-[0.16em] text-[#F06B70]">FixPoint workflow</p><h3 className="mt-3 font-display text-2xl font-bold leading-tight">Keep every repair moving forward.</h3><p className="mt-4 text-sm leading-6 text-white/50">Review customer details, attachments, and status history before moving a request to its next step.</p></div>
        </div>
      </div>
    </AppShell>
  );
}

export function AdminSection({ title }: { title: string }) {
  return <AppShell><ShellPlaceholder title={title} /></AppShell>;
}
