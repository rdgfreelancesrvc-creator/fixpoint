import { useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  Clock3,
  FileText,
  Laptop,
  ShieldCheck,
  X,
  XCircle,
} from "lucide-react";
import { Link } from "react-router-dom";
import { PublicHeader } from "@/components/PublicHeader";
import { SectionEyebrow } from "@/components/BrandMark";

type Decision = "pending" | "approved" | "declined";

const requestNumber = "SR-2026-000123";

function SummaryCard() {
  const details = [
    ["Customer", "John Doe"],
    ["Device", "Dell Inspiron 15"],
    ["Service", "Laptop Repair"],
    ["Date Received", "September 29, 2026"],
  ];

  return (
    <section className="rounded-[1.5rem] border border-[#e5e1db] bg-white p-5 shadow-[0_14px_35px_rgba(37,37,37,0.04)] sm:p-8" aria-labelledby="summary-heading">
      <div className="flex items-center gap-3 border-b border-[#eeeae5] pb-6">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#fff0ef] text-[#B4232C]"><Laptop size={19} /></span>
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#B4232C]">Your repair</p>
          <h2 id="summary-heading" className="mt-1 font-display text-2xl font-bold tracking-[-0.05em]">Customer &amp; device summary</h2>
        </div>
      </div>
      <dl className="mt-2 divide-y divide-[#eeeae5]">
        {details.map(([label, value]) => (
          <div key={label} className="grid gap-1 py-4 sm:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] sm:gap-4">
            <dt className="text-xs font-bold uppercase tracking-[0.1em] text-[#9a9690]">{label}</dt>
            <dd className="text-sm font-semibold text-[#4e4a46]">{value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

function DiagnosisCard() {
  return (
    <section className="rounded-[1.5rem] border border-[#e5e1db] bg-white p-5 shadow-[0_14px_35px_rgba(37,37,37,0.04)] sm:p-8" aria-labelledby="diagnosis-heading">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#f5f4f1] text-[#5f5b57]"><CheckCircle2 size={19} /></span>
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#B4232C]">Diagnosis</p>
          <h2 id="diagnosis-heading" className="mt-1 font-display text-2xl font-bold tracking-[-0.05em]">What We Found</h2>
        </div>
      </div>
      <p className="mt-6 text-sm leading-7 text-[#5f5b57]">During diagnosis, our technician found that the laptop cooling fan requires replacement. Internal cleaning is also recommended to improve cooling performance.</p>
    </section>
  );
}

function QuotationCard() {
  const items = [
    ["Labor", "Laptop repair and installation", "₱1,200"],
    ["Parts", "Replacement cooling fan", "₱1,800"],
    ["Service", "Internal cleaning", "₱0"],
  ];

  return (
    <section className="overflow-hidden rounded-[1.5rem] border border-[#ead9d6] bg-white shadow-[0_18px_42px_rgba(180,35,44,0.08)]" aria-labelledby="quotation-heading">
      <div className="bg-[#fff5f3] p-5 sm:p-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#B4232C]">Your estimate</p>
            <h2 id="quotation-heading" className="mt-2 font-display text-2xl font-bold tracking-[-0.05em]">Repair Quotation</h2>
          </div>
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-[#B4232C] shadow-sm"><FileText size={19} /></span>
        </div>
      </div>
      <div className="p-5 sm:p-8">
        <dl className="space-y-5">
          {items.map(([label, description, amount]) => (
            <div key={label} className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-5">
              <div>
                <dt className="text-sm font-bold text-[#4e4a46]">{label}</dt>
                <dd className="mt-1 text-xs leading-5 text-[#817c76]">{description}</dd>
              </div>
              <span className="text-sm font-bold text-[#3e3a36] sm:shrink-0">{amount}</span>
            </div>
          ))}
        </dl>
        <div className="mt-7 flex items-center justify-between gap-4 border-t border-[#eeeae5] pt-6">
          <span className="font-bold text-[#4e4a46]">Estimated Total</span>
          <span className="font-display text-2xl font-bold text-[#B4232C]">₱3,000</span>
        </div>
        <div className="mt-6 flex items-center gap-2 rounded-xl bg-[#fff5f3] px-3.5 py-3 text-xs font-bold text-[#8f1f27]"><Clock3 size={15} /> Quotation Status: Awaiting Your Approval</div>
      </div>
    </section>
  );
}

function CompletionCard() {
  return (
    <section className="rounded-[1.5rem] border border-[#e5e1db] bg-[#252525] p-5 text-white sm:p-7" aria-labelledby="completion-heading">
      <div className="flex items-start gap-3">
        <Clock3 size={19} className="mt-0.5 shrink-0 text-[#f3c7c6]" />
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#f3c7c6]">Timing estimate</p>
          <h2 id="completion-heading" className="mt-2 font-display text-xl font-bold tracking-[-0.04em]">Estimated Completion</h2>
          <p className="mt-3 text-sm leading-6 text-white/70">1–2 business days after approval, subject to parts availability.</p>
          <p className="mt-3 text-xs leading-5 text-white/45">This is an estimate, not a guaranteed completion time.</p>
        </div>
      </div>
    </section>
  );
}

function DecisionSection({ onApprove, onDecline }: { onApprove: () => void; onDecline: () => void }) {
  return (
    <section className="rounded-[1.5rem] border border-[#ead9d6] bg-white p-5 shadow-[0_18px_42px_rgba(180,35,44,0.08)] sm:p-8" aria-labelledby="decision-heading">
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#B4232C]">Your decision</p>
      <h2 id="decision-heading" className="mt-2 font-display text-2xl font-bold leading-tight tracking-[-0.05em] sm:text-3xl">Would you like us to proceed with the repair?</h2>
      <div className="mt-7 space-y-3">
        <button type="button" onClick={onApprove} className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#B4232C] px-5 py-4 text-sm font-bold text-white shadow-[0_12px_24px_rgba(180,35,44,0.18)] transition-transform hover:-translate-y-0.5">Approve Repair — ₱3,000 <ArrowRight size={16} /></button>
        <button type="button" onClick={onDecline} className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-[#dedbd6] bg-white px-5 py-3.5 text-sm font-bold text-[#5f5b57] transition-colors hover:border-[#B4232C] hover:text-[#B4232C]"><XCircle size={16} /> Decline Quotation</button>
      </div>
      <p className="mt-5 flex items-start gap-2 text-xs leading-5 text-[#89847d]"><ShieldCheck size={15} className="mt-0.5 shrink-0 text-[#B4232C]" /> By approving this quotation, you authorize FixPoint to proceed with the listed repair services and charges.</p>
    </section>
  );
}

function DeclineModal({ onConfirm, onCancel }: { onConfirm: () => void; onCancel: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#252525]/45 px-5 py-8" role="presentation" onClick={onCancel}>
      <div className="relative w-full max-w-md rounded-[1.5rem] border border-[#e5e1db] bg-white p-6 shadow-[0_25px_70px_rgba(37,37,37,0.2)] sm:p-8" role="dialog" aria-modal="true" aria-labelledby="decline-dialog-heading" onClick={(event) => event.stopPropagation()}>
        <button type="button" aria-label="Close decline confirmation" onClick={onCancel} className="absolute right-5 top-5 rounded-xl p-2 text-[#817c76] transition-colors hover:bg-[#f5f4f1] hover:text-[#252525]"><X size={18} /></button>
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#fff0ef] text-[#B4232C]"><XCircle size={21} /></span>
        <h2 id="decline-dialog-heading" className="mt-5 font-display text-2xl font-bold tracking-[-0.05em]">Decline This Quotation?</h2>
        <p className="mt-3 text-sm leading-6 text-[#77736e]">Are you sure you don't want to proceed with this repair quotation?</p>
        <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button type="button" onClick={onCancel} className="inline-flex items-center justify-center rounded-full border border-[#dedbd6] bg-white px-5 py-3 text-sm font-bold text-[#5f5b57] transition-colors hover:border-[#B4232C] hover:text-[#B4232C]">Go Back</button>
          <button type="button" onClick={onConfirm} className="inline-flex items-center justify-center rounded-full bg-[#B4232C] px-5 py-3 text-sm font-bold text-white shadow-[0_10px_22px_rgba(180,35,44,0.18)] transition-transform hover:-translate-y-0.5">Yes, Decline</button>
        </div>
      </div>
    </div>
  );
}

function DecisionConfirmation({ decision }: { decision: Exclude<Decision, "pending"> }) {
  const isApproved = decision === "approved";

  return (
    <div className="mx-auto max-w-2xl rounded-[2rem] border border-[#e5e1db] bg-white p-6 text-center shadow-[0_22px_55px_rgba(37,37,37,0.08)] sm:p-12">
      <span className={`mx-auto flex h-16 w-16 items-center justify-center rounded-2xl ${isApproved ? "bg-[#B4232C]" : "bg-[#fff0ef]"} ${isApproved ? "text-white" : "text-[#B4232C]"}`}>
        {isApproved ? <Check size={30} strokeWidth={2.5} /> : <XCircle size={30} />}
      </span>
      <p className="mt-7 text-xs font-bold uppercase tracking-[0.16em] text-[#B4232C]">Decision recorded</p>
      <h1 className="mt-3 font-display text-4xl font-bold tracking-[-0.06em] sm:text-5xl">{isApproved ? "Repair Approved" : "Quotation Declined"}</h1>
      <p className="mx-auto mt-5 max-w-md text-base leading-7 text-[#77736e]">{isApproved ? "Thank you. Your approval has been recorded. Our team can now proceed with the repair." : "We've recorded your decision. Our team may contact you if additional information is needed."}</p>
      <div className="mx-auto mt-8 max-w-sm rounded-2xl bg-[#f5f4f1] p-4">
        <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#9a9690]">Service Request</p>
        <p className="mt-2 font-display text-lg font-bold tracking-[0.01em] text-[#252525]">{requestNumber}</p>
        <p className="mt-3 text-xs font-bold uppercase tracking-[0.12em] text-[#9a9690]">Status</p>
        <p className="mt-1 text-sm font-bold text-[#B4232C]">{isApproved ? "Approved" : "Quotation Declined"}</p>
      </div>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
        <Link to={isApproved ? "/track" : "/track"} className="inline-flex items-center justify-center gap-2 rounded-full bg-[#B4232C] px-6 py-3.5 text-sm font-bold text-white shadow-[0_12px_24px_rgba(180,35,44,0.18)] transition-transform hover:-translate-y-0.5">{isApproved ? "Track My Repair" : "Return to Repair Tracking"} <ArrowRight size={16} /></Link>
        {isApproved && <Link to="/" className="inline-flex items-center justify-center gap-2 rounded-full border border-[#dedbd6] bg-white px-6 py-3.5 text-sm font-bold text-[#5f5b57] transition-colors hover:border-[#B4232C] hover:text-[#B4232C]"><ArrowLeft size={16} /> Return to Home</Link>}
      </div>
    </div>
  );
}

export default function QuoteApproval() {
  const [decision, setDecision] = useState<Decision>("pending");
  const [isDeclineModalOpen, setIsDeclineModalOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#f5f4f1] text-[#252525]">
      <PublicHeader />
      <main id="top" className="mx-auto max-w-6xl px-5 pb-20 pt-32 sm:px-8 sm:pb-28 sm:pt-40 lg:px-10">
        {decision === "pending" ? (
          <>
            <div className="mx-auto max-w-3xl text-center">
              <SectionEyebrow>Quotation review</SectionEyebrow>
              <h1 className="font-display text-5xl font-bold leading-[0.98] tracking-[-0.07em] sm:text-6xl">Review Your Repair <span className="text-[#B4232C]">Quotation</span></h1>
              <p className="mx-auto mt-6 max-w-2xl text-base leading-7 text-[#77736e] sm:text-lg">Please review the diagnosis and repair estimate below. You can approve the repair or decline the quotation.</p>
              <span className="mt-6 inline-flex items-center rounded-full bg-[#fff0ef] px-4 py-2 text-xs font-bold text-[#8f1f27]">Service Request: {requestNumber}</span>
            </div>
            <div className="mx-auto mt-10 grid max-w-5xl gap-5 sm:mt-14 lg:grid-cols-[minmax(0,1fr)_minmax(340px,0.9fr)]">
              <div className="space-y-5"><SummaryCard /><DiagnosisCard /><CompletionCard /></div>
              <div className="space-y-5"><QuotationCard /><DecisionSection onApprove={() => setDecision("approved")} onDecline={() => setIsDeclineModalOpen(true)} /></div>
            </div>
          </>
        ) : (
          <div className="pt-8 sm:pt-4"><DecisionConfirmation decision={decision} /></div>
        )}
      </main>
      {isDeclineModalOpen && <DeclineModal onConfirm={() => { setIsDeclineModalOpen(false); setDecision("declined"); }} onCancel={() => setIsDeclineModalOpen(false)} />}
    </div>
  );
}
