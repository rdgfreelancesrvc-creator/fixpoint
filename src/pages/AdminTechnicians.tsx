import { useCallback, useEffect, useState } from "react";
import { Loader2, ShieldAlert, Users, Wrench } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { listAssignmentTechnicians, type TechnicianSummary } from "@/lib/adminServiceRequests";

function initials(name: string | null, email: string | null) {
  return (name || email || "T")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function StatusBadge({ active }: { active: boolean }) {
  return <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ${active ? "bg-[#edf8f0] text-[#267342]" : "bg-[#f2f0ec] text-[#77736e]"}`}><span className={`h-1.5 w-1.5 rounded-full ${active ? "bg-[#38a863]" : "bg-[#aaa59e]"}`} />{active ? "Active" : "Inactive"}</span>;
}

export default function AdminTechnicians() {
  const [technicians, setTechnicians] = useState<TechnicianSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadTechnicians = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      setTechnicians(await listAssignmentTechnicians());
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Technicians could not be loaded.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadTechnicians();
  }, [loadTechnicians]);

  return <AppShell><div className="mx-auto max-w-6xl"><div className="mb-8"><p className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-[#B4232C]"><Wrench size={14} /> FixPoint workspace</p><h2 className="font-display text-3xl font-bold tracking-[-0.05em] sm:text-4xl">Technicians</h2><p className="mt-2 max-w-xl text-sm leading-6 text-[#77736e]">View active technician workload and keep assignments balanced.</p></div>{isLoading ? <div className="rounded-[1.5rem] border border-[#e5e2dd] bg-white p-12 text-center text-sm font-semibold text-[#77736e]"><Loader2 className="mx-auto mb-3 animate-spin text-[#B4232C]" size={24} />Loading technician workload...</div> : error ? <div className="rounded-[1.5rem] border border-[#efc4c3] bg-[#fff4f3] p-8 text-center" role="alert"><ShieldAlert className="mx-auto mb-3 text-[#B4232C]" size={25} /><p className="font-bold text-[#8f1f27]">Technicians could not be loaded</p><p className="mt-2 text-sm text-[#a64a4e]">{error}</p><button type="button" onClick={() => void loadTechnicians()} className="mt-5 rounded-xl bg-[#B4232C] px-4 py-2.5 text-sm font-bold text-white">Try again</button></div> : technicians.length === 0 ? <div className="rounded-[1.5rem] border border-dashed border-[#d7d3ce] bg-white/60 p-12 text-center"><Users className="mx-auto mb-3 text-[#aaa59e]" size={25} /><p className="font-bold">No technicians found</p><p className="mt-2 text-sm text-[#85817b]">Technician profiles will appear here when created.</p></div> : <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{technicians.map((technician) => <article key={technician.id} className="rounded-[1.5rem] border border-[#e5e2dd] bg-white p-5 shadow-[0_12px_35px_rgba(37,37,37,0.04)]"><div className="flex items-start justify-between gap-3"><div className="flex items-center gap-3"><span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#f3c7c6] text-sm font-bold text-[#8b2028]">{initials(technician.full_name, technician.email)}</span><div><h3 className="font-display text-lg font-bold">{technician.full_name || "Unnamed technician"}</h3><p className="mt-1 break-all text-xs text-[#817c76]">{technician.email || "No email"}</p></div></div><StatusBadge active={technician.is_active} /></div><div className="mt-5 border-t border-[#eeeae5] pt-4"><p className="text-[0.68rem] font-bold uppercase tracking-[0.12em] text-[#9a9690]">Active Repairs</p><p className="mt-1 font-display text-3xl font-bold text-[#B4232C]">{technician.active_repairs}</p></div>{technician.phone && <p className="mt-4 text-sm text-[#6f6a64]">{technician.phone}</p>}</article>)}</div>}</div></AppShell>;
}
