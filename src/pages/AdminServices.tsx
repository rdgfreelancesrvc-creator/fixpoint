import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2, Package, Pencil, Plus, Search, ShieldAlert, Trash2, UserCheck, UserX } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import {
  createService,
  deleteService,
  listServices,
  serviceCategories,
  setServiceStatus,
  updateService,
  type ServiceCatalogItem,
} from "@/lib/serviceCatalog";

type ServiceForm = {
  name: string;
  category: string;
  description: string;
  starting_price: string;
  estimated_time: string;
  is_active: boolean;
};

type ConfirmAction =
  | { type: "deactivate"; service: ServiceCatalogItem }
  | { type: "delete"; service: ServiceCatalogItem }
  | null;

const emptyForm: ServiceForm = {
  name: "",
  category: serviceCategories[0],
  description: "",
  starting_price: "0.00",
  estimated_time: "",
  is_active: true,
};

function formatPrice(value: number) {
  return new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP", minimumFractionDigits: 2 }).format(value);
}

function serviceInput(form: ServiceForm) {
  const price = Number(form.starting_price);
  if (!form.name.trim() || !form.category || !Number.isFinite(price) || price < 0) {
    throw new Error("Please provide a service name, category, and valid non-negative starting price.");
  }

  return {
    name: form.name.trim(),
    category: form.category,
    description: form.description.trim() || null,
    starting_price: Math.round(price * 100) / 100,
    estimated_time: form.estimated_time.trim() || null,
  };
}

export default function AdminServices() {
  const { session } = useAuth();
  const [services, setServices] = useState<ServiceCatalogItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [formOpen, setFormOpen] = useState(false);
  const [editingService, setEditingService] = useState<ServiceCatalogItem | null>(null);
  const [form, setForm] = useState<ServiceForm>(emptyForm);
  const [isSaving, setIsSaving] = useState(false);
  const [confirmAction, setConfirmAction] = useState<ConfirmAction>(null);
  const [busyServiceId, setBusyServiceId] = useState<string | null>(null);

  const loadServices = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      setServices(await listServices());
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "Services could not be loaded.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadServices();
  }, [loadServices]);

  const filteredServices = useMemo(() => {
    const query = search.trim().toLowerCase();
    return services.filter((service) => {
      const matchesSearch = !query || [service.name, service.description].some((value) => value?.toLowerCase().includes(query));
      const matchesCategory = categoryFilter === "all" || service.category === categoryFilter;
      const matchesStatus = statusFilter === "all" || (statusFilter === "active" ? service.is_active : !service.is_active);
      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [categoryFilter, search, services, statusFilter]);

  const openAddForm = () => {
    setEditingService(null);
    setForm(emptyForm);
    setFormOpen(true);
  };

  const openEditForm = (service: ServiceCatalogItem) => {
    setEditingService(service);
    setForm({
      name: service.name,
      category: service.category,
      description: service.description ?? "",
      starting_price: service.starting_price.toFixed(2),
      estimated_time: service.estimated_time ?? "",
      is_active: service.is_active,
    });
    setFormOpen(true);
  };

  const updateForm = <K extends keyof ServiceForm>(key: K, value: ServiceForm[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const handleFormSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSaving(true);
    try {
      const input = serviceInput(form);
      if (editingService) {
        const updated = await updateService(editingService.id, { ...input, is_active: form.is_active });
        setServices((current) => current.map((service) => service.id === updated.id ? updated : service));
        toast.success("Service updated successfully");
      } else {
        const created = await createService(input, session?.user.id ?? null);
        setServices((current) => [created, ...current]);
        toast.success("Service created successfully");
      }
      setFormOpen(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "The service could not be saved.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleStatusChange = async (service: ServiceCatalogItem, isActive: boolean) => {
    setBusyServiceId(service.id);
    try {
      const updated = await setServiceStatus(service.id, isActive);
      setServices((current) => current.map((item) => item.id === updated.id ? updated : item));
      toast.success(isActive ? "Service activated" : "Service deactivated");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "The service status could not be changed.");
    } finally {
      setBusyServiceId(null);
    }
  };

  const handleConfirmAction = async () => {
    if (!confirmAction) return;
    const { service } = confirmAction;
    setBusyServiceId(service.id);
    try {
      if (confirmAction.type === "deactivate") {
        const updated = await setServiceStatus(service.id, false);
        setServices((current) => current.map((item) => item.id === updated.id ? updated : item));
        toast.success("Service deactivated");
      } else {
        await deleteService(service.id);
        setServices((current) => current.filter((item) => item.id !== service.id));
        toast.success("Service deleted");
      }
      setConfirmAction(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "The service action could not be completed.");
    } finally {
      setBusyServiceId(null);
    }
  };

  return (
    <AppShell>
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-[#B4232C]"><Package size={14} /> Admin workspace</p>
            <h2 className="font-display text-3xl font-bold tracking-[-0.05em] sm:text-4xl">Services &amp; Pricing</h2>
            <p className="mt-2 text-sm leading-6 text-[#77736e]">Manage the repair services available through FixPoint.</p>
          </div>
          <button type="button" onClick={openAddForm} className="flex items-center justify-center gap-2 rounded-xl bg-[#B4232C] px-4 py-3 text-sm font-bold text-white shadow-[0_10px_24px_rgba(180,35,44,0.18)] transition-all hover:-translate-y-0.5 hover:bg-[#8f1f27]">
            <Plus size={17} />
            Add Service
          </button>
        </div>

        <div className="mb-5 rounded-[1.5rem] border border-[#e5e2dd] bg-white p-4 shadow-[0_12px_35px_rgba(37,37,37,0.04)] sm:p-5">
          <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_220px_180px]">
            <label className="relative block">
              <span className="sr-only">Search services...</span>
              <Search size={17} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#9a9690]" />
              <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search services..." className="h-12 rounded-xl border-[#dedbd6] bg-[#fbfaf8] pl-11 focus-visible:ring-[#B4232C]/15" />
            </label>
            <label className="sr-only" htmlFor="service-category-filter">Category</label>
            <select id="service-category-filter" value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)} className="h-12 rounded-xl border border-[#dedbd6] bg-[#fbfaf8] px-3 text-sm font-semibold text-[#4e4a46] outline-none focus:border-[#B4232C] focus:ring-4 focus:ring-[#B4232C]/10">
              <option value="all">All Categories</option>
              {serviceCategories.map((category) => <option key={category} value={category}>{category}</option>)}
            </select>
            <label className="sr-only" htmlFor="service-status-filter">Status</label>
            <select id="service-status-filter" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="h-12 rounded-xl border border-[#dedbd6] bg-[#fbfaf8] px-3 text-sm font-semibold text-[#4e4a46] outline-none focus:border-[#B4232C] focus:ring-4 focus:ring-[#B4232C]/10">
              <option value="all">All</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>

        {isLoading ? (
          <div className="rounded-[1.5rem] border border-[#e5e2dd] bg-white p-12 text-center text-sm font-semibold text-[#77736e]"><Loader2 className="mx-auto mb-3 animate-spin text-[#B4232C]" size={24} />Loading services...</div>
        ) : loadError ? (
          <div role="alert" className="rounded-[1.5rem] border border-[#efc4c3] bg-[#fff4f3] p-8 text-center"><ShieldAlert className="mx-auto mb-3 text-[#B4232C]" size={25} /><p className="font-bold text-[#8f1f27]">Services could not be loaded</p><p className="mt-2 text-sm text-[#a64a4e]">{loadError}</p><button type="button" onClick={() => void loadServices()} className="mt-5 rounded-xl bg-[#B4232C] px-4 py-2.5 text-sm font-bold text-white">Try again</button></div>
        ) : services.length === 0 ? (
          <EmptyServices onAdd={openAddForm} />
        ) : filteredServices.length === 0 ? (
          <div className="rounded-[1.5rem] border border-dashed border-[#d7d3ce] bg-white/60 p-12 text-center"><Search className="mx-auto mb-3 text-[#aaa59e]" size={24} /><p className="font-bold">No services match these filters</p><p className="mt-2 text-sm text-[#85817b]">Try a different search or filter.</p></div>
        ) : (
          <div className="overflow-hidden rounded-[1.5rem] border border-[#e5e2dd] bg-white shadow-[0_12px_35px_rgba(37,37,37,0.04)]">
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[980px] text-left">
                <thead className="border-b border-[#eeeae5] bg-[#fbfaf8] text-[0.68rem] font-bold uppercase tracking-[0.14em] text-[#9a9690]"><tr><th className="px-6 py-4">Service Name</th><th className="px-4 py-4">Category</th><th className="px-4 py-4">Description</th><th className="px-4 py-4">Starting Price</th><th className="px-4 py-4">Estimated Time</th><th className="px-4 py-4">Status</th><th className="px-6 py-4 text-right">Actions</th></tr></thead>
                <tbody className="divide-y divide-[#eeeae5]">{filteredServices.map((service) => <ServiceRow key={service.id} service={service} busy={busyServiceId === service.id} onEdit={openEditForm} onActivate={(item) => void handleStatusChange(item, true)} onDeactivate={(item) => setConfirmAction({ type: "deactivate", service: item })} onDelete={(item) => setConfirmAction({ type: "delete", service: item })} />)}</tbody>
              </table>
            </div>
            <div className="divide-y divide-[#eeeae5] md:hidden">{filteredServices.map((service) => <ServiceCard key={service.id} service={service} busy={busyServiceId === service.id} onEdit={openEditForm} onActivate={(item) => void handleStatusChange(item, true)} onDeactivate={(item) => setConfirmAction({ type: "deactivate", service: item })} onDelete={(item) => setConfirmAction({ type: "delete", service: item })} />)}</div>
          </div>
        )}
      </div>

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto rounded-[1.5rem] border-[#e5e2dd] bg-[#fffefd] p-0 sm:max-w-[560px]">
          <form onSubmit={handleFormSubmit}>
            <DialogHeader className="border-b border-[#eeeae5] px-6 py-6 pr-12 text-left sm:px-7">
              <DialogTitle className="font-display text-2xl font-bold tracking-[-0.04em]">{editingService ? "Edit Service" : "Add Service"}</DialogTitle>
              <DialogDescription className="mt-2 leading-6 text-[#77736e]">Set a starting price for guidance. The technician will determine the final repair cost after diagnosis.</DialogDescription>
            </DialogHeader>
            <div className="space-y-5 px-6 py-6 sm:px-7">
              <div><label htmlFor="service-name" className="mb-2 block text-sm font-bold text-[#4e4a46]">Service Name</label><Input id="service-name" required value={form.name} onChange={(event) => updateForm("name", event.target.value)} placeholder="Laptop Diagnostic" className="h-12 rounded-xl border-[#dedbd6] bg-[#fbfaf8]" /></div>
              <div><label htmlFor="service-category" className="mb-2 block text-sm font-bold text-[#4e4a46]">Category</label><select id="service-category" required value={form.category} onChange={(event) => updateForm("category", event.target.value)} className="h-12 w-full rounded-xl border border-[#dedbd6] bg-[#fbfaf8] px-3 text-sm font-semibold text-[#4e4a46] outline-none focus:border-[#B4232C] focus:ring-4 focus:ring-[#B4232C]/10">{serviceCategories.map((category) => <option key={category} value={category}>{category}</option>)}</select></div>
              <div><label htmlFor="service-description" className="mb-2 block text-sm font-bold text-[#4e4a46]">Description <span className="font-normal text-[#9a9690]">(Optional)</span></label><Textarea id="service-description" value={form.description} onChange={(event) => updateForm("description", event.target.value)} placeholder="Inspection and diagnostic testing to identify hardware or software issues." className="min-h-24 rounded-xl border-[#dedbd6] bg-[#fbfaf8]" /></div>
              <div className="grid gap-5 sm:grid-cols-2"><div><label htmlFor="starting-price" className="mb-2 block text-sm font-bold text-[#4e4a46]">Starting Price</label><div className="relative"><span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 font-bold text-[#B4232C]">₱</span><Input id="starting-price" required type="number" min="0" step="0.01" value={form.starting_price} onChange={(event) => updateForm("starting_price", event.target.value)} placeholder="500.00" className="h-12 rounded-xl border-[#dedbd6] bg-[#fbfaf8] pl-9" /></div><p className="mt-2 text-xs text-[#9a9690]">Starting price only, not the final repair price.</p></div><div><label htmlFor="estimated-time" className="mb-2 block text-sm font-bold text-[#4e4a46]">Estimated Time <span className="font-normal text-[#9a9690]">(Optional)</span></label><Input id="estimated-time" value={form.estimated_time} onChange={(event) => updateForm("estimated_time", event.target.value)} placeholder="1–2 hours" className="h-12 rounded-xl border-[#dedbd6] bg-[#fbfaf8]" /></div></div>
              {editingService && <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-[#e5e2dd] bg-[#fbfaf8] px-4 py-3 text-sm font-bold text-[#4e4a46]"><input type="checkbox" checked={form.is_active} onChange={(event) => updateForm("is_active", event.target.checked)} className="h-4 w-4 accent-[#B4232C]" />Active service</label>}
            </div>
            <DialogFooter className="border-t border-[#eeeae5] px-6 py-5 sm:px-7"><button type="button" onClick={() => setFormOpen(false)} className="rounded-xl border border-[#dedbd6] bg-white px-4 py-3 text-sm font-bold text-[#5F5B57] hover:bg-[#f8f6f3]">Cancel</button><button type="submit" disabled={isSaving} className="rounded-xl bg-[#B4232C] px-5 py-3 text-sm font-bold text-white hover:bg-[#8f1f27] disabled:cursor-wait disabled:opacity-70">{isSaving ? "Saving..." : editingService ? "Save Changes" : "Add Service"}</button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={Boolean(confirmAction)} onOpenChange={(open) => !open && setConfirmAction(null)}>
        <AlertDialogContent className="rounded-[1.5rem] border-[#e5e2dd] bg-[#fffefd] p-6 sm:p-7">
          <AlertDialogHeader className="text-left"><AlertDialogTitle className="font-display text-2xl font-bold tracking-[-0.04em]">{confirmAction?.type === "delete" ? "Delete Service?" : "Deactivate this service?"}</AlertDialogTitle><AlertDialogDescription className="pt-2 leading-6 text-[#77736e]">{confirmAction?.type === "delete" ? "This will permanently remove this service from the catalog." : "This service will no longer be available for new customer requests."}</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter className="mt-3 gap-2"><AlertDialogCancel disabled={Boolean(busyServiceId)} className="rounded-xl border-[#dedbd6] px-4 py-3 font-bold">Cancel</AlertDialogCancel><AlertDialogAction disabled={Boolean(busyServiceId)} onClick={(event) => { event.preventDefault(); void handleConfirmAction(); }} className={`rounded-xl px-4 py-3 font-bold text-white ${confirmAction?.type === "delete" ? "bg-[#8f1f27] hover:bg-[#6f171e]" : "bg-[#B4232C] hover:bg-[#8f1f27]"}`}>{busyServiceId ? "Working..." : confirmAction?.type === "delete" ? "Delete Service" : "Deactivate Service"}</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppShell>
  );
}

function EmptyServices({ onAdd }: { onAdd: () => void }) {
  return <div className="rounded-[1.5rem] border border-dashed border-[#d7d3ce] bg-white/60 p-10 text-center sm:p-16"><div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#fff0ef] text-[#B4232C]"><Package size={25} /></div><h3 className="font-display text-2xl font-bold">No services found</h3><p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-[#85817b]">Add your first repair service to start building your catalog.</p><button type="button" onClick={onAdd} className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#B4232C] px-4 py-3 text-sm font-bold text-white hover:bg-[#8f1f27]"><Plus size={16} />Add Service</button></div>;
}

function ServiceRow({ service, busy, onEdit, onActivate, onDeactivate, onDelete }: { service: ServiceCatalogItem; busy: boolean; onEdit: (service: ServiceCatalogItem) => void; onActivate: (service: ServiceCatalogItem) => void; onDeactivate: (service: ServiceCatalogItem) => void; onDelete: (service: ServiceCatalogItem) => void }) {
  return <tr className="align-middle transition-colors hover:bg-[#fffcfa]"><td className="px-6 py-4"><span className="font-bold text-[#34312e]">{service.name}</span></td><td className="px-4 py-4"><span className="inline-flex rounded-full bg-[#f2f0ec] px-2.5 py-1 text-xs font-bold text-[#5f5b57]">{service.category}</span></td><td className="max-w-[260px] px-4 py-4 text-sm text-[#6f6a64]"><span className="line-clamp-2">{service.description || "—"}</span></td><td className="whitespace-nowrap px-4 py-4 font-bold text-[#34312e]">{formatPrice(service.starting_price)}</td><td className="whitespace-nowrap px-4 py-4 text-sm text-[#6f6a64]">{service.estimated_time || "—"}</td><td className="px-4 py-4"><StatusBadge active={service.is_active} /></td><td className="px-6 py-4"><Actions service={service} busy={busy} onEdit={onEdit} onActivate={onActivate} onDeactivate={onDeactivate} onDelete={onDelete} /></td></tr>;
}

function ServiceCard({ service, busy, onEdit, onActivate, onDeactivate, onDelete }: { service: ServiceCatalogItem; busy: boolean; onEdit: (service: ServiceCatalogItem) => void; onActivate: (service: ServiceCatalogItem) => void; onDeactivate: (service: ServiceCatalogItem) => void; onDelete: (service: ServiceCatalogItem) => void }) {
  return <article className="p-5"><div className="flex items-start justify-between gap-3"><div><p className="font-display text-lg font-bold">{service.name}</p><span className="mt-2 inline-flex rounded-full bg-[#f2f0ec] px-2.5 py-1 text-xs font-bold text-[#5f5b57]">{service.category}</span></div><StatusBadge active={service.is_active} /></div><p className="mt-4 text-sm leading-6 text-[#6f6a64]">{service.description || "No description provided."}</p><div className="mt-5 grid grid-cols-2 gap-4 border-t border-[#eeeae5] pt-4"><div><p className="text-xs font-bold uppercase tracking-[0.1em] text-[#aaa59e]">Starting Price</p><p className="mt-1 font-bold">{formatPrice(service.starting_price)}</p></div><div><p className="text-xs font-bold uppercase tracking-[0.1em] text-[#aaa59e]">Estimated Time</p><p className="mt-1 text-sm text-[#6f6a64]">{service.estimated_time || "—"}</p></div></div><div className="mt-5 flex justify-end border-t border-[#eeeae5] pt-4"><Actions service={service} busy={busy} onEdit={onEdit} onActivate={onActivate} onDeactivate={onDeactivate} onDelete={onDelete} /></div></article>;
}

function StatusBadge({ active }: { active: boolean }) {
  return <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ${active ? "bg-[#edf8f0] text-[#267342]" : "bg-[#f2f0ec] text-[#77736e]"}`}><span className={`h-1.5 w-1.5 rounded-full ${active ? "bg-[#38a863]" : "bg-[#aaa59e]"}`} />{active ? "Active" : "Inactive"}</span>;
}

function Actions({ service, busy, onEdit, onActivate, onDeactivate, onDelete }: { service: ServiceCatalogItem; busy: boolean; onEdit: (service: ServiceCatalogItem) => void; onActivate: (service: ServiceCatalogItem) => void; onDeactivate: (service: ServiceCatalogItem) => void; onDelete: (service: ServiceCatalogItem) => void }) {
  return <div className="flex items-center justify-end gap-1"><button type="button" disabled={busy} onClick={() => onEdit(service)} aria-label={`Edit ${service.name}`} className="rounded-lg p-2 text-[#77736e] hover:bg-[#f2f0ec] hover:text-[#252525] disabled:opacity-40"><Pencil size={16} /></button>{service.is_active ? <button type="button" disabled={busy} onClick={() => onDeactivate(service)} aria-label={`Deactivate ${service.name}`} className="rounded-lg p-2 text-[#77736e] hover:bg-[#fff0ef] hover:text-[#B4232C] disabled:opacity-40"><UserX size={16} /></button> : <button type="button" disabled={busy} onClick={() => onActivate(service)} aria-label={`Activate ${service.name}`} className="rounded-lg p-2 text-[#267342] hover:bg-[#edf8f0] disabled:opacity-40"><UserCheck size={16} /></button>}<button type="button" disabled={busy} onClick={() => onDelete(service)} aria-label={`Delete ${service.name}`} className="rounded-lg p-2 text-[#9b4b50] hover:bg-[#fff0ef] hover:text-[#8f1f27] disabled:opacity-40"><Trash2 size={16} /></button></div>;
}
