import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, ChevronRight, ClipboardList, Loader2, ShieldAlert, Wrench } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { AppShell } from "@/components/AppShell";
import { formatRequestDate, formatRequestDateTime, formatRequestStatus, getTechnicianActiveRepairCount, getTechnicianRepair, listTechnicianRepairs, type TechnicianRepair, type TechnicianRepairDetail } from "@/lib/adminServiceRequests";

function StatusBadge({ status }: { status: TechnicianRepair["status"] }) {
  return <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ${status === "completed" ? "bg-[#edf8f0] text-[#267342]" : status === "cancelled" ? "bg-[#f2f0ec] text-[#77736e]" : "bg-[#fff0ef] text-[#8f1f27]"}`}><span className={`h-1.5 w-1.5 rounded-full ${status === "completed" ? "bg-[#38a863]" : status === "cancelled" ? "bg-[#aaa59e]" : "bg-[#B4232C]"}`} />{formatRequestStatus(status)}</span>;
}

function RepairCard({ repair }: { repair: TechnicianRepair }) {
  return <Link to={`/app/my-repairs/${repair.id}`} className="block rounded-[1.5rem] border border-[#e5e2dd] bg-white p-5 shadow-[0_12px_35px_rgba(37,37,37,0.04)] transition-shadow hover:shadow-[0_16px_36px_rgba(37,37,37,0.08)]"><div className="flex items-start justify-between gap-3"><div><p className="font-display text-lg font-bold text-[#2f2c29]">{repair.request_number}</p><p className="mt-1 text-sm font-semibold text-[#5f5b57]">{repair.customer_name}</p></div><StatusBadge status={repair.status} /></div><div className="mt-5 grid grid-cols-2 gap-4 border-t border-[#eeeae5] pt-4"><div><p className="text-[0.68rem] font-bold uppercase tracking-[0.12em] text-[#aaa59e]">Device</p><p className="mt-1 text-sm font-semibold text-[#4e4a46]">{[repair.brand, repair.model].filter(Boolean).join(" ") || repair.device_type}</p></div><div><p className="text-[0.68rem] font-bold uppercase tracking-[0.12em] text-[#aaa59e]">Service</p><p className="mt-1 truncate text-sm text-[#5f5b57]">{repair.service_name || "Service unavailable"}</p></div><div><p className="text-[0.68rem] font-bold uppercase tracking-[0.12em] text-[#aaa59e]">Submitted</p><p className="mt-1 text-sm text-[#6f6a64]">{formatRequestDate(repair.created_at)}</p></div><div><p className="text-[0.68rem] font-bold uppercase tracking-[0.12em] text-[#aaa59e]">Last Updated</p><p className="mt-1 text-sm text-[#6f6a64]">{formatRequestDate(repair.updated_at)}</p></div></div><div className="mt-5 flex items-center justify-end gap-1 text-sm font-bold text-[#B4232C]">View repair <ChevronRight size={16} /></div></Link>;
}

function WorkspaceMessage({ children, error, onRetry }: { children: React.ReactNode; error?: boolean; onRetry?: () => void }) {
  return <div className={`rounded-[1.5rem] border p-12 text-center ${error ? "border-[#efc4c3] bg-[#fff4f3]" : "border-[#e5e2dd] bg-white"}`}>{error ? <ShieldAlert className="mx-auto mb-3 text-[#B4232C]" size={25} /> : <Loader2 className="mx-auto mb-3 animate-spin text-[#B4232C]" size={24} />}<p className={`text-sm font-semibold ${error ? "text-[#8f1f27]" : "text-[#77736e]"}`}>{children}</p>{onRetry && <button type="button" onClick={onRetry} className="mt-5 rounded-xl bg-[#B4232C] px-4 py-2.5 text-sm font-bold text-white">Try again</button>}</div>;
}

export function TechnicianDashboard() {
  const [activeCount, setActiveCount] = useState<number | null>(null);
  const [recentRepairs, setRecentRepairs] = useState<TechnicianRepair[]>([]);
  const [error, setError] = useState<string | null>(null);

  const loadDashboard = useCallback(async () => {
    setError(null);
    try {
      const [count, repairs] = await Promise.all([getTechnicianActiveRepairCount(), listTechnicianRepairs()]);
      setActiveCount(count);
      setRecentRepairs(repairs.slice(0, 3));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Your technician workspace could not be loaded.");
    }
  }, []);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  return <AppShell><div className="mx-auto max-w-6xl"><div className="mb-8"><p className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-[#B4232C]"><Wrench size={14} /> Technician workspace</p><h2 className="font-display text-3xl font-bold tracking-[-0.05em] sm:text-4xl">Your repair desk.</h2><p className="mt-2 max-w-xl text-sm leading-6 text-[#77736e]">Only repairs assigned to your account appear here.</p></div>{error ? <WorkspaceMessage error onRetry={() => void loadDashboard()}>{error}</WorkspaceMessage> : <><div className="grid gap-4 sm:grid-cols-2"><Link to="/app/my-repairs" className="rounded-[1.5rem] border border-[#e5e2dd] bg-white p-6 shadow-[0_12px_35px_rgba(37,37,37,0.04)]"><div className="flex items-center justify-between"><span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#fff0ef] text-[#B4232C]"><ClipboardList size={20} /></span><span className="text-xs font-bold uppercase tracking-[0.12em] text-[#aaa59e]">Live count</span></div><p className="mt-6 font-display text-2xl font-bold">Active Repairs</p><p className="mt-1 text-4xl font-bold text-[#B4232C]">{activeCount === null ? "—" : activeCount}</p></Link><div className="rounded-[1.5rem] bg-[#252525] p-6 text-white"><p className="text-xs font-bold uppercase tracking-[0.15em] text-[#F06B70]">Assigned work only</p><h3 className="mt-3 font-display text-2xl font-bold leading-tight">A focused queue for today’s repairs.</h3><p className="mt-3 text-sm leading-6 text-white/55">Assignment history stays visible on each repair for clear handoffs.</p></div></div><div className="mt-8"><div className="mb-4 flex items-end justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[0.15em] text-[#B4232C]">Queue</p><h3 className="mt-2 font-display text-2xl font-bold">Recent repairs</h3></div><Link to="/app/my-repairs" className="text-sm font-bold text-[#B4232C]">View all <ChevronRight size={15} className="inline" /></Link></div>{recentRepairs.length === 0 ? <div className="rounded-[1.5rem] border border-dashed border-[#d7d3ce] bg-white/60 p-12 text-center"><p className="font-bold">No repairs assigned yet</p><p className="mt-2 text-sm text-[#85817b]">Assigned requests will appear here.</p></div> : <div className="grid gap-4 lg:grid-cols-3">{recentRepairs.map((repair) => <RepairCard key={repair.id} repair={repair} />)}</div>}</div></>}</div></AppShell>;
}

export function TechnicianRepairs() {
  const [repairs, setRepairs] = useState<TechnicianRepair[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const loadRepairs = useCallback(async () => { setIsLoading(true); setError(null); try { setRepairs(await listTechnicianRepairs()); } catch (loadError) { setError(loadError instanceof Error ? loadError.message : "Repairs could not be loaded."); } finally { setIsLoading(false); } }, []);
  useEffect(() => { void loadRepairs(); }, [loadRepairs]);
  return <AppShell><div className="mx-auto max-w-6xl"><div className="mb-8"><p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-[#B4232C]">Technician workspace</p><h2 className="font-display text-3xl font-bold tracking-[-0.05em] sm:text-4xl">My Repairs</h2><p className="mt-2 text-sm leading-6 text-[#77736e]">Your assigned-work queue, secured to your account.</p></div>{isLoading ? <WorkspaceMessage>Loading assigned repairs...</WorkspaceMessage> : error ? <WorkspaceMessage error onRetry={() => void loadRepairs()}>{error}</WorkspaceMessage> : repairs.length === 0 ? <div className="rounded-[1.5rem] border border-dashed border-[#d7d3ce] bg-white/60 p-12 text-center"><p className="font-bold">No repairs assigned yet</p><p className="mt-2 text-sm text-[#85817b]">New assignments will appear here.</p></div> : <div className="grid gap-4 lg:grid-cols-2">{repairs.map((repair) => <RepairCard key={repair.id} repair={repair} />)}</div>}</div></AppShell>;
}

export function TechnicianRepairDetail() {
  const { requestId } = useParams();
  const [repair, setRepair] = useState<TechnicianRepairDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const loadRepair = useCallback(async () => { if (!requestId) return; setError(null); try { setRepair(await getTechnicianRepair(requestId)); } catch (loadError) { setError(loadError instanceof Error ? loadError.message : "Repair could not be loaded."); } }, [requestId]);
  useEffect(() => { void loadRepair(); }, [loadRepair]);
  return <AppShell><div className="mx-auto max-w-4xl"><Link to="/app/my-repairs" className="mb-5 inline-flex items-center gap-2 text-sm font-bold text-[#B4232C]"><ArrowLeft size={16} /> Back to My Repairs</Link>{error ? <WorkspaceMessage error onRetry={() => void loadRepair()}>{error}</WorkspaceMessage> : !repair ? <WorkspaceMessage>Loading repair...</WorkspaceMessage> : <><div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-[#B4232C]">Assigned repair</p><h2 className="font-display text-3xl font-bold tracking-[-0.05em]">{repair.request_number}</h2><p className="mt-2 text-sm text-[#77736e]">Last updated {formatRequestDateTime(repair.updated_at)}</p></div><StatusBadge status={repair.status} /></div><div className="grid gap-5 md:grid-cols-2"><section className="rounded-[1.5rem] border border-[#e5e2dd] bg-white p-6"><h3 className="font-display text-xl font-bold">Request information</h3><dl className="mt-5 space-y-4"><div><dt className="text-xs font-bold uppercase tracking-[0.12em] text-[#9a9690]">Customer</dt><dd className="mt-1 text-sm font-semibold text-[#4e4a46]">{repair.customer.full_name}</dd></div><div><dt className="text-xs font-bold uppercase tracking-[0.12em] text-[#9a9690]">Device</dt><dd className="mt-1 text-sm font-semibold text-[#4e4a46]">{[repair.brand, repair.model].filter(Boolean).join(" ") || repair.device_type}</dd></div><div><dt className="text-xs font-bold uppercase tracking-[0.12em] text-[#9a9690]">Service</dt><dd className="mt-1 text-sm font-semibold text-[#4e4a46]">{repair.service?.name || "Service unavailable"}</dd></div><div><dt className="text-xs font-bold uppercase tracking-[0.12em] text-[#9a9690]">Submitted</dt><dd className="mt-1 text-sm text-[#6f6a64]">{formatRequestDateTime(repair.created_at)}</dd></div></dl><div className="mt-5 border-t border-[#eeeae5] pt-5"><p className="text-xs font-bold uppercase tracking-[0.12em] text-[#9a9690]">Problem Description</p><p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-[#4e4a46]">{repair.problem_description}</p></div></section><section className="rounded-[1.5rem] border border-[#e5e2dd] bg-white p-6"><h3 className="font-display text-xl font-bold">Assignment History</h3>{repair.assignment_history.length === 0 ? <p className="mt-5 text-sm text-[#817c76]">No assignment history is available.</p> : <ol className="mt-5 space-y-4">{repair.assignment_history.map((item) => <li key={item.id} className="border-b border-[#eeeae5] pb-4 last:border-0"><p className="text-sm font-bold text-[#3e3a36]">{item.action.charAt(0).toUpperCase() + item.action.slice(1)}</p><p className="mt-1 text-sm text-[#4e4a46]">{item.technician_name}</p><p className="mt-1 text-xs text-[#817c76]">by {item.assigned_by_name} · {formatRequestDateTime(item.created_at)}</p></li>)}</ol>}</section></div></>}</div></AppShell>;
}
