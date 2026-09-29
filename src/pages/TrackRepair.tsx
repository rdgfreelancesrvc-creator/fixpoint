import { useEffect, useState, type FormEvent } from "react";
import { ArrowRight, Check, CheckCircle2, ChevronRight, Clock3, FileText, HelpCircle, Laptop, LockKeyhole, MessageCircle, Search, Wrench } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { PublicHeader } from "@/components/PublicHeader";
import { SectionEyebrow } from "@/components/BrandMark";
import { formatRequestDate, formatRequestDateTime, formatRequestStatus, trackPublicServiceRequest, type PublicTrackedRequest } from "@/lib/adminServiceRequests";

type SearchValues = {
  requestNumber: string;
  mobileNumber: string;
};

function SearchField({ id, label, placeholder, value, onChange, type = "text" }: { id: string; label: string; placeholder: string; value: string; onChange: (value: string) => void; type?: string }) {
  return <div><label htmlFor={id} className="text-sm font-bold text-[#3e3a36]">{label}</label><input id={id} type={type} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="mt-2 h-12 w-full rounded-xl border border-[#dedbd6] bg-[#fcfbf9] px-4 text-sm text-[#252525] outline-none transition-colors placeholder:text-[#aaa59e] focus:border-[#B4232C] focus:ring-4 focus:ring-[#B4232C]/10" /></div>;
}

function Timeline({ request }: { request: PublicTrackedRequest }) {
  return <section className="rounded-[1.5rem] border border-[#e5e1db] bg-white p-5 shadow-[0_14px_35px_rgba(37,37,37,0.04)] sm:p-8" aria-labelledby="progress-heading"><div className="flex items-start justify-between gap-4 border-b border-[#eeeae5] pb-6"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-[#B4232C]">Repair progress</p><h2 id="progress-heading" className="mt-2 font-display text-2xl font-bold tracking-[-0.05em]">Your repair journey</h2></div><span className="hidden rounded-full bg-[#fff0ef] px-3 py-1.5 text-xs font-bold text-[#B4232C] sm:inline-flex">{request.history.length} {request.history.length === 1 ? "update" : "updates"}</span></div><ol className="mt-7">{request.history.map((step, index) => { const isCurrent = index === request.history.length - 1; return <li key={`${step.created_at}-${step.new_status}`} className="relative flex gap-4 pb-7 last:pb-0">{index < request.history.length - 1 && <span className="absolute left-[15px] top-8 h-[calc(100%-8px)] w-px bg-[#B4232C]" aria-hidden="true" />}<span className={`relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 ${isCurrent ? "border-[#B4232C] bg-white text-[#B4232C] ring-4 ring-[#fff0ef]" : "border-[#B4232C] bg-[#B4232C] text-white"}`}>{isCurrent ? <span className="h-2.5 w-2.5 rounded-full bg-[#B4232C]" /> : <Check size={16} strokeWidth={3} />}</span><div className="min-w-0 pt-0.5"><p className={`text-sm font-bold ${isCurrent ? "text-[#B4232C]" : "text-[#3e3a36]"}`}>{step.old_status ? formatRequestStatus(step.new_status) : "Request Received"}</p><p className={`mt-1 text-xs ${isCurrent ? "font-semibold text-[#8f1f27]" : "text-[#aaa59e]"}`}>{formatRequestDateTime(step.created_at)}</p></div></li>; })}</ol></section>;
}

function RepairInformation({ request }: { request: PublicTrackedRequest }) {
  const details = [["Device", [request.brand, request.model].filter(Boolean).join(" ") || request.device_type], ["Device Type", request.device_type], ["Service", request.service_name || "Service unavailable"], ["Date Received", formatRequestDate(request.created_at)], ["Current Status", formatRequestStatus(request.status)]];
  return <section className="rounded-[1.5rem] border border-[#e5e1db] bg-white p-5 shadow-[0_14px_35px_rgba(37,37,37,0.04)] sm:p-8" aria-labelledby="information-heading"><div className="flex items-center gap-3 border-b border-[#eeeae5] pb-6"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#fff0ef] text-[#B4232C]"><Laptop size={19} /></span><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-[#B4232C]">Repair information</p><h2 id="information-heading" className="mt-1 font-display text-2xl font-bold tracking-[-0.05em]">The details at a glance</h2></div></div><dl className="mt-2 divide-y divide-[#eeeae5]">{details.map(([label, value]) => <div key={label} className="grid gap-1 py-4 sm:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] sm:gap-4"><dt className="text-xs font-bold uppercase tracking-[0.1em] text-[#9a9690]">{label}</dt><dd className={`text-sm font-semibold ${label === "Current Status" ? "text-[#B4232C]" : "text-[#4e4a46]"}`}>{value}</dd></div>)}</dl></section>;
}

function QuotationPending() {
  return <section className="overflow-hidden rounded-[1.5rem] border border-[#e5e1db] bg-white shadow-[0_14px_35px_rgba(37,37,37,0.04)]" aria-labelledby="quotation-heading"><div className="bg-[#fbfaf8] p-5 sm:p-7"><div className="flex items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-[#B4232C]">Quotation</p><h2 id="quotation-heading" className="mt-2 font-display text-2xl font-bold tracking-[-0.05em]">Quotation pending</h2></div><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-[#B4232C] shadow-sm"><FileText size={19} /></span></div><p className="mt-5 text-sm leading-6 text-[#5f5b57]">Your repair estimate will appear here after diagnosis.</p></div><div className="flex items-center gap-2 border-t border-[#eeeae5] px-5 py-4 text-xs font-bold text-[#817c76] sm:px-7"><Clock3 size={15} className="text-[#B4232C]" /> No quotation has been prepared yet</div></section>;
}

function TrackingResult({ request }: { request: PublicTrackedRequest }) {
  return <div className="animate-fade-up mt-8 space-y-5 sm:mt-10"><div className="rounded-[1.5rem] border border-[#e5e1db] bg-white p-5 shadow-[0_14px_35px_rgba(37,37,37,0.04)] sm:p-8"><div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between"><div className="flex items-start gap-4"><span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#fff0ef] text-[#B4232C]"><Wrench size={21} /></span><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-[#9a9690]">Service request</p><h2 className="mt-1 font-display text-2xl font-bold tracking-[0.01em] text-[#252525]">{request.request_number}</h2></div></div><span className="inline-flex w-fit items-center gap-2 rounded-full bg-[#B4232C] px-3.5 py-2 text-xs font-bold text-white"><span className="h-1.5 w-1.5 rounded-full bg-white" /> {formatRequestStatus(request.status)}</span></div><div className="mt-7 grid gap-5 border-t border-[#eeeae5] pt-6 sm:grid-cols-2"><div><p className="text-xs font-bold uppercase tracking-[0.12em] text-[#9a9690]">Device</p><p className="mt-1 text-sm font-bold text-[#4e4a46]">{[request.brand, request.model].filter(Boolean).join(" ") || request.device_type}</p></div><div><p className="text-xs font-bold uppercase tracking-[0.12em] text-[#9a9690]">Service</p><p className="mt-1 text-sm font-bold text-[#4e4a46]">{request.service_name || "Service unavailable"}</p></div></div></div><div className="grid gap-5 lg:grid-cols-[minmax(0,1.15fr)_minmax(300px,0.85fr)]"><div className="space-y-5"><Timeline request={request} /><RepairInformation request={request} /></div><div className="space-y-5"><QuotationPending /><div className="rounded-[1.5rem] border border-[#e5e1db] bg-[#252525] p-5 text-white sm:p-6"><div className="flex items-start gap-3"><MessageCircle size={19} className="mt-0.5 shrink-0 text-[#f3c7c6]" /><div><p className="text-sm font-bold">Questions about this update?</p><p className="mt-1 text-xs leading-5 text-white/60">Our team is happy to help with your repair.</p><Link to="/#contact" className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-[#f3c7c6] hover:text-white">Contact FixPoint <ChevronRight size={14} /></Link></div></div></div></div></div></div>;
}

function NotFoundResult() {
  return <div className="animate-fade-up mt-8 rounded-[1.5rem] border border-[#ead9d6] bg-white p-7 text-center shadow-[0_14px_35px_rgba(37,37,37,0.04)] sm:mt-10 sm:p-10"><span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#fff0ef] text-[#B4232C]"><Search size={24} /></span><h2 className="mt-5 font-display text-2xl font-bold tracking-[-0.05em]">Repair Not Found</h2><p className="mx-auto mt-3 max-w-md text-sm leading-6 text-[#77736e]">Please check your service request number and mobile number and try again.</p><Link to="/#contact" className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-[#B4232C] hover:text-[#8f1f27]"><HelpCircle size={16} /> Need Help? Contact FixPoint</Link></div>;
}

export default function TrackRepair() {
  const [searchParams] = useSearchParams();
  const [values, setValues] = useState<SearchValues>(() => ({ requestNumber: searchParams.get("requestNumber") ?? "", mobileNumber: "" }));
  const [hasSearched, setHasSearched] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [request, setRequest] = useState<PublicTrackedRequest | null>(null);

  useEffect(() => {
    if (searchParams.get("requestNumber")) setValues((current) => ({ ...current, requestNumber: searchParams.get("requestNumber") ?? "" }));
  }, [searchParams]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setHasSearched(true);
    setIsLoading(true);
    setRequest(null);
    try {
      setRequest(await trackPublicServiceRequest(values.requestNumber, values.mobileNumber));
    } catch {
      setRequest(null);
    } finally {
      setIsLoading(false);
    }
  };

  return <div className="min-h-screen bg-[#f5f4f1] text-[#252525]"><PublicHeader /><main className="mx-auto max-w-6xl px-5 pb-20 pt-32 sm:px-8 sm:pb-28 sm:pt-40 lg:px-10"><div className="mx-auto max-w-3xl text-center"><SectionEyebrow>Repair tracking</SectionEyebrow><h1 className="font-display text-5xl font-bold leading-[0.98] tracking-[-0.07em] sm:text-6xl">Track My <span className="text-[#B4232C]">Repair</span></h1><p className="mx-auto mt-6 max-w-2xl text-base leading-7 text-[#77736e] sm:text-lg">Enter your service request number and mobile number to check the latest status of your repair.</p></div><section className="mx-auto mt-10 max-w-3xl rounded-[1.5rem] border border-[#e5e1db] bg-white p-5 shadow-[0_18px_45px_rgba(37,37,37,0.06)] sm:mt-14 sm:p-8" aria-labelledby="lookup-heading"><div className="flex items-start gap-3 rounded-2xl bg-[#fff8f6] p-4 text-sm text-[#6f4542]"><LockKeyhole size={18} className="mt-0.5 shrink-0 text-[#B4232C]" /><p><span className="font-bold text-[#4e3b39]">Private and secure.</span> Both details are required to look up your repair.</p></div><div className="mt-7"><h2 id="lookup-heading" className="font-display text-xl font-bold tracking-[-0.04em]">Find your repair</h2><p className="mt-1 text-sm text-[#817c76]">Your mobile number is normalized securely before it is matched.</p></div><form onSubmit={handleSubmit} className="mt-6 grid gap-5 sm:grid-cols-2"><SearchField id="requestNumber" label="Service Request Number" placeholder="SR-2026-000123" value={values.requestNumber} onChange={(value) => setValues((current) => ({ ...current, requestNumber: value }))} /><SearchField id="mobileNumber" label="Mobile Number" placeholder="09XX XXX XXXX" value={values.mobileNumber} onChange={(value) => setValues((current) => ({ ...current, mobileNumber: value }))} type="tel" /><div className="flex flex-col gap-3 pt-1 sm:col-span-2 sm:flex-row sm:items-center sm:justify-between"><button type="submit" disabled={isLoading} className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#B4232C] px-6 py-3.5 text-sm font-bold text-white shadow-[0_12px_24px_rgba(180,35,44,0.18)] transition-transform hover:-translate-y-0.5 disabled:cursor-wait disabled:opacity-70 sm:w-auto">{isLoading ? "Checking..." : "Track Repair"} <ArrowRight size={16} /></button><Link to="/request" className="inline-flex items-center justify-center gap-2 rounded-full border border-[#dedbd6] bg-white px-6 py-3.5 text-sm font-bold text-[#5f5b57] transition-colors hover:border-[#B4232C] hover:text-[#B4232C]">Request a Repair <ChevronRight size={16} /></Link></div></form></section>{hasSearched && !isLoading && (request ? <TrackingResult request={request} /> : <NotFoundResult />)}{!hasSearched && <div className="mx-auto mt-8 flex max-w-3xl items-center justify-center gap-2 text-xs text-[#9a9690]"><CheckCircle2 size={15} className="text-[#B4232C]" /> Your repair information is only visible to you.</div>}</main></div>;
}
