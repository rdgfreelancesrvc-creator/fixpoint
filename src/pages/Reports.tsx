import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  CircleAlert,
  Clock3,
  FileBarChart,
  RefreshCw,
  Wrench,
  XCircle,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AppShell } from "@/components/AppShell";
import { useAuth } from "@/contexts/AuthContext";
import {
  getReportsDashboard,
  type ReportRange,
  type ReportsDashboard,
} from "@/lib/reports";

type Preset = "today" | "last_7_days" | "last_30_days" | "this_month" | "custom";

type DateParts = { year: number; month: number; day: number };

const statusLabels: Record<string, string> = {
  received: "Received",
  diagnosing: "Diagnosing",
  waiting_customer_approval: "Waiting for Customer Approval",
  approved: "Approved",
  in_repair: "In Repair",
  waiting_parts: "Waiting for Parts",
  ready_for_pickup: "Ready for Pickup",
  completed: "Completed",
  cancelled: "Cancelled",
};

const peso = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
  maximumFractionDigits: 2,
});

const wholeNumber = new Intl.NumberFormat("en-PH");

function localDateString(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseDate(value: string): DateParts | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const [, yearText, monthText, dayText] = match;
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  const date = new Date(year, month - 1, day);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return null;
  return { year, month, day };
}

function dateDifferenceInclusive(startDate: string, endDate: string) {
  const start = parseDate(startDate);
  const end = parseDate(endDate);
  if (!start || !end) return null;
  const startTime = new Date(start.year, start.month - 1, start.day).getTime();
  const endTime = new Date(end.year, end.month - 1, end.day).getTime();
  return Math.floor((endTime - startTime) / 86400000) + 1;
}

function getPresetRange(preset: Exclude<Preset, "custom">): ReportRange {
  const today = new Date();
  const end = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
  let start: Date;

  if (preset === "today") start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  else if (preset === "last_7_days") start = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 6);
  else if (preset === "last_30_days") start = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 29);
  else start = new Date(today.getFullYear(), today.getMonth(), 1);

  return { startDate: localDateString(start), endDate: localDateString(end) };
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-PH", { month: "short", day: "numeric" }).format(new Date(`${value}T00:00:00`));
}

function formatRangeLabel(range: ReportRange) {
  const end = new Date(`${range.endDate}T00:00:00`);
  end.setDate(end.getDate() - 1);
  return `${formatDate(range.startDate)} – ${formatDate(localDateString(end))}`;
}

function StatCard({ label, value, helper, icon: Icon, tone = "neutral" }: { label: string; value: string; helper: string; icon: typeof Activity; tone?: "neutral" | "red" | "green" | "amber" }) {
  const toneClasses = {
    neutral: "bg-[#f2f0ec] text-[#5f5b57]",
    red: "bg-[#fff0ef] text-[#B4232C]",
    green: "bg-[#eaf7f0] text-[#19764b]",
    amber: "bg-[#fff6e5] text-[#a56600]",
  };

  return (
    <div className="rounded-[1.35rem] border border-[#e5e2dd] bg-white p-5 shadow-[0_10px_26px_rgba(37,37,37,0.03)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.13em] text-[#96918a]">{label}</p>
          <p className="mt-3 font-display text-2xl font-bold tracking-[-0.04em] text-[#252525]">{value}</p>
        </div>
        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${toneClasses[tone]}`}><Icon size={18} /></span>
      </div>
      <p className="mt-3 text-xs leading-5 text-[#8b867f]">{helper}</p>
    </div>
  );
}

function Panel({ title, eyebrow, children, className = "" }: { title: string; eyebrow: string; children: React.ReactNode; className?: string }) {
  return (
    <section className={`rounded-[1.5rem] border border-[#e5e2dd] bg-white p-5 shadow-[0_10px_26px_rgba(37,37,37,0.03)] sm:p-7 ${className}`}>
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#B4232C]">{eyebrow}</p>
          <h3 className="mt-2 font-display text-xl font-bold tracking-[-0.04em] text-[#252525]">{title}</h3>
        </div>
      </div>
      {children}
    </section>
  );
}

function EmptyPanel({ message = "No data for this date range." }: { message?: string }) {
  return <div className="flex min-h-[160px] items-center justify-center rounded-2xl border border-dashed border-[#dedbd6] bg-[#fbfaf8] px-5 text-center text-sm text-[#8b867f]">{message}</div>;
}

export default function Reports() {
  const { profile } = useAuth();
  const [preset, setPreset] = useState<Preset>("last_30_days");
  const initialCustom = getPresetRange("last_30_days");
  const [customStart, setCustomStart] = useState(initialCustom.startDate);
  const [customEnd, setCustomEnd,] = useState(() => {
    const end = new Date(`${initialCustom.endDate}T00:00:00`);
    end.setDate(end.getDate() - 1);
    return localDateString(end);
  });
  const [range, setRange] = useState<ReportRange>(initialCustom);
  const [report, setReport] = useState<ReportsDashboard | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rangeError, setRangeError] = useState<string | null>(null);

  const loadReport = async (nextRange: ReportRange) => {
    setIsLoading(true);
    setError(null);
    try {
      setReport(await getReportsDashboard(nextRange));
      setRange(nextRange);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Reports could not be loaded.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (preset === "custom") return;
    void loadReport(getPresetRange(preset));
  }, [preset]);

  const validateCustomRange = () => {
    if (!parseDate(customStart) || !parseDate(customEnd)) {
      setRangeError("Enter valid calendar dates for the custom range.");
      return null;
    }
    const days = dateDifferenceInclusive(customStart, customEnd);
    if (days === null || days < 1) {
      setRangeError("The start date must be on or before the end date.");
      return null;
    }
    if (days > 366) {
      setRangeError("Custom ranges can be up to 366 days.");
      return null;
    }
    setRangeError(null);
    const endExclusive = new Date(`${customEnd}T00:00:00`);
    endExclusive.setDate(endExclusive.getDate() + 1);
    return { startDate: customStart, endDate: localDateString(endExclusive) };
  };

  const applyCustomRange = () => {
    const nextRange = validateCustomRange();
    if (nextRange) void loadReport(nextRange);
  };

  const summary = report?.summary;
  const quotations = report?.quotations;
  const hasReportData = Boolean(report);
  const dateLabel = useMemo(() => (report ? formatRangeLabel(range) : "Selected period"), [report, range]);

  if (profile?.role !== "admin" && profile?.role !== "staff") {
    return null;
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-7xl">
        <div className="mb-7 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-[#B4232C]">FixPoint intelligence</p>
            <h2 className="font-display text-3xl font-bold tracking-[-0.05em] sm:text-4xl">Reports workspace</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#77736e]">A read-only view of service demand, repair flow, technician workload, and issued quotations.</p>
          </div>
          <div className="flex items-center gap-2 text-xs font-semibold text-[#8b867f]"><CalendarDays size={15} className="text-[#B4232C]" /> Request creation date · {dateLabel}</div>
        </div>

        <div className="mb-7 rounded-[1.35rem] border border-[#e5e2dd] bg-white p-4 shadow-[0_10px_26px_rgba(37,37,37,0.03)] sm:p-5">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.13em] text-[#96918a]">Date range</p>
              <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="Report date range">
                {([
                  ["today", "Today"],
                  ["last_7_days", "Last 7 days"],
                  ["last_30_days", "Last 30 days"],
                  ["this_month", "This month"],
                  ["custom", "Custom range"],
                ] as const).map(([value, label]) => (
                  <button key={value} type="button" onClick={() => setPreset(value)} className={`rounded-full px-4 py-2.5 text-sm font-bold transition-colors ${preset === value ? "bg-[#252525] text-white" : "border border-[#dedbd6] bg-[#fbfaf8] text-[#6f6a64] hover:border-[#B4232C] hover:text-[#B4232C]"}`}>{label}</button>
                ))}
              </div>
            </div>
            {preset === "custom" && (
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                <label className="text-xs font-bold text-[#6f6a64]">From<input aria-label="Custom report start date" type="date" value={customStart} onChange={(event) => setCustomStart(event.target.value)} className="mt-1 block rounded-xl border border-[#dedbd6] bg-[#fbfaf8] px-3 py-2.5 text-sm font-semibold text-[#252525] outline-none focus:border-[#B4232C]" /></label>
                <label className="text-xs font-bold text-[#6f6a64]">To<input aria-label="Custom report end date" type="date" value={customEnd} onChange={(event) => setCustomEnd(event.target.value)} className="mt-1 block rounded-xl border border-[#dedbd6] bg-[#fbfaf8] px-3 py-2.5 text-sm font-semibold text-[#252525] outline-none focus:border-[#B4232C]" /></label>
                <button type="button" onClick={applyCustomRange} className="rounded-xl bg-[#B4232C] px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-[#961f27]">Apply range</button>
              </div>
            )}
          </div>
          {rangeError && <p role="alert" className="mt-3 flex items-center gap-2 text-sm font-semibold text-[#B4232C]"><CircleAlert size={15} />{rangeError}</p>}
        </div>

        {error && !hasReportData && (
          <div role="alert" className="mb-7 flex flex-col items-start justify-between gap-4 rounded-2xl border border-[#efc4c1] bg-[#fff5f4] p-5 sm:flex-row sm:items-center">
            <div><p className="font-bold text-[#8f1f27]">Reports are unavailable</p><p className="mt-1 text-sm text-[#a34b50]">{error}</p></div>
            <button type="button" onClick={() => void loadReport(range)} className="flex items-center gap-2 rounded-xl border border-[#e7b3b1] bg-white px-4 py-2.5 text-sm font-bold text-[#B4232C]"><RefreshCw size={15} />Retry</button>
          </div>
        )}

        {isLoading && !report ? (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label="Loading reports">
            {Array.from({ length: 7 }).map((_, index) => <div key={index} className="h-[150px] animate-pulse rounded-[1.35rem] border border-[#e5e2dd] bg-white" />)}
          </div>
        ) : report ? (
          <>
            {error && <div role="alert" className="mb-5 rounded-xl border border-[#f0d6a7] bg-[#fff9ec] px-4 py-3 text-sm font-semibold text-[#8d610e]">Showing the last successful report. {error}</div>}
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard label="Total requests" value={wholeNumber.format(summary?.total_requests ?? 0)} helper="Requests created in the selected period" icon={FileBarChart} tone="red" />
              <StatCard label="New / received" value={wholeNumber.format(summary?.new_received_requests ?? 0)} helper="Currently waiting to be diagnosed" icon={Activity} />
              <StatCard label="Active repairs" value={wholeNumber.format(summary?.active_repairs ?? 0)} helper="Open repairs across active statuses" icon={Wrench} tone="amber" />
              <StatCard label="Completed repairs" value={wholeNumber.format(summary?.completed_repairs ?? 0)} helper="Requests currently marked completed" icon={CheckCircle2} tone="green" />
              <StatCard label="Cancelled requests" value={wholeNumber.format(summary?.cancelled_requests ?? 0)} helper="Requests marked cancelled" icon={XCircle} />
              <StatCard label="Total quoted amount" value={peso.format(summary?.total_quoted_amount ?? 0)} helper="Issued quotations, not collected revenue" icon={BarChart3} tone="red" />
              <StatCard label="Average quotation" value={peso.format(summary?.average_quotation_amount ?? 0)} helper="Average issued quotation amount" icon={Clock3} />
            </div>

            <div className="mt-5 grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
              <Panel eyebrow="Demand trend" title="Requests over time">
                {report.requests_over_time.length === 0 ? <EmptyPanel /> : <div className="h-[280px] w-full"><ResponsiveContainer width="100%" height="100%"><AreaChart data={report.requests_over_time} margin={{ top: 10, right: 8, left: -22, bottom: 0 }}><defs><linearGradient id="requestFill" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#B4232C" stopOpacity={0.22} /><stop offset="95%" stopColor="#B4232C" stopOpacity={0.02} /></linearGradient></defs><CartesianGrid stroke="#eeeae5" vertical={false} /><XAxis dataKey="date" tickFormatter={formatDate} tickLine={false} axisLine={false} minTickGap={26} tick={{ fill: "#96918a", fontSize: 11 }} /><YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fill: "#96918a", fontSize: 11 }} /><Tooltip labelFormatter={(value) => formatDate(String(value))} contentStyle={{ borderRadius: 12, borderColor: "#e5e2dd", boxShadow: "0 8px 20px rgba(37,37,37,.08)" }} /><Area type="monotone" dataKey="count" name="Requests" stroke="#B4232C" strokeWidth={2.5} fill="url(#requestFill)" /></AreaChart></ResponsiveContainer></div>}
              </Panel>
              <Panel eyebrow="Workflow" title="Requests by status">
                <div className="space-y-3">{report.requests_by_status.map((item) => <div key={item.status} className="flex items-center gap-3"><span className="w-[130px] shrink-0 text-xs font-semibold leading-4 text-[#6f6a64] sm:w-[170px]">{statusLabels[item.status] ?? item.status}</span><div className="h-2 flex-1 overflow-hidden rounded-full bg-[#f0ede9]"><div className="h-full rounded-full bg-[#B4232C]" style={{ width: `${summary?.total_requests ? Math.max((item.count / summary.total_requests) * 100, item.count ? 4 : 0) : 0}%` }} /></div><span className="w-7 text-right text-sm font-bold text-[#252525]">{item.count}</span></div>)}</div>
              </Panel>
            </div>

            <div className="mt-5 grid gap-5 lg:grid-cols-2">
              <Panel eyebrow="Service mix" title="Requests by service">
                {report.services.length === 0 ? <EmptyPanel /> : <div className="h-[280px] w-full"><ResponsiveContainer width="100%" height="100%"><BarChart data={report.services} layout="vertical" margin={{ top: 4, right: 12, left: 6, bottom: 4 }}><CartesianGrid stroke="#eeeae5" horizontal={false} /><XAxis type="number" allowDecimals={false} axisLine={false} tickLine={false} tick={{ fill: "#96918a", fontSize: 11 }} /><YAxis type="category" dataKey="service_name" width={100} axisLine={false} tickLine={false} tick={{ fill: "#6f6a64", fontSize: 11 }} /><Tooltip cursor={{ fill: "#fbfaf8" }} contentStyle={{ borderRadius: 12, borderColor: "#e5e2dd" }} /><Bar dataKey="count" name="Requests" fill="#252525" radius={[0, 6, 6, 0]} barSize={20} /></BarChart></ResponsiveContainer></div>}
              </Panel>
              <Panel eyebrow="Team capacity" title="Technician workload">
                {report.technician_workload.length === 0 ? <EmptyPanel message="No technicians found." /> : <div className="overflow-x-auto"><table className="w-full min-w-[420px] text-left"><thead><tr className="border-b border-[#eeeae5] text-[0.65rem] font-bold uppercase tracking-[0.12em] text-[#96918a]"><th className="pb-3">Technician</th><th className="pb-3 text-right">Active repairs</th><th className="pb-3 text-right">Completed in range</th></tr></thead><tbody>{report.technician_workload.map((technician) => <tr key={technician.technician_id} className="border-b border-[#f0ede9] last:border-0"><td className="py-4 text-sm font-bold text-[#3f3b37]">{technician.technician_name}</td><td className="py-4 text-right text-sm font-bold text-[#B4232C]">{technician.active_repairs}</td><td className="py-4 text-right text-sm font-semibold text-[#5f5b57]">{technician.completed_repairs}</td></tr>)}</tbody></table></div>}
              </Panel>
            </div>

            <Panel eyebrow="Issued quotations" title="Quotation reporting" className="mt-5">
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {[
                  ["Number of quotations", quotations?.number_of_quotations ?? 0],
                  ["Pending customer action", quotations?.pending_customer_action ?? 0],
                  ["Approved quotations", quotations?.approved_quotations ?? 0],
                  ["Declined quotations", quotations?.declined_quotations ?? 0],
                  ["Expired quotations", quotations?.expired_quotations ?? 0],
                ].map(([label, value]) => <div key={String(label)} className="rounded-2xl bg-[#fbfaf8] p-4"><p className="text-xs font-semibold leading-5 text-[#8b867f]">{label}</p><p className="mt-2 font-display text-2xl font-bold text-[#252525]">{wholeNumber.format(Number(value))}</p></div>)}
              </div>
              <div className="mt-5 grid gap-3 border-t border-[#eeeae5] pt-5 sm:grid-cols-2"><div><p className="text-xs font-bold uppercase tracking-[0.12em] text-[#96918a]">Quoted amount</p><p className="mt-2 font-display text-2xl font-bold text-[#B4232C]">{peso.format(quotations?.total_quoted_amount ?? 0)}</p></div><div><p className="text-xs font-bold uppercase tracking-[0.12em] text-[#96918a]">Average quoted amount</p><p className="mt-2 font-display text-2xl font-bold text-[#252525]">{peso.format(quotations?.average_quoted_amount ?? 0)}</p></div></div>
              <p className="mt-5 rounded-xl bg-[#fff9ec] px-4 py-3 text-xs font-semibold leading-5 text-[#8d610e]">Quoted amounts reflect issued quotations only. They are not payments, invoices, or collected revenue.</p>
            </Panel>
          </>
        ) : null}
      </div>
    </AppShell>
  );
}
