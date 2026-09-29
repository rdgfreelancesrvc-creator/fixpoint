import { useState, type FormEvent } from "react";
import { useSearchParams } from "react-router-dom";
import {
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock3,
  FileText,
  HelpCircle,
  Laptop,
  LockKeyhole,
  MessageCircle,
  Search,
  Wrench,
  XCircle,
} from "lucide-react";
import { Link } from "react-router-dom";
import { PublicHeader } from "@/components/PublicHeader";
import { SectionEyebrow } from "@/components/BrandMark";

type SearchValues = {
  requestNumber: string;
  mobileNumber: string;
};

const exampleRequest = "SR-2026-000123";
const exampleMobile = "09171234567";

const timeline = [
  { label: "Request Received", date: "September 29, 2026 · 9:42 AM", state: "complete" },
  { label: "Diagnosis Completed", date: "September 29, 2026 · 2:18 PM", state: "complete" },
  { label: "Waiting for Customer Approval", date: "Current update · October 1, 2026", state: "current" },
  { label: "Repair In Progress", date: "Pending approval", state: "upcoming" },
  { label: "Ready for Pickup", date: "Pending repair", state: "upcoming" },
  { label: "Completed", date: "Pending repair", state: "upcoming" },
] as const;

function SearchField({
  id,
  label,
  placeholder,
  value,
  onChange,
  type = "text",
}: {
  id: string;
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
}) {
  return (
    <div>
      <label htmlFor={id} className="text-sm font-bold text-[#3e3a36]">
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="mt-2 h-12 w-full rounded-xl border border-[#dedbd6] bg-[#fcfbf9] px-4 text-sm text-[#252525] outline-none transition-colors placeholder:text-[#aaa59e] focus:border-[#B4232C] focus:ring-4 focus:ring-[#B4232C]/10"
      />
    </div>
  );
}

function Timeline() {
  return (
    <section className="rounded-[1.5rem] border border-[#e5e1db] bg-white p-5 shadow-[0_14px_35px_rgba(37,37,37,0.04)] sm:p-8" aria-labelledby="progress-heading">
      <div className="flex items-start justify-between gap-4 border-b border-[#eeeae5] pb-6">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#B4232C]">Repair progress</p>
          <h2 id="progress-heading" className="mt-2 font-display text-2xl font-bold tracking-[-0.05em]">Your repair journey</h2>
        </div>
        <span className="hidden rounded-full bg-[#fff0ef] px-3 py-1.5 text-xs font-bold text-[#B4232C] sm:inline-flex">3 of 6 steps</span>
      </div>
      <ol className="mt-7">
        {timeline.map((step, index) => {
          const isComplete = step.state === "complete";
          const isCurrent = step.state === "current";
          return (
            <li key={step.label} className="relative flex gap-4 pb-7 last:pb-0">
              {index < timeline.length - 1 && <span className={`absolute left-[15px] top-8 h-[calc(100%-8px)] w-px ${isComplete ? "bg-[#B4232C]" : "bg-[#dedbd6]"}`} aria-hidden="true" />}
              <span className={`relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 ${isComplete ? "border-[#B4232C] bg-[#B4232C] text-white" : isCurrent ? "border-[#B4232C] bg-white text-[#B4232C] ring-4 ring-[#fff0ef]" : "border-[#d6d2cc] bg-white text-[#aaa59e]"}`}>
                {isComplete ? <Check size={16} strokeWidth={3} /> : isCurrent ? <span className="h-2.5 w-2.5 rounded-full bg-[#B4232C]" /> : <span className="h-2 w-2 rounded-full bg-[#d6d2cc]" />}
              </span>
              <div className="min-w-0 pt-0.5">
                <p className={`text-sm font-bold ${isCurrent ? "text-[#B4232C]" : isComplete ? "text-[#3e3a36]" : "text-[#817c76]"}`}>{step.label}</p>
                <p className={`mt-1 text-xs ${isCurrent ? "font-semibold text-[#8f1f27]" : "text-[#aaa59e]"}`}>{step.date}</p>
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

function RepairInformation() {
  const details = [
    ["Device", "Dell Inspiron 15"],
    ["Service", "Laptop Repair"],
    ["Date Received", "September 29, 2026"],
    ["Current Status", "Waiting for Customer Approval"],
    ["Estimated Completion", "Pending Approval"],
  ];

  return (
    <section className="rounded-[1.5rem] border border-[#e5e1db] bg-white p-5 shadow-[0_14px_35px_rgba(37,37,37,0.04)] sm:p-8" aria-labelledby="information-heading">
      <div className="flex items-center gap-3 border-b border-[#eeeae5] pb-6">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#fff0ef] text-[#B4232C]"><Laptop size={19} /></span>
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#B4232C]">Repair information</p>
          <h2 id="information-heading" className="mt-1 font-display text-2xl font-bold tracking-[-0.05em]">The details at a glance</h2>
        </div>
      </div>
      <dl className="mt-2 divide-y divide-[#eeeae5]">
        {details.map(([label, value]) => (
          <div key={label} className="grid gap-1 py-4 sm:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] sm:gap-4">
            <dt className="text-xs font-bold uppercase tracking-[0.1em] text-[#9a9690]">{label}</dt>
            <dd className={`text-sm font-semibold ${label === "Current Status" ? "text-[#B4232C]" : "text-[#4e4a46]"}`}>{value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

function QuotationCard({ actionMessage, onAction }: { actionMessage: string; onAction: (message: string) => void }) {
  return (
    <section className="overflow-hidden rounded-[1.5rem] border border-[#ead9d6] bg-white shadow-[0_18px_42px_rgba(180,35,44,0.08)]" aria-labelledby="quotation-heading">
      <div className="bg-[#fff5f3] p-5 sm:p-7">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#B4232C]">Quotation</p>
            <h2 id="quotation-heading" className="mt-2 font-display text-2xl font-bold tracking-[-0.05em]">Repair Quotation</h2>
          </div>
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-[#B4232C] shadow-sm"><FileText size={19} /></span>
        </div>
        <p className="mt-6 text-sm leading-6 text-[#5f5b57]">Device requires replacement of the laptop cooling fan and internal cleaning.</p>
      </div>
      <div className="p-5 sm:p-7">
        <dl className="space-y-4 text-sm">
          <div className="flex items-center justify-between gap-4"><dt className="text-[#817c76]">Labor</dt><dd className="font-bold text-[#3e3a36]">₱1,200</dd></div>
          <div className="flex items-center justify-between gap-4"><dt className="text-[#817c76]">Parts</dt><dd className="font-bold text-[#3e3a36]">₱1,800</dd></div>
          <div className="flex items-center justify-between gap-4 border-t border-[#eeeae5] pt-4"><dt className="font-bold text-[#4e4a46]">Estimated Total</dt><dd className="font-display text-xl font-bold text-[#B4232C]">₱3,000</dd></div>
        </dl>
        <div className="mt-6 flex items-center gap-2 rounded-xl bg-[#fff5f3] px-3.5 py-3 text-xs font-bold text-[#8f1f27]"><Clock3 size={15} /> Awaiting Your Approval</div>
        <div className="mt-6 space-y-2.5">
          <Link to="/quote" className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#B4232C] px-5 py-3.5 text-sm font-bold text-white shadow-[0_12px_24px_rgba(180,35,44,0.18)] transition-transform hover:-translate-y-0.5">Review &amp; Approve Quotation <ArrowRight size={16} /></Link>
          <button type="button" onClick={() => onAction("Your response has been noted for this prototype.")} className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-[#dedbd6] bg-white px-5 py-3 text-sm font-bold text-[#5f5b57] transition-colors hover:border-[#B4232C] hover:text-[#B4232C]"><XCircle size={16} /> Decline Quotation</button>
        </div>
        {actionMessage && <p className="mt-4 rounded-xl bg-[#f5f4f1] px-3.5 py-3 text-xs font-semibold leading-5 text-[#5f5b57]" role="status">{actionMessage}</p>}
      </div>
    </section>
  );
}

function TrackingResult() {
  const [actionMessage, setActionMessage] = useState("");

  return (
    <div className="animate-fade-up mt-8 space-y-5 sm:mt-10">
      <div className="rounded-[1.5rem] border border-[#e5e1db] bg-white p-5 shadow-[0_14px_35px_rgba(37,37,37,0.04)] sm:p-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#fff0ef] text-[#B4232C]"><Wrench size={21} /></span>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#9a9690]">Service request</p>
              <h2 className="mt-1 font-display text-2xl font-bold tracking-[0.01em] text-[#252525]">{exampleRequest}</h2>
            </div>
          </div>
          <span className="inline-flex w-fit items-center gap-2 rounded-full bg-[#B4232C] px-3.5 py-2 text-xs font-bold text-white"><span className="h-1.5 w-1.5 rounded-full bg-white" /> Waiting for Customer Approval</span>
        </div>
        <div className="mt-7 grid gap-5 border-t border-[#eeeae5] pt-6 sm:grid-cols-2">
          <div><p className="text-xs font-bold uppercase tracking-[0.12em] text-[#9a9690]">Device</p><p className="mt-1 text-sm font-bold text-[#4e4a46]">Dell Inspiron 15</p></div>
          <div><p className="text-xs font-bold uppercase tracking-[0.12em] text-[#9a9690]">Service</p><p className="mt-1 text-sm font-bold text-[#4e4a46]">Laptop Repair</p></div>
        </div>
      </div>
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.15fr)_minmax(300px,0.85fr)]">
        <div className="space-y-5"><Timeline /><RepairInformation /></div>
        <div className="space-y-5"><QuotationCard actionMessage={actionMessage} onAction={setActionMessage} /><div className="rounded-[1.5rem] border border-[#e5e1db] bg-[#252525] p-5 text-white sm:p-6"><div className="flex items-start gap-3"><MessageCircle size={19} className="mt-0.5 shrink-0 text-[#f3c7c6]" /><div><p className="text-sm font-bold">Questions about this update?</p><p className="mt-1 text-xs leading-5 text-white/60">Our team is happy to help with your repair.</p><Link to="/#contact" className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-[#f3c7c6] hover:text-white">Contact FixPoint <ChevronRight size={14} /></Link></div></div></div></div>
      </div>
    </div>
  );
}

function NotFoundResult() {
  return (
    <div className="animate-fade-up mt-8 rounded-[1.5rem] border border-[#ead9d6] bg-white p-7 text-center shadow-[0_14px_35px_rgba(37,37,37,0.04)] sm:mt-10 sm:p-10">
      <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#fff0ef] text-[#B4232C]"><Search size={24} /></span>
      <h2 className="mt-5 font-display text-2xl font-bold tracking-[-0.05em]">Repair Not Found</h2>
      <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-[#77736e]">Please check your service request number and mobile number and try again.</p>
      <Link to="/#contact" className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-[#B4232C] hover:text-[#8f1f27]"><HelpCircle size={16} /> Need Help? Contact FixPoint</Link>
    </div>
  );
}

export default function TrackRepair() {
  const [searchParams] = useSearchParams();
  const [values, setValues] = useState<SearchValues>(() => ({ requestNumber: searchParams.get("requestNumber") ?? "", mobileNumber: "" }));
  const [hasSearched, setHasSearched] = useState(false);
  const [isMatch, setIsMatch] = useState(false);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setHasSearched(true);
    setIsMatch(values.requestNumber.trim().toUpperCase() === exampleRequest && values.mobileNumber.replace(/\s/g, "") === exampleMobile);
  };

  return (
    <div className="min-h-screen bg-[#f5f4f1] text-[#252525]">
      <PublicHeader />
      <main className="mx-auto max-w-6xl px-5 pb-20 pt-32 sm:px-8 sm:pb-28 sm:pt-40 lg:px-10">
        <div className="mx-auto max-w-3xl text-center">
          <SectionEyebrow>Repair tracking</SectionEyebrow>
          <h1 className="font-display text-5xl font-bold leading-[0.98] tracking-[-0.07em] sm:text-6xl">Track My <span className="text-[#B4232C]">Repair</span></h1>
          <p className="mx-auto mt-6 max-w-2xl text-base leading-7 text-[#77736e] sm:text-lg">Enter your service request number and mobile number to check the latest status of your repair.</p>
        </div>

        <section className="mx-auto mt-10 max-w-3xl rounded-[1.5rem] border border-[#e5e1db] bg-white p-5 shadow-[0_18px_45px_rgba(37,37,37,0.06)] sm:mt-14 sm:p-8" aria-labelledby="lookup-heading">
          <div className="flex items-start gap-3 rounded-2xl bg-[#fff8f6] p-4 text-sm text-[#6f4542]">
            <LockKeyhole size={18} className="mt-0.5 shrink-0 text-[#B4232C]" />
            <p><span className="font-bold text-[#4e3b39]">Private and secure.</span> Use the details from your repair confirmation to view your status.</p>
          </div>
          <div className="mt-7"><h2 id="lookup-heading" className="font-display text-xl font-bold tracking-[-0.04em]">Find your repair</h2><p className="mt-1 text-sm text-[#817c76]">Both details are needed to look up your request.</p></div>
          <form onSubmit={handleSubmit} className="mt-6 grid gap-5 sm:grid-cols-2">
            <SearchField id="requestNumber" label="Service Request Number" placeholder="SR-2026-000123" value={values.requestNumber} onChange={(value) => setValues((current) => ({ ...current, requestNumber: value }))} />
            <SearchField id="mobileNumber" label="Mobile Number" placeholder="09XX XXX XXXX" value={values.mobileNumber} onChange={(value) => setValues((current) => ({ ...current, mobileNumber: value }))} type="tel" />
            <div className="flex flex-col gap-3 pt-1 sm:col-span-2 sm:flex-row sm:items-center sm:justify-between"><button type="submit" className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#B4232C] px-6 py-3.5 text-sm font-bold text-white shadow-[0_12px_24px_rgba(180,35,44,0.18)] transition-transform hover:-translate-y-0.5 sm:w-auto">Track Repair <ArrowRight size={16} /></button><Link to="/request" className="inline-flex items-center justify-center gap-2 rounded-full border border-[#dedbd6] bg-white px-6 py-3.5 text-sm font-bold text-[#5f5b57] transition-colors hover:border-[#B4232C] hover:text-[#B4232C]">Request a Repair <ChevronRight size={16} /></Link></div>
          </form>
        </section>

        {hasSearched && (isMatch ? <TrackingResult /> : <NotFoundResult />)}

        {!hasSearched && <div className="mx-auto mt-8 flex max-w-3xl items-center justify-center gap-2 text-xs text-[#9a9690]"><CheckCircle2 size={15} className="text-[#B4232C]" /> Your repair information is only visible to you.</div>}
      </main>
    </div>
  );
}
