import { useCallback, useEffect, useMemo, useState } from "react";
import { Check, ClipboardCopy, FileText, Link as LinkIcon, Loader2, Plus, RefreshCw, Send, X } from "lucide-react";
import { toast } from "sonner";
import {
  createQuotation,
  createRevisedQuotation,
  formatQuotationDate,
  formatQuotationDateTime,
  getQuotationUrl,
  listQuotations,
  sendQuotation,
  updateDraftQuotation,
  type QuotationStatus,
  type ServiceRequestQuotation,
  type ServiceRequestQuotationItem,
} from "@/lib/quotations";
import type { RepairLabor, RepairPart } from "@/lib/adminServiceRequests";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const peso = new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" });
const money = (value: number) => peso.format(Number(value) || 0);

const statusStyles: Record<QuotationStatus, string> = {
  draft: "bg-[#f2f0ec] text-[#5f5b57]",
  sent: "bg-[#fff0ef] text-[#8f1f27]",
  approved: "bg-[#edf8f0] text-[#267342]",
  declined: "bg-[#fff7e8] text-[#946516]",
  expired: "bg-[#f2f0ec] text-[#77736e]",
  cancelled: "bg-[#f2f0ec] text-[#77736e]",
};

function StatusBadge({ status }: { status: QuotationStatus }) {
  return <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold capitalize ${statusStyles[status]}`}><span className="h-1.5 w-1.5 rounded-full bg-current" />{status}</span>;
}

function ItemEditor({ item, onChange, onRemove }: { item: ServiceRequestQuotationItem; onChange: (next: ServiceRequestQuotationItem) => void; onRemove: () => void }) {
  return <div className="grid gap-3 rounded-xl border border-[#eeeae5] bg-[#fbfaf8] p-3 sm:grid-cols-[110px_minmax(0,1fr)_90px_110px_auto] sm:items-end">
    <label><span className="mb-1.5 block text-[0.65rem] font-bold uppercase tracking-[0.1em] text-[#85817b]">Type</span><select value={item.item_type} onChange={(event) => onChange({ ...item, item_type: event.target.value as ServiceRequestQuotationItem["item_type"] })} className="h-10 w-full rounded-lg border border-[#dedbd6] bg-white px-2 text-sm font-semibold"><option value="part">Part</option><option value="labor">Labor</option><option value="service">Service</option></select></label>
    <label><span className="mb-1.5 block text-[0.65rem] font-bold uppercase tracking-[0.1em] text-[#85817b]">Description</span><Input value={item.description} onChange={(event) => onChange({ ...item, description: event.target.value })} className="h-10 rounded-lg bg-white" /></label>
    <label><span className="mb-1.5 block text-[0.65rem] font-bold uppercase tracking-[0.1em] text-[#85817b]">Quantity</span><Input type="number" min="0.01" step="0.01" value={item.quantity} onChange={(event) => onChange({ ...item, quantity: Number(event.target.value) })} className="h-10 rounded-lg bg-white" /></label>
    <label><span className="mb-1.5 block text-[0.65rem] font-bold uppercase tracking-[0.1em] text-[#85817b]">Unit Price</span><Input type="number" min="0" step="0.01" value={item.unit_price} onChange={(event) => onChange({ ...item, unit_price: Number(event.target.value) })} className="h-10 rounded-lg bg-white" /></label>
    <button type="button" aria-label={`Remove ${item.description}`} onClick={onRemove} className="flex h-10 items-center justify-center rounded-lg border border-[#ead8d6] bg-white px-3 text-[#8f1f27] hover:bg-[#fff0ef]"><X size={15} /></button>
  </div>;
}

function DraftEditor({ quotation, onSaved, onSent }: { quotation: ServiceRequestQuotation; onSaved: () => void; onSent: (result: Awaited<ReturnType<typeof sendQuotation>>) => void }) {
  const [diagnosisSummary, setDiagnosisSummary] = useState(quotation.diagnosis_summary ?? "");
  const [customerMessage, setCustomerMessage] = useState(quotation.customer_message ?? "");
  const [validUntil, setValidUntil] = useState(quotation.valid_until ?? "");
  const [items, setItems] = useState<ServiceRequestQuotationItem[]>(quotation.items);
  const [isSaving, setIsSaving] = useState(false);

  const totals = useMemo(() => items.reduce((sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.unit_price) || 0), 0), [items]);
  const save = async () => {
    if (!items.every((item) => item.description.trim() && item.quantity > 0 && Number.isFinite(item.quantity) && item.unit_price >= 0 && Number.isFinite(item.unit_price))) {
      toast.error("Every quotation item needs a description, a positive quantity, and a non-negative unit price.");
      return false;
    }
    setIsSaving(true);
    try {
      await updateDraftQuotation({ quotationId: quotation.id, diagnosisSummary, customerMessage, validUntil: validUntil || null, items });
      toast.success("Draft quotation saved.");
      onSaved();
      return true;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Draft quotation could not be saved.");
      return false;
    } finally {
      setIsSaving(false);
    }
  };
  const send = async () => {
    if (!(await save())) return;
    setIsSaving(true);
    try {
      const result = await sendQuotation(quotation.id);
      onSent(result);
      toast.success("Quotation sent and ready for customer approval.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Quotation could not be sent.");
    } finally {
      setIsSaving(false);
    }
  };

  return <div className="mt-5 space-y-4 rounded-2xl border border-[#ead9d6] bg-[#fffaf9] p-4 sm:p-5">
    <div className="grid gap-4 sm:grid-cols-2">
      <label className="sm:col-span-2"><span className="mb-2 block text-xs font-bold uppercase tracking-[0.12em] text-[#85817b]">Diagnosis Summary · customer-safe</span><Textarea value={diagnosisSummary} onChange={(event) => setDiagnosisSummary(event.target.value)} placeholder="Explain the issue in customer-friendly language." className="min-h-24 rounded-xl border-[#dedbd6] bg-white" /></label>
      <label className="sm:col-span-2"><span className="mb-2 block text-xs font-bold uppercase tracking-[0.12em] text-[#85817b]">Customer Message</span><Textarea value={customerMessage} onChange={(event) => setCustomerMessage(event.target.value)} placeholder="Add a helpful message about the recommended repair." className="min-h-24 rounded-xl border-[#dedbd6] bg-white" /></label>
      <label><span className="mb-2 block text-xs font-bold uppercase tracking-[0.12em] text-[#85817b]">Valid Until · optional</span><Input type="date" value={validUntil} onChange={(event) => setValidUntil(event.target.value)} className="h-11 rounded-xl bg-white" /></label>
    </div>
    <div className="border-t border-[#ead9d6] pt-4"><div className="mb-3 flex items-center justify-between gap-3"><p className="text-xs font-bold uppercase tracking-[0.12em] text-[#85817b]">Quotation Items</p><button type="button" onClick={() => setItems([...items, { item_type: "service", description: "", quantity: 1, unit_price: 0, line_total: 0 }])} className="inline-flex items-center gap-1.5 rounded-lg border border-[#dedbd6] bg-white px-3 py-2 text-xs font-bold text-[#B4232C]"><Plus size={14} /> Add item</button></div><div className="space-y-3">{items.map((item, index) => <ItemEditor key={item.id ?? `${item.item_type}-${index}`} item={item} onChange={(next) => setItems(items.map((current, currentIndex) => currentIndex === index ? next : current))} onRemove={() => setItems(items.filter((_, currentIndex) => currentIndex !== index))} />)}</div></div>
    <div className="flex flex-col gap-4 border-t border-[#ead9d6] pt-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.12em] text-[#85817b]">Server-calculated total preview</p><p className="mt-1 font-display text-2xl font-bold text-[#B4232C]">{money(totals)}</p></div><div className="flex flex-wrap gap-2"><button type="button" onClick={() => void save()} disabled={isSaving} className="rounded-xl border border-[#dedbd6] bg-white px-4 py-2.5 text-sm font-bold text-[#5f5b57] disabled:opacity-50">{isSaving ? "Saving..." : "Save Draft"}</button><button type="button" onClick={() => void send()} disabled={isSaving} className="inline-flex items-center gap-2 rounded-xl bg-[#B4232C] px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50"><Send size={15} />{isSaving ? "Working..." : "Send to Customer"}</button></div></div>
  </div>;
}

function QuotationCard({ quotation, link, onReload, onSent }: { quotation: ServiceRequestQuotation; link?: string; onReload: () => void; onSent: (result: Awaited<ReturnType<typeof sendQuotation>>) => void }) {
  const [isEditing, setIsEditing] = useState(quotation.status === "draft");
  const [isRevising, setIsRevising] = useState(false);
  const parts = quotation.items.filter((item) => item.item_type === "part").reduce((sum, item) => sum + item.line_total, 0);
  const labor = quotation.items.filter((item) => item.item_type === "labor").reduce((sum, item) => sum + item.line_total, 0);
  const revise = async () => { setIsRevising(true); try { await createRevisedQuotation(quotation.id); toast.success("Revised draft quotation created."); onReload(); } catch (error) { toast.error(error instanceof Error ? error.message : "A revised quotation could not be created."); } finally { setIsRevising(false); } };
  return <article className="rounded-2xl border border-[#e5e1db] bg-white p-4 sm:p-5"><div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><div className="flex flex-wrap items-center gap-2"><p className="font-display text-lg font-bold text-[#2f2c29]">{quotation.quotation_number}</p><StatusBadge status={quotation.status} /></div><p className="mt-1 text-xs text-[#817c76]">Created {formatQuotationDateTime(quotation.created_at)}{quotation.sent_at ? ` · Sent ${formatQuotationDateTime(quotation.sent_at)}` : ""}</p></div>{quotation.status !== "draft" && <button type="button" onClick={() => void revise()} disabled={isRevising} className="inline-flex items-center gap-1.5 self-start rounded-lg border border-[#dedbd6] bg-white px-3 py-2 text-xs font-bold text-[#B4232C] disabled:opacity-50"><RefreshCw size={14} />{isRevising ? "Creating..." : "Create Revised Quotation"}</button>}</div><div className="mt-5 grid gap-3 sm:grid-cols-3"><div className="rounded-xl bg-[#fbfaf8] p-3"><p className="text-xs font-bold uppercase tracking-[0.1em] text-[#9a9690]">Parts</p><p className="mt-1 font-bold text-[#3e3a36]">{money(parts)}</p></div><div className="rounded-xl bg-[#fbfaf8] p-3"><p className="text-xs font-bold uppercase tracking-[0.1em] text-[#9a9690]">Labor</p><p className="mt-1 font-bold text-[#3e3a36]">{money(labor)}</p></div><div className="rounded-xl bg-[#fff0ef] p-3"><p className="text-xs font-bold uppercase tracking-[0.1em] text-[#8f1f27]">Total</p><p className="mt-1 font-display text-lg font-bold text-[#B4232C]">{money(quotation.total_amount)}</p></div></div><div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs text-[#6f6a64]"><span>Valid until: <strong>{formatQuotationDate(quotation.valid_until)}</strong></span>{quotation.responded_at && <span>Responded: <strong>{formatQuotationDateTime(quotation.responded_at)}</strong></span>}{quotation.response && <span>Response: <strong className="capitalize">{quotation.response}</strong></span>}</div>{quotation.customer_comment && <p className="mt-3 rounded-xl bg-[#fbfaf8] p-3 text-sm leading-6 text-[#5f5b57]">Customer comment: {quotation.customer_comment}</p>}{quotation.status === "draft" && isEditing && <DraftEditor quotation={quotation} onSaved={onReload} onSent={onSent} />}{quotation.status === "draft" && !isEditing && <button type="button" onClick={() => setIsEditing(true)} className="mt-4 rounded-xl border border-[#dedbd6] bg-white px-4 py-2.5 text-sm font-bold text-[#B4232C]">Edit Draft</button>}{link && <div className="mt-5 rounded-xl border border-[#ead9d6] bg-[#fff5f3] p-3"><p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.1em] text-[#8f1f27]"><LinkIcon size={14} /> Quotation Ready</p><p className="mt-2 break-all text-xs leading-5 text-[#6f6a64]">{link}</p><button type="button" onClick={() => { void navigator.clipboard.writeText(link); toast.success("Customer approval link copied."); }} className="mt-3 inline-flex items-center gap-2 rounded-lg bg-[#B4232C] px-3 py-2 text-xs font-bold text-white"><ClipboardCopy size={14} /> Copy Customer Approval Link</button></div>}</article>;
}

export function QuotationManager({ requestId, diagnosis, parts, labor }: { requestId: string; diagnosis: string | null; parts: RepairPart[]; labor: RepairLabor[] }) {
  const [quotations, setQuotations] = useState<ServiceRequestQuotation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [links, setLinks] = useState<Record<string, string>>({});

  const load = useCallback(async () => { setIsLoading(true); try { setQuotations(await listQuotations(requestId)); } catch (error) { toast.error(error instanceof Error ? error.message : "Quotations could not be loaded."); } finally { setIsLoading(false); } }, [requestId]);
  useEffect(() => { void load(); }, [load]);
  const create = async () => { setIsCreating(true); try { await createQuotation({ requestId, diagnosisSummary: diagnosis ?? "", customerMessage: "", validUntil: null }); toast.success("Draft quotation created from the current repair data."); await load(); } catch (error) { toast.error(error instanceof Error ? error.message : "Quotation could not be created."); } finally { setIsCreating(false); } };
  const sendResult = (result: Awaited<ReturnType<typeof sendQuotation>>) => { setLinks((current) => ({ ...current, [result.id]: getQuotationUrl(result.customer_token) })); void load(); };
  const hasDraft = quotations.some((quotation) => quotation.status === "draft");
  const liveParts = parts.reduce((sum, part) => sum + part.quantity * part.unit_cost, 0);
  const liveLabor = labor.reduce((sum, item) => sum + item.hours * item.hourly_rate, 0);

  return <section className="rounded-[1.5rem] border border-[#ead9d6] bg-white p-5 shadow-[0_12px_35px_rgba(180,35,44,0.05)] sm:p-7"><div className="flex flex-wrap items-start justify-between gap-4 border-b border-[#eeeae5] pb-5"><div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#fff0ef] text-[#B4232C]"><FileText size={18} /></span><div><p className="text-xs font-bold uppercase tracking-[0.12em] text-[#B4232C]">Customer Quotation</p><h2 className="mt-1 font-display text-xl font-bold tracking-[-0.04em]">Prepare a customer-safe quote</h2></div></div>{!hasDraft && <button type="button" onClick={() => void create()} disabled={isCreating || isLoading} className="inline-flex items-center gap-2 rounded-xl bg-[#B4232C] px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50"><Plus size={16} />{isCreating ? "Creating..." : "Create Quotation"}</button>}</div><div className="mt-5 grid gap-3 sm:grid-cols-3"><div className="rounded-xl bg-[#fbfaf8] p-3"><p className="text-xs font-bold uppercase tracking-[0.1em] text-[#9a9690]">Current parts</p><p className="mt-1 font-bold text-[#3e3a36]">{money(liveParts)}</p></div><div className="rounded-xl bg-[#fbfaf8] p-3"><p className="text-xs font-bold uppercase tracking-[0.1em] text-[#9a9690]">Current labor</p><p className="mt-1 font-bold text-[#3e3a36]">{money(liveLabor)}</p></div><div className="rounded-xl bg-[#fff0ef] p-3"><p className="text-xs font-bold uppercase tracking-[0.1em] text-[#8f1f27]">Current total</p><p className="mt-1 font-display text-lg font-bold text-[#B4232C]">{money(liveParts + liveLabor)}</p></div></div><p className="mt-4 text-xs leading-5 text-[#817c76]">The first quotation snapshot is copied from the actual recorded parts and labor. Later repair changes do not alter an issued quotation.</p><div className="mt-5 space-y-4">{isLoading ? <div className="py-8 text-center text-sm text-[#817c76]"><Loader2 className="mx-auto mb-2 animate-spin text-[#B4232C]" size={21} />Loading quotations...</div> : quotations.length === 0 ? <div className="rounded-xl border border-dashed border-[#d7d3ce] p-6 text-center"><p className="text-sm font-bold text-[#4e4a46]">No quotations prepared yet.</p><p className="mt-1 text-xs text-[#817c76]">Create one when diagnosis, parts, and labor are ready for customer review.</p></div> : quotations.map((quotation) => <QuotationCard key={quotation.id} quotation={quotation} link={links[quotation.id]} onReload={() => void load()} onSent={sendResult} />)}</div></section>;
}

export default QuotationManager;
