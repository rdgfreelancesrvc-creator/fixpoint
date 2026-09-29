import { useCallback, useEffect, useState, type ReactNode } from "react";
import { ArrowLeft, ChevronRight, Loader2, Mail, Phone, Search, ShieldAlert, UserRound, Users, Wrench } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { AppShell } from "@/components/AppShell";
import { Input } from "@/components/ui/input";
import {
  customerSortOptions,
  formatCustomerDate,
  formatCustomerDateTime,
  formatCustomerStatus,
  getDeviceLabel,
  getInternalCustomer,
  listInternalCustomers,
  type CustomerDetail,
  type CustomerListItem,
  type CustomerRequestSummary,
  type CustomerSort,
} from "@/lib/adminCustomers";
import type { RequestStatus } from "@/lib/adminServiceRequests";

function StatusBadge({ status }: { status: RequestStatus }) {
  return <span className={`inline-flex max-w-full items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ${status === "cancelled" ? "bg-[#f2f0ec] text-[#77736e]" : status === "completed" ? "bg-[#edf8f0] text-[#267342]" : status === "received" ? "bg-[#f2f0ec] text-[#5f5b57]" : "bg-[#fff0ef] text-[#8f1f27]"}`}><span className={`h-1.5 w-1.5 shrink-0 rounded-full ${status === "cancelled" ? "bg-[#aaa59e]" : status === "completed" ? "bg-[#38a863]" : status === "received" ? "bg-[#8b867f]" : "bg-[#B4232C]"}`} />{formatCustomerStatus(status)}</span>;
}

function CustomerAvatar({ name, large = false }: { name: string; large?: boolean }) {
  const initials = name.split(" ").filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
  return <span className={`flex shrink-0 items-center justify-center rounded-full bg-[#f3c7c6] font-bold text-[#8b2028] ${large ? "h-16 w-16 text-xl" : "h-11 w-11 text-sm"}`}>{initials || "C"}</span>;
}

function CustomerListRow({ customer }: { customer: CustomerListItem }) {
  return <Link to={`/app/customers/${customer.id}`} className="grid grid-cols-[minmax(210px,1.2fr)_minmax(130px,0.8fr)_minmax(190px,1fr)_110px_minmax(150px,0.9fr)_26px] items-center gap-4 px-6 py-4 transition-colors hover:bg-[#fffcfa]"><div className="flex min-w-0 items-center gap-3"><CustomerAvatar name={customer.full_name} /><div className="min-w-0"><p className="truncate font-display font-bold text-[#2f2c29]">{customer.full_name}</p><p className="mt-0.5 truncate text-xs text-[#9a9690]">Joined {formatCustomerDate(customer.created_at)}</p></div></div><p className="truncate text-sm font-semibold text-[#4e4a46]">{customer.phone}</p><p className="truncate text-sm text-[#5f5b57]">{customer.email || "No email provided"}</p><p className="text-sm font-bold text-[#4e4a46]">{customer.request_count}</p><div className="min-w-0"><p className="truncate text-sm font-semibold text-[#4e4a46]">{formatCustomerDate(customer.latest_request_date)}</p><p className="mt-0.5 truncate text-xs font-bold text-[#B4232C]">{customer.latest_request_number || "No request number"}</p></div><ChevronRight size={17} className="text-[#B4232C]" /></Link>;
}

function CustomerCard({ customer }: { customer: CustomerListItem }) {
  return <Link to={`/app/customers/${customer.id}`} className="block p-5 transition-colors hover:bg-[#fffcfa]"><div className="flex items-start justify-between gap-3"><div className="flex min-w-0 items-center gap-3"><CustomerAvatar name={customer.full_name} /><div className="min-w-0"><p className="truncate font-display text-lg font-bold text-[#2f2c29]">{customer.full_name}</p><p className="mt-1 truncate text-xs text-[#817c76]">{customer.phone}</p></div></div><ChevronRight size={18} className="mt-1 shrink-0 text-[#B4232C]" /></div><div className="mt-5 grid grid-cols-2 gap-4 border-t border-[#eeeae5] pt-4"><div><p className="text-[0.68rem] font-bold uppercase tracking-[0.12em] text-[#aaa59e]">Requests</p><p className="mt-1 text-sm font-bold text-[#4e4a46]">{customer.request_count}</p></div><div><p className="text-[0.68rem] font-bold uppercase tracking-[0.12em] text-[#aaa59e]">Latest request</p><p className="mt-1 truncate text-sm font-bold text-[#B4232C]">{customer.latest_request_number || "None yet"}</p></div></div><p className="mt-4 truncate text-sm text-[#6f6a64]">{customer.email || "No email provided"}</p></Link>;
}

function EmptyCustomers({ filtered }: { filtered: boolean }) {
  return <div className="rounded-[1.5rem] border border-dashed border-[#d7d3ce] bg-white/60 p-10 text-center sm:p-16"><div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#fff0ef] text-[#B4232C]"><Users size={25} /></div><h3 className="font-display text-2xl font-bold">{filtered ? "No customers match this search" : "No customers found"}</h3><p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-[#85817b]">{filtered ? "Try searching by a different name, phone number, or email." : "Customers will appear here when a public repair request is submitted."}</p></div>;
}

function CustomerFilters({ search, setSearch, sort, setSort }: { search: string; setSearch: (value: string) => void; sort: CustomerSort; setSort: (value: CustomerSort) => void }) {
  return <div className="rounded-[1.5rem] border border-[#e5e2dd] bg-white p-4 shadow-[0_12px_35px_rgba(37,37,37,0.04)] sm:p-5"><div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_230px]"><label className="relative block"><span className="sr-only">Search customers by name, phone, or email</span><Search size={17} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#9a9690]" /><Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search name, phone, or email..." className="h-12 rounded-xl border-[#dedbd6] bg-[#fbfaf8] pl-11 focus-visible:ring-[#B4232C]/15" /></label><label className="block"><span className="sr-only">Sort customers</span><select aria-label="Sort customers" value={sort} onChange={(event) => setSort(event.target.value as CustomerSort)} className="h-12 w-full rounded-xl border border-[#dedbd6] bg-[#fbfaf8] px-3 text-sm font-semibold text-[#4e4a46] outline-none transition-colors focus:border-[#B4232C] focus:ring-4 focus:ring-[#B4232C]/10">{customerSortOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label></div></div>;
}

export default function AdminCustomers() {
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<CustomerSort>("latest_desc");
  const [customers, setCustomers] = useState<CustomerListItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadCustomers = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await listInternalCustomers({ search, sort });
      setCustomers(result.customers);
      setTotalCount(result.totalCount);
    } catch (loadError) {
      console.error("[AdminCustomers] Failed to load customers", loadError);
      setError(loadError instanceof Error ? loadError.message : "Customers could not be loaded.");
    } finally {
      setIsLoading(false);
    }
  }, [search, sort]);

  useEffect(() => {
    const timeout = window.setTimeout(() => void loadCustomers(), 250);
    return () => window.clearTimeout(timeout);
  }, [loadCustomers]);

  return <AppShell><div className="mx-auto max-w-7xl"><div className="mb-8"><p className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-[#B4232C]"><Users size={14} /> FixPoint workspace</p><div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><h2 className="font-display text-3xl font-bold tracking-[-0.05em] sm:text-4xl">Customers</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-[#77736e]">A clear view of every customer connected to your repair desk.</p></div>{totalCount > 0 && <span className="w-fit rounded-full bg-white px-3 py-2 text-xs font-bold text-[#77736e] shadow-sm">{totalCount} {totalCount === 1 ? "customer" : "customers"}</span>}</div></div><CustomerFilters search={search} setSearch={setSearch} sort={sort} setSort={setSort} />{isLoading ? <div className="mt-5 rounded-[1.5rem] border border-[#e5e2dd] bg-white p-12 text-center text-sm font-semibold text-[#77736e]"><Loader2 className="mx-auto mb-3 animate-spin text-[#B4232C]" size={24} />Loading customers...</div> : error ? <div className="mt-5 rounded-[1.5rem] border border-[#efc4c3] bg-[#fff4f3] p-8 text-center" role="alert"><ShieldAlert className="mx-auto mb-3 text-[#B4232C]" size={25} /><p className="font-bold text-[#8f1f27]">Customers could not be loaded</p><p className="mt-2 text-sm text-[#a64a4e]">{error}</p><button type="button" onClick={() => void loadCustomers()} className="mt-5 rounded-xl bg-[#B4232C] px-4 py-2.5 text-sm font-bold text-white">Try again</button></div> : customers.length === 0 ? <div className="mt-5"><EmptyCustomers filtered={Boolean(search.trim())} /></div> : <div className="mt-5 overflow-hidden rounded-[1.5rem] border border-[#e5e2dd] bg-white shadow-[0_12px_35px_rgba(37,37,37,0.04)]"><div className="hidden overflow-x-auto md:block"><div className="grid min-w-[1000px] grid-cols-[minmax(210px,1.2fr)_minmax(130px,0.8fr)_minmax(190px,1fr)_110px_minmax(150px,0.9fr)_26px] gap-4 border-b border-[#eeeae5] bg-[#fbfaf8] px-6 py-4 text-[0.68rem] font-bold uppercase tracking-[0.14em] text-[#9a9690]"><span>Customer</span><span>Phone</span><span>Email</span><span>Requests</span><span>Latest request</span><span /></div><div className="min-w-[1000px] divide-y divide-[#eeeae5]">{customers.map((customer) => <CustomerListRow key={customer.id} customer={customer} />)}</div></div><div className="divide-y divide-[#eeeae5] md:hidden">{customers.map((customer) => <CustomerCard key={customer.id} customer={customer} />)}</div></div>}</div></AppShell>;
}

function DetailSection({ title, icon: Icon, children }: { title: string; icon: typeof UserRound; children: ReactNode }) {
  return <section className="rounded-[1.5rem] border border-[#e5e1db] bg-white p-5 shadow-[0_12px_35px_rgba(37,37,37,0.04)] sm:p-7"><div className="flex items-center gap-3 border-b border-[#eeeae5] pb-5"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#fff0ef] text-[#B4232C]"><Icon size={18} /></span><h2 className="font-display text-xl font-bold tracking-[-0.04em]">{title}</h2></div><div className="pt-5">{children}</div></section>;
}

function DetailValue({ label, value }: { label: string; value: string }) {
  return <div><dt className="text-[0.68rem] font-bold uppercase tracking-[0.12em] text-[#9a9690]">{label}</dt><dd className="mt-1 text-sm font-semibold leading-6 text-[#4e4a46]">{value || "—"}</dd></div>;
}

function ContactPreferences({ customer }: { customer: CustomerDetail }) {
  const preferences = [customer.contact_email && "Email", customer.contact_sms && "SMS", customer.contact_phone && "Phone Call"].filter(Boolean) as string[];
  return <div className="flex flex-wrap gap-2">{preferences.length > 0 ? preferences.map((preference) => <span key={preference} className="rounded-full bg-[#fff0ef] px-3 py-1.5 text-xs font-bold text-[#8f1f27]">{preference}</span>) : <span className="text-sm text-[#817c76]">No contact preference recorded yet.</span>}</div>;
}

function CustomerRequestRow({ request }: { request: CustomerRequestSummary }) {
  return <Link to={`/app/requests/${request.id}`} className="block rounded-2xl border border-[#eeeae5] bg-[#fbfaf8] p-4 transition-colors hover:border-[#e4b7b5] hover:bg-[#fffaf9] sm:p-5"><div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><p className="font-display text-lg font-bold text-[#2f2c29]">{request.request_number}</p><p className="mt-1 text-sm font-semibold text-[#5f5b57]">{getDeviceLabel(request)}</p></div><StatusBadge status={request.status} /></div><div className="mt-4 grid gap-4 border-t border-[#eeeae5] pt-4 sm:grid-cols-3"><div><p className="text-[0.68rem] font-bold uppercase tracking-[0.12em] text-[#9a9690]">Service</p><p className="mt-1 text-sm font-semibold text-[#4e4a46]">{request.service_name || "Service unavailable"}</p></div><div><p className="text-[0.68rem] font-bold uppercase tracking-[0.12em] text-[#9a9690]">Assigned technician</p><p className="mt-1 text-sm font-semibold text-[#4e4a46]">{request.assigned_technician?.name || "Unassigned"}</p></div><div><p className="text-[0.68rem] font-bold uppercase tracking-[0.12em] text-[#9a9690]">Created</p><p className="mt-1 text-sm text-[#6f6a64]">{formatCustomerDateTime(request.created_at)}</p></div></div><div className="mt-4 flex items-center justify-end gap-1 text-sm font-bold text-[#B4232C]">Open request details <ChevronRight size={16} /></div></Link>;
}

function CustomerDetailContent({ customer }: { customer: CustomerDetail }) {
  return <><div className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-end"><div className="flex items-center gap-4"><CustomerAvatar name={customer.full_name} large /><div><p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-[#B4232C]">Customer profile</p><h2 className="font-display text-3xl font-bold tracking-[-0.05em] sm:text-4xl">{customer.full_name}</h2><p className="mt-2 text-sm text-[#77736e]">Customer since {formatCustomerDate(customer.created_at)}</p></div></div><span className="w-fit rounded-full bg-white px-3 py-2 text-xs font-bold text-[#77736e] shadow-sm">{customer.requests.length} {customer.requests.length === 1 ? "service request" : "service requests"}</span></div><div className="grid gap-5 lg:grid-cols-[minmax(0,0.82fr)_minmax(0,1.18fr)]"><div className="space-y-5"><DetailSection title="Customer information" icon={UserRound}><dl className="grid gap-5"><DetailValue label="Full name" value={customer.full_name} /><div><dt className="text-[0.68rem] font-bold uppercase tracking-[0.12em] text-[#9a9690]">Phone</dt><dd className="mt-1 flex items-center gap-2 text-sm font-semibold text-[#4e4a46]"><Phone size={15} className="text-[#B4232C]" />{customer.phone}</dd></div><div><dt className="text-[0.68rem] font-bold uppercase tracking-[0.12em] text-[#9a9690]">Email</dt><dd className="mt-1 flex items-center gap-2 break-all text-sm font-semibold text-[#4e4a46]"><Mail size={15} className="text-[#B4232C]" />{customer.email || "Not provided"}</dd></div></dl></DetailSection><DetailSection title="Contact preferences" icon={Phone}><ContactPreferences customer={customer} /><p className="mt-4 text-xs leading-5 text-[#817c76]">These are the preferences saved from the customer’s most recent service request.</p></DetailSection></div><DetailSection title="Service requests" icon={Wrench}>{customer.requests.length === 0 ? <div className="rounded-2xl border border-dashed border-[#d7d3ce] bg-[#fbfaf8] p-8 text-center"><Wrench className="mx-auto mb-3 text-[#aaa59e]" size={24} /><p className="font-bold text-[#4e4a46]">No service requests yet</p><p className="mt-2 text-sm leading-6 text-[#817c76]">This customer record exists without a linked repair request.</p></div> : <div className="space-y-3">{customer.requests.map((request) => <CustomerRequestRow key={request.id} request={request} />)}</div>}</DetailSection></div></>;
}

export function AdminCustomerDetail() {
  const { customerId } = useParams();
  const [customer, setCustomer] = useState<CustomerDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadCustomer = useCallback(async () => {
    if (!customerId) return;
    setIsLoading(true);
    setError(null);
    try {
      setCustomer(await getInternalCustomer(customerId));
    } catch (loadError) {
      console.error("[AdminCustomerDetail] Failed to load customer", loadError);
      setError(loadError instanceof Error ? loadError.message : "Customer could not be loaded.");
    } finally {
      setIsLoading(false);
    }
  }, [customerId]);

  useEffect(() => {
    void loadCustomer();
  }, [loadCustomer]);

  return <AppShell><div className="mx-auto max-w-7xl"><Link to="/app/customers" className="mb-5 inline-flex items-center gap-2 text-sm font-bold text-[#B4232C] hover:text-[#8f1f27]"><ArrowLeft size={16} /> Back to Customers</Link>{isLoading ? <div className="rounded-[1.5rem] border border-[#e5e2dd] bg-white p-14 text-center text-sm font-semibold text-[#77736e]"><Loader2 className="mx-auto mb-3 animate-spin text-[#B4232C]" size={24} />Loading customer details...</div> : error || !customer ? <div className="rounded-[1.5rem] border border-[#efc4c3] bg-[#fff4f3] p-10 text-center" role="alert"><ShieldAlert className="mx-auto mb-3 text-[#B4232C]" size={25} /><p className="font-bold text-[#8f1f27]">Customer could not be loaded</p><p className="mt-2 text-sm text-[#a64a4e]">{error || "This customer may no longer exist."}</p><button type="button" onClick={() => void loadCustomer()} className="mt-5 rounded-xl bg-[#B4232C] px-4 py-2.5 text-sm font-bold text-white">Try again</button></div> : <CustomerDetailContent customer={customer} />}</div></AppShell>;
}
