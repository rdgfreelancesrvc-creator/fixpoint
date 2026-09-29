import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowLeft, ChevronRight, Download, FileText, History, Loader2, Search, ShieldAlert, Smartphone, UserRound, Wrench } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { AppShell } from "@/components/AppShell";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { listActiveServices, type ServiceCatalogItem } from "@/lib/serviceCatalog";
import {
  assignServiceRequest,
  changeServiceRequestStatus,
  createRequestAttachmentUrl,
  formatFileSize,
  formatRequestDate,
  formatRequestDateTime,
  formatRequestStatus,
  getAllowedRequestTransitions,
  getAssignmentActionLabel,
  getInternalServiceRequest,
  listAssignmentTechnicians,
  listInternalServiceRequests,
  requestStatuses,
  requestStatusLabels,
  type AssignmentHistoryItem,
  type RequestDateFilter,
  type RequestStatus,
  type ServiceRequestDetail,
  type ServiceRequestListItem,
  type TechnicianFilter,
  type TechnicianSummary,
} from "@/lib/adminServiceRequests";
import { toast } from "sonner";

const dateFilters: Array<{ value: RequestDateFilter; label: string }> = [
  { value: "all_time", label: "All Time" },
  { value: "today", label: "Today" },
  { value: "last_7_days", label: "Last 7 Days" },
  { value: "last_30_days", label: "Last 30 Days" },
];

function StatusBadge({ status }: { status: RequestStatus }) {
  return <span className={`inline-flex max-w-full items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ${status === "cancelled" ? "bg-[#f2f0ec] text-[#77736e]" : status === "completed" ? "bg-[#edf8f0] text-[#267342]" : status === "received" ? "bg-[#f2f0ec] text-[#5f5b57]" : "bg-[#fff0ef] text-[#8f1f27]"}`}><span className={`h-1.5 w-1.5 shrink-0 rounded-full ${status === "cancelled" ? "bg-[#aaa59e]" : status === "completed" ? "bg-[#38a863]" : status === "received" ? "bg-[#8b867f]" : "bg-[#B4232C]"}`} />{formatRequestStatus(status)}</span>;
}

function SelectField({ label, value, onChange, children }: { label: string; value: string; onChange: (value: string) => void; children: React.ReactNode }) {
  return <label className="block"><span className="sr-only">{label}</span><select aria-label={label} value={value} onChange={(event) => onChange(event.target.value)} className="h-12 w-full rounded-xl border border-[#dedbd6] bg-[#fbfaf8] px-3 text-sm font-semibold text-[#4e4a46] outline-none transition-colors focus:border-[#B4232C] focus:ring-4 focus:ring-[#B4232C]/10">{children}</select></label>;
}

function technicianLabel(technician: ServiceRequestListItem["assigned_technician"]) {
  if (!technician) return "Unassigned";
  return `${technician.full_name || technician.email || "Former User"}${technician.is_active ? "" : " · Inactive"}`;
}

function RequestCard({ request }: { request: ServiceRequestListItem }) {
  return <Link to={`/app/requests/${request.id}`} className="block p-5 transition-colors hover:bg-[#fffcfa]"><div className="flex items-start justify-between gap-3"><div><p className="font-display text-lg font-bold tracking-[-0.03em] text-[#2f2c29]">{request.request_number}</p><p className="mt-1 text-sm font-semibold text-[#5f5b57]">{request.customer_name}</p></div><StatusBadge status={request.status} /></div><div className="mt-5 grid grid-cols-2 gap-4 border-t border-[#eeeae5] pt-4"><div><p className="text-[0.68rem] font-bold uppercase tracking-[0.12em] text-[#aaa59e]">Device</p><p className="mt-1 truncate text-sm font-semibold text-[#4e4a46]">{[request.brand, request.model].filter(Boolean).join(" ") || request.device_type}</p></div><div><p className="text-[0.68rem] font-bold uppercase tracking-[0.12em] text-[#aaa59e]">Service</p><p className="mt-1 truncate text-sm font-semibold text-[#4e4a46]">{request.service_name || "Service unavailable"}</p></div><div><p className="text-[0.68rem] font-bold uppercase tracking-[0.12em] text-[#aaa59e]">Submitted</p><p className="mt-1 text-sm text-[#6f6a64]">{formatRequestDate(request.created_at)}</p></div><div><p className="text-[0.68rem] font-bold uppercase tracking-[0.12em] text-[#aaa59e]">Assigned Technician</p><p className="mt-1 text-sm text-[#6f6a64]">{technicianLabel(request.assigned_technician)}</p></div></div><div className="mt-5 flex items-center justify-end gap-1 text-sm font-bold text-[#B4232C]">View details <ChevronRight size={16} /></div></Link>;
}

function RequestRow({ request }: { request: ServiceRequestListItem }) {
  return <tr className="transition-colors hover:bg-[#fffcfa]"><td className="px-6 py-4"><Link to={`/app/requests/${request.id}`} className="font-bold text-[#2f2c29] hover:text-[#B4232C]">{request.request_number}</Link></td><td className="px-4 py-4"><p className="font-semibold text-[#3e3a36]">{request.customer_name}</p><p className="mt-0.5 text-xs text-[#9a9690]">{request.customer_phone}</p></td><td className="px-4 py-4"><p className="font-semibold text-[#4e4a46]">{[request.brand, request.model].filter(Boolean).join(" ") || "—"}</p><p className="mt-0.5 text-xs text-[#9a9690]">{request.device_type}</p></td><td className="max-w-[180px] px-4 py-4 text-sm text-[#5f5b57]"><span className="line-clamp-2">{request.service_name || "—"}</span></td><td className="px-4 py-4"><StatusBadge status={request.status} /></td><td className="whitespace-nowrap px-4 py-4 text-sm text-[#6f6a64]">{formatRequestDate(request.created_at)}</td><td className="px-4 py-4 text-sm text-[#6f6a64]">{technicianLabel(request.assigned_technician)}</td><td className="px-6 py-4 text-right"><Link to={`/app/requests/${request.id}`} className="inline-flex items-center gap-1 rounded-lg px-2.5 py-2 text-xs font-bold text-[#B4232C] hover:bg-[#fff0ef]">View <ChevronRight size={14} /></Link></td></tr>;
}

function RequestFilters({ search, setSearch, status, setStatus, serviceId, setServiceId, dateFilter, setDateFilter, technicianId, setTechnicianId, services, technicians }: { search: string; setSearch: (value: string) => void; status: string; setStatus: (value: string) => void; serviceId: string; setServiceId: (value: string) => void; dateFilter: RequestDateFilter; setDateFilter: (value: RequestDateFilter) => void; technicianId: TechnicianFilter; setTechnicianId: (value: TechnicianFilter) => void; services: ServiceCatalogItem[]; technicians: TechnicianSummary[] }) {
  return <div className="rounded-[1.5rem] border border-[#e5e2dd] bg-white p-4 shadow-[0_12px_35px_rgba(37,37,37,0.04)] sm:p-5"><div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_200px_200px_200px_180px]"><label className="relative block"><span className="sr-only">Search requests...</span><Search size={17} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#9a9690]" /><Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search requests..." className="h-12 rounded-xl border-[#dedbd6] bg-[#fbfaf8] pl-11 focus-visible:ring-[#B4232C]/15" /></label><SelectField label="Status" value={status} onChange={setStatus}><option value="all">All Statuses</option>{requestStatuses.map((item) => <option key={item} value={item}>{requestStatusLabels[item]}</option>)}</SelectField><SelectField label="Service" value={serviceId} onChange={setServiceId}><option value="all">All Services</option>{services.map((service) => <option key={service.id} value={service.id}>{service.name}</option>)}</SelectField><SelectField label="Technician" value={technicianId} onChange={(value) => setTechnicianId(value)}><option value="all">All Technicians</option><option value="unassigned">Unassigned</option>{technicians.filter((technician) => technician.is_active).map((technician) => <option key={technician.id} value={technician.id}>{technician.full_name || technician.email || "Unnamed technician"}</option>)}</SelectField><SelectField label="Date" value={dateFilter} onChange={(value) => setDateFilter(value as RequestDateFilter)}>{dateFilters.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</SelectField></div></div>;
}

function QueueEmptyState({ filtered }: { filtered: boolean }) {
  return <div className="rounded-[1.5rem] border border-dashed border-[#d7d3ce] bg-white/60 p-10 text-center sm:p-16"><div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#fff0ef] text-[#B4232C]"><FileText size={25} /></div><h3 className="font-display text-2xl font-bold">{filtered ? "No requests match these filters" : "No service requests found"}</h3><p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-[#85817b]">{filtered ? "Try a different search or filter." : "Customer repair requests will appear here when they are submitted."}</p></div>;
}

export default function AdminRequests() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [serviceId, setServiceId] = useState("all");
  const [technicianId, setTechnicianId] = useState<TechnicianFilter>("all");
  const [dateFilter, setDateFilter] = useState<RequestDateFilter>("all_time");
  const [services, setServices] = useState<ServiceCatalogItem[]>([]);
  const [technicians, setTechnicians] = useState<TechnicianSummary[]>([]);
  const [requests, setRequests] = useState<ServiceRequestListItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [servicesError, setServicesError] = useState<string | null>(null);

  const loadRequests = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await listInternalServiceRequests({ search, status: status as RequestStatus | "all", serviceId, dateFilter, technicianId });
      setRequests(result.requests);
      setTotalCount(result.totalCount);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Service requests could not be loaded.");
    } finally {
      setIsLoading(false);
    }
  }, [dateFilter, search, serviceId, status, technicianId]);

  useEffect(() => {
    void listActiveServices().then(setServices).catch((loadError) => setServicesError(loadError instanceof Error ? loadError.message : "Services could not be loaded."));
    void listAssignmentTechnicians().then(setTechnicians).catch((loadError) => setServicesError(loadError instanceof Error ? loadError.message : "Technicians could not be loaded."));
  }, []);

  useEffect(() => {
    const timeout = window.setTimeout(() => void loadRequests(), 250);
    return () => window.clearTimeout(timeout);
  }, [loadRequests]);

  return <AppShell><div className="mx-auto max-w-7xl"><div className="mb-8"><p className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-[#B4232C]"><Wrench size={14} /> FixPoint workspace</p><div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><h2 className="font-display text-3xl font-bold tracking-[-0.05em] sm:text-4xl">Service Requests</h2><p className="mt-2 text-sm leading-6 text-[#77736e]">Manage customer repair requests and track their progress.</p></div>{totalCount > 0 && <span className="w-fit rounded-full bg-white px-3 py-2 text-xs font-bold text-[#77736e] shadow-sm">{totalCount} {totalCount === 1 ? "request" : "requests"}</span>}</div></div><RequestFilters search={search} setSearch={setSearch} status={status} setStatus={setStatus} serviceId={serviceId} setServiceId={setServiceId} technicianId={technicianId} setTechnicianId={setTechnicianId} dateFilter={dateFilter} setDateFilter={setDateFilter} services={services} technicians={technicians} />{servicesError && <p className="mt-3 text-xs font-semibold text-[#B4232C]" role="alert">{servicesError}</p>}{isLoading ? <div className="mt-5 rounded-[1.5rem] border border-[#e5e2dd] bg-white p-12 text-center text-sm font-semibold text-[#77736e]"><Loader2 className="mx-auto mb-3 animate-spin text-[#B4232C]" size={24} />Loading service requests...</div> : error ? <div className="mt-5 rounded-[1.5rem] border border-[#efc4c3] bg-[#fff4f3] p-8 text-center" role="alert"><ShieldAlert className="mx-auto mb-3 text-[#B4232C]" size={25} /><p className="font-bold text-[#8f1f27]">Service requests could not be loaded</p><p className="mt-2 text-sm text-[#a64a4e]">{error}</p><button type="button" onClick={() => void loadRequests()} className="mt-5 rounded-xl bg-[#B4232C] px-4 py-2.5 text-sm font-bold text-white">Try again</button></div> : requests.length === 0 ? <div className="mt-5"><QueueEmptyState filtered={Boolean(search || status !== "all" || serviceId !== "all" || technicianId !== "all" || dateFilter !== "all_time")} /></div> : <div className="mt-5 overflow-hidden rounded-[1.5rem] border border-[#e5e2dd] bg-white shadow-[0_12px_35px_rgba(37,37,37,0.04)]"><div className="hidden overflow-x-auto md:block"><table className="w-full min-w-[1120px] text-left"><thead className="border-b border-[#eeeae5] bg-[#fbfaf8] text-[0.68rem] font-bold uppercase tracking-[0.14em] text-[#9a9690]"><tr><th className="px-6 py-4">Request Number</th><th className="px-4 py-4">Customer</th><th className="px-4 py-4">Device</th><th className="px-4 py-4">Service</th><th className="px-4 py-4">Status</th><th className="px-4 py-4">Submitted</th><th className="px-4 py-4">Assigned Technician</th><th className="px-6 py-4 text-right">Actions</th></tr></thead><tbody className="divide-y divide-[#eeeae5]">{requests.map((request) => <RequestRow key={request.id} request={request} />)}</tbody></table></div><div className="divide-y divide-[#eeeae5] md:hidden">{requests.map((request) => <RequestCard key={request.id} request={request} />)}</div></div>}</div></AppShell>;
}

function DetailSection({ title, icon: Icon, children }: { title: string; icon: typeof UserRound; children: React.ReactNode }) {
  return <section className="rounded-[1.5rem] border border-[#e5e1db] bg-white p-5 shadow-[0_12px_35px_rgba(37,37,37,0.04)] sm:p-7"><div className="flex items-center gap-3 border-b border-[#eeeae5] pb-5"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#fff0ef] text-[#B4232C]"><Icon size={18} /></span><h2 className="font-display text-xl font-bold tracking-[-0.04em]">{title}</h2></div><div className="pt-5">{children}</div></section>;
}

function DetailValue({ label, value }: { label: string; value: string }) {
  return <div><dt className="text-[0.68rem] font-bold uppercase tracking-[0.12em] text-[#9a9690]">{label}</dt><dd className="mt-1 text-sm font-semibold leading-6 text-[#4e4a46]">{value || "—"}</dd></div>;
}

function AttachmentList({ attachments }: { attachments: ServiceRequestDetail["attachments"] }) {
  const [openingId, setOpeningId] = useState<string | null>(null);
  const [urls, setUrls] = useState<Record<string, string>>({});
  const openAttachment = async (attachment: ServiceRequestDetail["attachments"][number]) => {
    setOpeningId(attachment.id);
    try {
      const url = await createRequestAttachmentUrl(attachment.storage_path);
      setUrls((current) => ({ ...current, [attachment.id]: url }));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Attachment could not be opened.");
    } finally {
      setOpeningId(null);
    }
  };

  if (attachments.length === 0) return <p className="text-sm text-[#817c76]">No attachments were uploaded with this request.</p>;
  return <div className="space-y-3">{attachments.map((attachment) => <div key={attachment.id} className="flex flex-col gap-3 rounded-xl border border-[#eeeae5] bg-[#fbfaf8] px-4 py-3 sm:flex-row sm:items-center sm:justify-between"><div className="flex min-w-0 items-center gap-3"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-[#B4232C]"><FileText size={17} /></span><div className="min-w-0"><p className="truncate text-sm font-bold text-[#4e4a46]">{attachment.file_name}</p><p className="mt-0.5 text-xs text-[#9a9690]">{attachment.content_type} · {formatFileSize(attachment.file_size)}</p></div></div>{urls[attachment.id] ? <a href={urls[attachment.id]} target="_blank" rel="noreferrer" className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-[#B4232C] px-3 py-2 text-xs font-bold text-white hover:bg-[#8f1f27]"><Download size={14} /> View / download</a> : <button type="button" onClick={() => void openAttachment(attachment)} disabled={openingId === attachment.id} className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border border-[#dedbd6] bg-white px-3 py-2 text-xs font-bold text-[#5f5b57] hover:border-[#B4232C] hover:text-[#B4232C] disabled:cursor-wait disabled:opacity-60">{openingId === attachment.id ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />} {openingId === attachment.id ? "Preparing..." : "Secure view"}</button>}</div>)}</div>;
}

function HistoryTimeline({ history }: { history: ServiceRequestDetail["history"] }) {
  return <ol className="space-y-0">{history.map((item, index) => <li key={item.id} className="relative flex gap-4 pb-7 last:pb-0">{index < history.length - 1 && <span className="absolute left-[15px] top-8 h-[calc(100%-8px)] w-px bg-[#dedbd6]" aria-hidden="true" />}<span className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-[#B4232C] bg-[#fff0ef] text-[#B4232C]"><span className="h-2.5 w-2.5 rounded-full bg-[#B4232C]" /></span><div className="min-w-0 pt-0.5"><p className="text-sm font-bold text-[#3e3a36]">{item.old_status ? `${formatRequestStatus(item.old_status)} → ${formatRequestStatus(item.new_status)}` : "Request Received"}</p><p className="mt-1 text-xs text-[#817c76]">{formatRequestDateTime(item.created_at)}</p><p className="mt-1 text-xs font-semibold text-[#9a9690]">{item.changed_by_name || (item.old_status ? "Internal user" : "Customer request submitted")}</p></div></li>)}</ol>;
}

function AssignmentHistoryTimeline({ history }: { history: AssignmentHistoryItem[] }) {
  if (history.length === 0) return <p className="text-sm text-[#817c76]">No technician assignment changes yet.</p>;
  return <ol className="space-y-0">{history.map((item, index) => <li key={item.id} className="relative flex gap-4 pb-7 last:pb-0">{index < history.length - 1 && <span className="absolute left-[15px] top-8 h-[calc(100%-8px)] w-px bg-[#dedbd6]" aria-hidden="true" />}<span className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-[#B4232C] bg-[#fff0ef] text-[#B4232C]"><History size={15} /></span><div className="min-w-0 pt-0.5"><p className="text-sm font-bold text-[#3e3a36]">{getAssignmentActionLabel(item.action)}</p><p className="mt-1 text-sm font-semibold text-[#4e4a46]">{item.technician_name}</p><p className="mt-1 text-xs text-[#817c76]">by {item.assigned_by_name} · {formatRequestDateTime(item.created_at)}</p></div></li>)}</ol>;
}

function RepairWorkSection({ request }: { request: ServiceRequestDetail }) {
  const peso = new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" });
  const money = (value: number) => peso.format(Number(value) || 0);
  return <DetailSection title="Repair Work" icon={Wrench}><div className="space-y-6"><div className="grid gap-5"><div><p className="text-[0.68rem] font-bold uppercase tracking-[0.12em] text-[#9a9690]">Diagnosis</p><p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-[#4e4a46]">{request.diagnosis || "No diagnosis recorded yet."}</p></div><div><p className="text-[0.68rem] font-bold uppercase tracking-[0.12em] text-[#9a9690]">Diagnostic Findings</p><p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-[#4e4a46]">{request.diagnostic_findings || "No diagnostic findings recorded yet."}</p></div><div><p className="text-[0.68rem] font-bold uppercase tracking-[0.12em] text-[#9a9690]">Internal Notes</p><p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-[#4e4a46]">{request.internal_notes || "No internal notes recorded yet."}</p></div></div><div className="border-t border-[#eeeae5] pt-5"><div className="flex items-center justify-between gap-3"><h3 className="font-bold text-[#3e3a36]">Parts & Materials</h3><span className="text-sm font-bold text-[#5f5b57]">{money(request.parts_subtotal)}</span></div>{request.parts.length === 0 ? <p className="mt-3 text-sm text-[#817c76]">No parts or materials recorded.</p> : <div className="mt-3 space-y-2">{request.parts.map((part) => <div key={part.id} className="flex items-start justify-between gap-4 rounded-xl bg-[#fbfaf8] px-4 py-3"><div><p className="text-sm font-bold text-[#4e4a46]">{part.part_name}</p><p className="mt-1 text-xs text-[#817c76]">{part.quantity} × {money(part.unit_cost)}{part.notes ? ` · ${part.notes}` : ""}</p></div><span className="text-sm font-bold text-[#3e3a36]">{money(part.quantity * part.unit_cost)}</span></div>)}</div>}</div><div className="border-t border-[#eeeae5] pt-5"><div className="flex items-center justify-between gap-3"><h3 className="font-bold text-[#3e3a36]">Labor</h3><span className="text-sm font-bold text-[#5f5b57]">{money(request.labor_subtotal)}</span></div>{request.labor.length === 0 ? <p className="mt-3 text-sm text-[#817c76]">No labor items recorded.</p> : <div className="mt-3 space-y-2">{request.labor.map((labor) => <div key={labor.id} className="flex items-start justify-between gap-4 rounded-xl bg-[#fbfaf8] px-4 py-3"><div><p className="text-sm font-bold text-[#4e4a46]">{labor.description}</p><p className="mt-1 text-xs text-[#817c76]">{labor.hours} hours × {money(labor.hourly_rate)}</p></div><span className="text-sm font-bold text-[#3e3a36]">{money(labor.hours * labor.hourly_rate)}</span></div>)}</div>}</div><div className="rounded-xl bg-[#252525] px-4 py-4 text-white"><div className="flex items-center justify-between gap-4"><span className="text-sm font-bold">Estimated Repair Cost</span><span className="font-display text-xl font-bold text-[#f3c7c6]">{money(request.parts_subtotal + request.labor_subtotal)}</span></div><p className="mt-2 text-xs text-white/50">Internal estimate only; not a customer-approved quotation.</p></div></div></DetailSection>;
}

function AssignmentDialog({ open, onOpenChange, current, technicians, isSaving, onAssign }: { open: boolean; onOpenChange: (open: boolean) => void; current: ServiceRequestDetail["assigned_technician"]; technicians: TechnicianSummary[]; isSaving: boolean; onAssign: (technicianId: string) => void }) {
  const [selectedId, setSelectedId] = useState("");
  useEffect(() => {
    if (open) setSelectedId(current?.id || "");
  }, [current?.id, open]);
  const isReassign = Boolean(current);
  const canSubmit = Boolean(selectedId && selectedId !== current?.id);
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="rounded-[1.5rem] border-[#e5e2dd] bg-[#fffefd] p-0 sm:max-w-[520px]"><DialogHeader className="border-b border-[#eeeae5] px-6 py-6 pr-12 text-left sm:px-7"><DialogTitle className="font-display text-2xl font-bold tracking-[-0.04em]">{isReassign ? "Reassign Technician" : "Assign Technician"}</DialogTitle><DialogDescription className="mt-2 leading-6 text-[#77736e]">{isReassign ? "Choose an active technician for this repair." : "Choose an active technician to take this repair."}</DialogDescription></DialogHeader><div className="space-y-3 px-6 py-6 sm:px-7">{technicians.filter((technician) => technician.is_active).length === 0 ? <p className="rounded-xl bg-[#fbfaf8] p-4 text-sm text-[#77736e]">No active technicians are available for new assignments.</p> : technicians.filter((technician) => technician.is_active).map((technician) => <button key={technician.id} type="button" onClick={() => setSelectedId(technician.id)} className={`flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left transition-colors ${selectedId === technician.id ? "border-[#B4232C] bg-[#fff0ef]" : "border-[#e5e2dd] bg-white hover:border-[#c9a3a1]"}`}><span><span className="block text-sm font-bold text-[#3e3a36]">{technician.full_name || technician.email || "Unnamed technician"}</span><span className="mt-1 block text-xs text-[#817c76]">{technician.active_repairs} active {technician.active_repairs === 1 ? "repair" : "repairs"}</span></span><span className={`h-4 w-4 rounded-full border-2 ${selectedId === technician.id ? "border-[#B4232C] bg-[#B4232C] ring-2 ring-[#f3c7c6]" : "border-[#c8c3bc]"}`} /></button>)}{isReassign && canSubmit && <div className="rounded-xl border border-[#ead8d6] bg-[#fff7f6] px-4 py-3"><p className="text-sm font-bold text-[#8f1f27]">Reassign this repair?</p><p className="mt-1 text-xs leading-5 text-[#a64a4e]">This request will be moved from the current technician to the selected technician.</p></div>}</div><DialogFooter className="border-t border-[#eeeae5] px-6 py-5 sm:px-7"><button type="button" onClick={() => onOpenChange(false)} className="rounded-xl border border-[#dedbd6] bg-white px-4 py-3 text-sm font-bold text-[#5F5B57] hover:bg-[#f8f6f3]">Cancel</button><button type="button" disabled={!canSubmit || isSaving} onClick={() => onAssign(selectedId)} className="rounded-xl bg-[#B4232C] px-5 py-3 text-sm font-bold text-white hover:bg-[#8f1f27] disabled:cursor-not-allowed disabled:opacity-50">{isSaving ? "Saving..." : isReassign ? "Reassign" : "Assign Technician"}</button></DialogFooter></DialogContent></Dialog>;
}

export function AdminRequestDetail() {
  const { requestId } = useParams();
  const navigate = useNavigate();
  const [request, setRequest] = useState<ServiceRequestDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nextStatus, setNextStatus] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [technicians, setTechnicians] = useState<TechnicianSummary[]>([]);
  const [assignmentDialogOpen, setAssignmentDialogOpen] = useState(false);
  const [unassignDialogOpen, setUnassignDialogOpen] = useState(false);
  const [isAssignmentSaving, setIsAssignmentSaving] = useState(false);

  const loadRequest = useCallback(async () => {
    if (!requestId) return;
    setIsLoading(true);
    setError(null);
    try {
      setRequest(await getInternalServiceRequest(requestId));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Service request could not be loaded.");
    } finally {
      setIsLoading(false);
    }
  }, [requestId]);

  useEffect(() => {
    void loadRequest();
    void listAssignmentTechnicians().then(setTechnicians).catch(() => undefined);
  }, [loadRequest]);

  const allowedTransitions = useMemo(() => request ? getAllowedRequestTransitions(request.status) : [], [request]);

  const handleAssignment = async (technicianId: string | null) => {
    if (!request) return;
    setIsAssignmentSaving(true);
    try {
      await assignServiceRequest(request.id, technicianId);
      toast.success(technicianId ? request.assigned_technician ? "Technician reassigned" : "Technician assigned" : "Technician unassigned");
      setAssignmentDialogOpen(false);
      setUnassignDialogOpen(false);
      await Promise.all([loadRequest(), listAssignmentTechnicians().then(setTechnicians)]);
    } catch (assignmentError) {
      toast.error(assignmentError instanceof Error ? assignmentError.message : "The technician assignment could not be changed.");
    } finally {
      setIsAssignmentSaving(false);
    }
  };

  const handleStatusChange = async () => {
    if (!request || !nextStatus) return;
    setIsSaving(true);
    try {
      await changeServiceRequestStatus(request.id, nextStatus as RequestStatus);
      toast.success("Request status updated");
      setNextStatus("");
      await loadRequest();
    } catch (saveError) {
      toast.error(saveError instanceof Error ? saveError.message : "The request status could not be changed.");
    } finally {
      setIsSaving(false);
    }
  };

  return <AppShell><div className="mx-auto max-w-6xl">{isLoading ? <div className="rounded-[1.5rem] border border-[#e5e2dd] bg-white p-14 text-center text-sm font-semibold text-[#77736e]"><Loader2 className="mx-auto mb-3 animate-spin text-[#B4232C]" size={24} />Loading request details...</div> : error || !request ? <div className="rounded-[1.5rem] border border-[#efc4c3] bg-[#fff4f3] p-10 text-center" role="alert"><ShieldAlert className="mx-auto mb-3 text-[#B4232C]" size={25} /><p className="font-bold text-[#8f1f27]">Service request could not be loaded</p><p className="mt-2 text-sm text-[#a64a4e]">{error || "This request may no longer exist."}</p><button type="button" onClick={() => void loadRequest()} className="mt-5 rounded-xl bg-[#B4232C] px-4 py-2.5 text-sm font-bold text-white">Try again</button></div> : <><Link to="/app/requests" className="mb-5 inline-flex items-center gap-2 text-sm font-bold text-[#B4232C] hover:text-[#8f1f27]"><ArrowLeft size={16} /> Back to Service Requests</Link><div className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-end"><div><p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-[#B4232C]">Request details</p><h2 className="font-display text-3xl font-bold tracking-[-0.05em] sm:text-4xl">{request.request_number}</h2><p className="mt-2 text-sm text-[#77736e]">Submitted {formatRequestDateTime(request.created_at)}</p></div><div className="flex flex-col items-start gap-3 sm:items-end"><StatusBadge status={request.status} /><div className="flex w-full gap-2 sm:w-auto"><select aria-label="Change Status" value={nextStatus} onChange={(event) => setNextStatus(event.target.value)} disabled={allowedTransitions.length === 0 || isSaving} className="h-11 min-w-0 flex-1 rounded-xl border border-[#dedbd6] bg-white px-3 text-sm font-semibold text-[#4e4a46] outline-none focus:border-[#B4232C] focus:ring-4 focus:ring-[#B4232C]/10 sm:w-[220px] sm:flex-none"><option value="">Change Status</option>{allowedTransitions.map((statusOption) => <option key={statusOption} value={statusOption}>{requestStatusLabels[statusOption]}</option>)}</select><button type="button" onClick={() => void handleStatusChange()} disabled={!nextStatus || isSaving} className="h-11 rounded-xl bg-[#B4232C] px-4 text-sm font-bold text-white hover:bg-[#8f1f27] disabled:cursor-not-allowed disabled:opacity-50">{isSaving ? "Saving..." : "Update"}</button></div></div></div><div className="grid gap-5 lg:grid-cols-[minmax(0,1.15fr)_minmax(300px,0.85fr)]"><div className="space-y-5"><DetailSection title="Customer" icon={UserRound}><dl className="grid gap-5 sm:grid-cols-2"><DetailValue label="Full Name" value={request.customer.full_name} /><DetailValue label="Phone" value={request.customer.phone} /><DetailValue label="Email" value={request.customer.email || "Not provided"} /></dl></DetailSection><DetailSection title="Device" icon={Smartphone}><dl className="grid gap-5 sm:grid-cols-2"><DetailValue label="Device Type" value={request.device_type} /><DetailValue label="Brand" value={request.brand || "Not provided"} /><DetailValue label="Model" value={request.model || "Not provided"} /><DetailValue label="Serial Number" value={request.serial_number || "Not provided"} /></dl></DetailSection><DetailSection title="Repair Request" icon={Wrench}><dl className="grid gap-5 sm:grid-cols-2"><DetailValue label="Selected Service" value={request.service?.name || "Service unavailable"} /><DetailValue label="Contact Preferences" value={[request.contact_sms && "SMS", request.contact_email && "Email", request.contact_phone && "Phone Call"].filter(Boolean).join(", ") || "None selected"} /></dl><div className="mt-5 border-t border-[#eeeae5] pt-5"><p className="text-[0.68rem] font-bold uppercase tracking-[0.12em] text-[#9a9690]">Problem Description</p><p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-[#4e4a46]">{request.problem_description}</p></div></DetailSection><RepairWorkSection request={request} /><DetailSection title="Attachments" icon={FileText}><AttachmentList attachments={request.attachments} /></DetailSection></div><div className="space-y-5"><div className="rounded-[1.5rem] border border-[#e5e1db] bg-white p-5 shadow-[0_12px_35px_rgba(37,37,37,0.04)] sm:p-7"><p className="text-xs font-bold uppercase tracking-[0.16em] text-[#B4232C]">Request information</p><dl className="mt-5 space-y-4"><DetailValue label="Request Number" value={request.request_number} /><DetailValue label="Current Status" value={formatRequestStatus(request.status)} /><DetailValue label="Submitted Date" value={formatRequestDateTime(request.created_at)} /><DetailValue label="Last Updated" value={formatRequestDateTime(request.updated_at)} /><div><dt className="text-[0.68rem] font-bold uppercase tracking-[0.12em] text-[#9a9690]">Assigned Technician</dt><dd className="mt-1 flex flex-wrap items-center gap-2 text-sm font-semibold text-[#4e4a46]"><span>{request.assigned_technician ? `${request.assigned_technician.full_name || request.assigned_technician.email || "Former User"}${request.assigned_technician.is_active ? "" : " · Inactive"}` : "Unassigned"}</span><button type="button" onClick={() => setAssignmentDialogOpen(true)} className="rounded-lg border border-[#dedbd6] bg-white px-2.5 py-1.5 text-xs font-bold text-[#B4232C] hover:border-[#B4232C]">{request.assigned_technician ? "Reassign" : "Assign"}</button>{request.assigned_technician && <button type="button" onClick={() => setUnassignDialogOpen(true)} className="rounded-lg border border-[#ead8d6] bg-[#fff7f6] px-2.5 py-1.5 text-xs font-bold text-[#8f1f27] hover:bg-[#fff0ef]">Unassign</button>}</dd></div></dl></div><DetailSection title="Assignment History" icon={History}><AssignmentHistoryTimeline history={request.assignment_history} /></DetailSection><DetailSection title="Status History" icon={FileText}>{request.history.length > 0 ? <HistoryTimeline history={request.history} /> : <p className="text-sm text-[#817c76]">No status history is available.</p>}</DetailSection></div></div></>}</div><AssignmentDialog open={assignmentDialogOpen} onOpenChange={setAssignmentDialogOpen} current={request.assigned_technician} technicians={technicians} isSaving={isAssignmentSaving} onAssign={(technicianId) => void handleAssignment(technicianId)} /><AlertDialog open={unassignDialogOpen} onOpenChange={setUnassignDialogOpen}><AlertDialogContent className="rounded-[1.5rem] border-[#e5e2dd] bg-[#fffefd] p-6 sm:p-7"><AlertDialogHeader className="text-left"><AlertDialogTitle className="font-display text-2xl font-bold tracking-[-0.04em]">Unassign Technician?</AlertDialogTitle><AlertDialogDescription className="pt-2 leading-6 text-[#77736e]">This repair will return to the unassigned queue.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter className="mt-3 gap-2"><AlertDialogCancel disabled={isAssignmentSaving} className="rounded-xl border-[#dedbd6] px-4 py-3 font-bold">Cancel</AlertDialogCancel><AlertDialogAction disabled={isAssignmentSaving} onClick={(event) => { event.preventDefault(); void handleAssignment(null); }} className="rounded-xl bg-[#B4232C] px-4 py-3 font-bold text-white hover:bg-[#8f1f27]">{isAssignmentSaving ? "Saving..." : "Unassign"}</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog></AppShell>;
}
