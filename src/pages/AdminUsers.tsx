import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2, Pencil, Plus, Search, ShieldAlert, Trash2, UserCheck, UserRoundCog, UserX } from "lucide-react";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createEmployee, deleteEmployee, listEmployees, setEmployeeStatus, updateEmployee, type Employee, type EmployeeRole } from "@/lib/adminUsers";

const roleLabels: Record<EmployeeRole, string> = { staff: "Staff", technician: "Technician" };

type EmployeeForm = {
  full_name: string;
  email: string;
  phone: string;
  role: EmployeeRole;
};

type ConfirmAction =
  | { type: "deactivate"; employee: Employee }
  | { type: "delete"; employee: Employee }
  | null;

const emptyForm: EmployeeForm = { full_name: "", email: "", phone: "", role: "staff" };

function formatCreatedDate(value: string) {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(new Date(value));
}

function initials(name: string | null) {
  return (name || "Employee")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

export default function AdminUsers() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [formOpen, setFormOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [form, setForm] = useState<EmployeeForm>(emptyForm);
  const [isSaving, setIsSaving] = useState(false);
  const [confirmAction, setConfirmAction] = useState<ConfirmAction>(null);
  const [busyEmployeeId, setBusyEmployeeId] = useState<string | null>(null);

  const loadEmployees = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      setEmployees(await listEmployees());
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "Employees could not be loaded.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadEmployees();
  }, [loadEmployees]);

  const filteredEmployees = useMemo(() => {
    const query = search.trim().toLowerCase();
    return employees.filter((employee) => {
      const matchesSearch = !query || [employee.full_name, employee.email].some((value) => value?.toLowerCase().includes(query));
      const matchesRole = roleFilter === "all" || employee.role === roleFilter;
      const matchesStatus = statusFilter === "all" || (statusFilter === "active" ? employee.is_active : !employee.is_active);
      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [employees, roleFilter, search, statusFilter]);

  const openAddForm = () => {
    setEditingEmployee(null);
    setForm(emptyForm);
    setFormOpen(true);
  };

  const openEditForm = (employee: Employee) => {
    setEditingEmployee(employee);
    setForm({ full_name: employee.full_name ?? "", email: employee.email ?? "", phone: employee.phone ?? "", role: employee.role });
    setFormOpen(true);
  };

  const handleFormSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSaving(true);
    try {
      if (editingEmployee) {
        const updated = await updateEmployee({ id: editingEmployee.id, full_name: form.full_name, phone: form.phone, role: form.role });
        setEmployees((current) => current.map((employee) => employee.id === updated.id ? updated : employee));
        toast.success("Employee updated successfully");
      } else {
        const created = await createEmployee(form);
        setEmployees((current) => [created, ...current]);
        toast.success("Employee created successfully. An account setup invitation has been sent.");
      }
      setFormOpen(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "The employee could not be saved.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleActivate = async (employee: Employee) => {
    setBusyEmployeeId(employee.id);
    try {
      const updated = await setEmployeeStatus(employee.id, true);
      setEmployees((current) => current.map((item) => item.id === updated.id ? updated : item));
      toast.success("Employee account activated");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "The employee account could not be activated.");
    } finally {
      setBusyEmployeeId(null);
    }
  };

  const handleConfirmAction = async () => {
    if (!confirmAction) return;
    const { employee } = confirmAction;
    setBusyEmployeeId(employee.id);
    try {
      if (confirmAction.type === "deactivate") {
        const updated = await setEmployeeStatus(employee.id, false);
        setEmployees((current) => current.map((item) => item.id === updated.id ? updated : item));
        toast.success("Employee account deactivated");
      } else {
        await deleteEmployee(employee.id);
        setEmployees((current) => current.filter((item) => item.id !== employee.id));
        toast.success("Employee deleted");
      }
      setConfirmAction(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "The employee action could not be completed.");
    } finally {
      setBusyEmployeeId(null);
    }
  };

  return (
    <AppShell>
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-[#B4232C]"><UserRoundCog size={14} /> Admin workspace</p>
            <h2 className="font-display text-3xl font-bold tracking-[-0.05em] sm:text-4xl">User Management</h2>
            <p className="mt-2 text-sm leading-6 text-[#77736e]">Manage FixPoint staff and technician accounts.</p>
          </div>
          <button type="button" onClick={openAddForm} className="flex items-center justify-center gap-2 rounded-xl bg-[#B4232C] px-4 py-3 text-sm font-bold text-white shadow-[0_10px_24px_rgba(180,35,44,0.18)] transition-all hover:-translate-y-0.5 hover:bg-[#8f1f27]">
            <Plus size={17} />
            Add Employee
          </button>
        </div>

        <div className="mb-5 rounded-[1.5rem] border border-[#e5e2dd] bg-white p-4 shadow-[0_12px_35px_rgba(37,37,37,0.04)] sm:p-5">
          <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_180px_180px]">
            <label className="relative block">
              <span className="sr-only">Search employees...</span>
              <Search size={17} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#9a9690]" />
              <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search employees..." className="h-12 rounded-xl border-[#dedbd6] bg-[#fbfaf8] pl-11 focus-visible:ring-[#B4232C]/15" />
            </label>
            <label className="sr-only" htmlFor="role-filter">Role</label>
            <select id="role-filter" value={roleFilter} onChange={(event) => setRoleFilter(event.target.value)} className="h-12 rounded-xl border border-[#dedbd6] bg-[#fbfaf8] px-3 text-sm font-semibold text-[#4e4a46] outline-none focus:border-[#B4232C] focus:ring-4 focus:ring-[#B4232C]/10">
              <option value="all">All Roles</option>
              <option value="staff">Staff</option>
              <option value="technician">Technician</option>
            </select>
            <label className="sr-only" htmlFor="status-filter">Status</label>
            <select id="status-filter" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="h-12 rounded-xl border border-[#dedbd6] bg-[#fbfaf8] px-3 text-sm font-semibold text-[#4e4a46] outline-none focus:border-[#B4232C] focus:ring-4 focus:ring-[#B4232C]/10">
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>

        {isLoading ? (
          <div className="rounded-[1.5rem] border border-[#e5e2dd] bg-white p-12 text-center text-sm font-semibold text-[#77736e]"><Loader2 className="mx-auto mb-3 animate-spin text-[#B4232C]" size={24} />Loading employees...</div>
        ) : loadError ? (
          <div role="alert" className="rounded-[1.5rem] border border-[#efc4c3] bg-[#fff4f3] p-8 text-center"><ShieldAlert className="mx-auto mb-3 text-[#B4232C]" size={25} /><p className="font-bold text-[#8f1f27]">Employees could not be loaded</p><p className="mt-2 text-sm text-[#a64a4e]">{loadError}</p><button type="button" onClick={() => void loadEmployees()} className="mt-5 rounded-xl bg-[#B4232C] px-4 py-2.5 text-sm font-bold text-white">Try again</button></div>
        ) : employees.length === 0 ? (
          <EmptyEmployees onAdd={openAddForm} />
        ) : filteredEmployees.length === 0 ? (
          <div className="rounded-[1.5rem] border border-dashed border-[#d7d3ce] bg-white/60 p-12 text-center"><Search className="mx-auto mb-3 text-[#aaa59e]" size={24} /><p className="font-bold">No employees match these filters</p><p className="mt-2 text-sm text-[#85817b]">Try a different search or filter.</p></div>
        ) : (
          <div className="overflow-hidden rounded-[1.5rem] border border-[#e5e2dd] bg-white shadow-[0_12px_35px_rgba(37,37,37,0.04)]">
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[850px] text-left">
                <thead className="border-b border-[#eeeae5] bg-[#fbfaf8] text-[0.68rem] font-bold uppercase tracking-[0.14em] text-[#9a9690]"><tr><th className="px-6 py-4">Name</th><th className="px-4 py-4">Email</th><th className="px-4 py-4">Role</th><th className="px-4 py-4">Phone</th><th className="px-4 py-4">Status</th><th className="px-4 py-4">Created</th><th className="px-6 py-4 text-right">Actions</th></tr></thead>
                <tbody className="divide-y divide-[#eeeae5]">{filteredEmployees.map((employee) => <EmployeeRow key={employee.id} employee={employee} busy={busyEmployeeId === employee.id} onEdit={openEditForm} onActivate={handleActivate} onDeactivate={(item) => setConfirmAction({ type: "deactivate", employee: item })} onDelete={(item) => setConfirmAction({ type: "delete", employee: item })} />)}</tbody>
              </table>
            </div>
            <div className="divide-y divide-[#eeeae5] md:hidden">{filteredEmployees.map((employee) => <EmployeeCard key={employee.id} employee={employee} busy={busyEmployeeId === employee.id} onEdit={openEditForm} onActivate={handleActivate} onDeactivate={(item) => setConfirmAction({ type: "deactivate", employee: item })} onDelete={(item) => setConfirmAction({ type: "delete", employee: item })} />)}</div>
          </div>
        )}
      </div>

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="rounded-[1.5rem] border-[#e5e2dd] bg-[#fffefd] p-0 sm:max-w-[520px]">
          <form onSubmit={handleFormSubmit}>
            <DialogHeader className="border-b border-[#eeeae5] px-6 py-6 pr-12 text-left sm:px-7">
              <DialogTitle className="font-display text-2xl font-bold tracking-[-0.04em]">{editingEmployee ? "Edit Employee" : "Add Employee"}</DialogTitle>
              <DialogDescription className="mt-2 leading-6 text-[#77736e]">{editingEmployee ? "Update this employee's profile information and role." : "Create a secure account invitation for a FixPoint team member."}</DialogDescription>
            </DialogHeader>
            <div className="space-y-5 px-6 py-6 sm:px-7">
              <div><label htmlFor="employee-name" className="mb-2 block text-sm font-bold text-[#4e4a46]">Full Name</label><Input id="employee-name" required value={form.full_name} onChange={(event) => setForm((current) => ({ ...current, full_name: event.target.value }))} placeholder="Jordan Lee" className="h-12 rounded-xl border-[#dedbd6] bg-[#fbfaf8]" /></div>
              <div><label htmlFor="employee-email" className="mb-2 block text-sm font-bold text-[#4e4a46]">Email</label><Input id="employee-email" required type="email" disabled={Boolean(editingEmployee)} value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} placeholder="jordan@fixpoint.com" className="h-12 rounded-xl border-[#dedbd6] bg-[#fbfaf8] disabled:cursor-not-allowed disabled:opacity-60" />{editingEmployee && <p className="mt-2 text-xs text-[#9a9690]">Email changes are not available in this version.</p>}</div>
              <div><label htmlFor="employee-phone" className="mb-2 block text-sm font-bold text-[#4e4a46]">Phone <span className="font-normal text-[#9a9690]">(Optional)</span></label><Input id="employee-phone" value={form.phone} onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))} placeholder="(555) 014-2040" className="h-12 rounded-xl border-[#dedbd6] bg-[#fbfaf8]" /></div>
              <div><label className="mb-2 block text-sm font-bold text-[#4e4a46]" htmlFor="employee-role">Role</label><Select value={form.role} onValueChange={(value: EmployeeRole) => setForm((current) => ({ ...current, role: value }))}><SelectTrigger id="employee-role" className="h-12 rounded-xl border-[#dedbd6] bg-[#fbfaf8]"><SelectValue /></SelectTrigger><SelectContent className="rounded-xl border-[#dedbd6] bg-white"><SelectItem value="staff">Staff</SelectItem><SelectItem value="technician">Technician</SelectItem></SelectContent></Select></div>
              {!editingEmployee && <div className="rounded-xl border border-[#ead8d6] bg-[#fff7f6] px-4 py-3"><p className="text-sm font-bold text-[#8f1f27]">Account Status: Active</p><p className="mt-1 text-xs leading-5 text-[#a64a4e]">The employee will receive an invitation to set their own password.</p></div>}
            </div>
            <DialogFooter className="border-t border-[#eeeae5] px-6 py-5 sm:px-7"><button type="button" onClick={() => setFormOpen(false)} className="rounded-xl border border-[#dedbd6] bg-white px-4 py-3 text-sm font-bold text-[#5F5B57] hover:bg-[#f8f6f3]">Cancel</button><button type="submit" disabled={isSaving} className="rounded-xl bg-[#B4232C] px-5 py-3 text-sm font-bold text-white hover:bg-[#8f1f27] disabled:cursor-wait disabled:opacity-70">{isSaving ? "Saving..." : editingEmployee ? "Save Changes" : "Create Employee"}</button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={Boolean(confirmAction)} onOpenChange={(open) => !open && setConfirmAction(null)}>
        <AlertDialogContent className="rounded-[1.5rem] border-[#e5e2dd] bg-[#fffefd] p-6 sm:p-7">
          <AlertDialogHeader className="text-left"><AlertDialogTitle className="font-display text-2xl font-bold tracking-[-0.04em]">{confirmAction?.type === "delete" ? "Delete Employee?" : "Deactivate this account?"}</AlertDialogTitle><AlertDialogDescription className="pt-2 leading-6 text-[#77736e]">{confirmAction?.type === "delete" ? "Deleting this account will permanently remove the employee's FixPoint access. This action cannot be undone." : "This employee will no longer be able to access the FixPoint portal."}</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter className="mt-3 gap-2"><AlertDialogCancel disabled={Boolean(busyEmployeeId)} className="rounded-xl border-[#dedbd6] px-4 py-3 font-bold">Cancel</AlertDialogCancel><AlertDialogAction disabled={Boolean(busyEmployeeId)} onClick={(event) => { event.preventDefault(); void handleConfirmAction(); }} className="rounded-xl bg-[#B4232C] px-4 py-3 font-bold text-white hover:bg-[#8f1f27]">{busyEmployeeId ? "Working..." : confirmAction?.type === "delete" ? "Delete Employee" : "Deactivate Account"}</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppShell>
  );
}

function EmptyEmployees({ onAdd }: { onAdd: () => void }) {
  return <div className="rounded-[1.5rem] border border-dashed border-[#d7d3ce] bg-white/60 p-10 text-center sm:p-16"><div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#fff0ef] text-[#B4232C]"><UserRoundCog size={25} /></div><h3 className="font-display text-2xl font-bold">No employees found</h3><p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-[#85817b]">Create your first staff or technician account to get started.</p><button type="button" onClick={onAdd} className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#B4232C] px-4 py-3 text-sm font-bold text-white hover:bg-[#8f1f27]"><Plus size={16} />Add Employee</button></div>;
}

function EmployeeRow({ employee, busy, onEdit, onActivate, onDeactivate, onDelete }: { employee: Employee; busy: boolean; onEdit: (employee: Employee) => void; onActivate: (employee: Employee) => void; onDeactivate: (employee: Employee) => void; onDelete: (employee: Employee) => void }) {
  return <tr className="align-middle transition-colors hover:bg-[#fffcfa]"><td className="px-6 py-4"><div className="flex items-center gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#f3c7c6] text-xs font-bold text-[#8b2028]">{initials(employee.full_name)}</span><span className="font-bold text-[#34312e]">{employee.full_name || "Unnamed employee"}</span></div></td><td className="px-4 py-4 text-sm text-[#6f6a64]">{employee.email || "—"}</td><td className="px-4 py-4"><RoleBadge role={employee.role} /></td><td className="px-4 py-4 text-sm text-[#6f6a64]">{employee.phone || "—"}</td><td className="px-4 py-4"><StatusBadge active={employee.is_active} /></td><td className="px-4 py-4 text-sm text-[#6f6a64]">{formatCreatedDate(employee.created_at)}</td><td className="px-6 py-4"><Actions employee={employee} busy={busy} onEdit={onEdit} onActivate={onActivate} onDeactivate={onDeactivate} onDelete={onDelete} /></td></tr>;
}

function EmployeeCard({ employee, busy, onEdit, onActivate, onDeactivate, onDelete }: { employee: Employee; busy: boolean; onEdit: (employee: Employee) => void; onActivate: (employee: Employee) => void; onDeactivate: (employee: Employee) => void; onDelete: (employee: Employee) => void }) {
  return <article className="p-5"><div className="flex items-start justify-between gap-3"><div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#f3c7c6] text-xs font-bold text-[#8b2028]">{initials(employee.full_name)}</span><div><p className="font-bold">{employee.full_name || "Unnamed employee"}</p><p className="mt-1 break-all text-sm text-[#6f6a64]">{employee.email || "—"}</p></div></div><StatusBadge active={employee.is_active} /></div><div className="mt-5 grid grid-cols-2 gap-4 text-sm"><div><p className="text-xs font-bold uppercase tracking-[0.1em] text-[#aaa59e]">Role</p><div className="mt-1"><RoleBadge role={employee.role} /></div></div><div><p className="text-xs font-bold uppercase tracking-[0.1em] text-[#aaa59e]">Phone</p><p className="mt-1 text-[#6f6a64]">{employee.phone || "—"}</p></div></div><div className="mt-5 flex items-center justify-between border-t border-[#eeeae5] pt-4"><p className="text-xs text-[#9a9690]">Created {formatCreatedDate(employee.created_at)}</p><Actions employee={employee} busy={busy} onEdit={onEdit} onActivate={onActivate} onDeactivate={onDeactivate} onDelete={onDelete} /></div></article>;
}

function RoleBadge({ role }: { role: EmployeeRole }) {
  return <span className="inline-flex rounded-full bg-[#f2f0ec] px-2.5 py-1 text-xs font-bold text-[#5f5b57]">{roleLabels[role]}</span>;
}

function StatusBadge({ active }: { active: boolean }) {
  return <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ${active ? "bg-[#edf8f0] text-[#267342]" : "bg-[#f2f0ec] text-[#77736e]"}`}><span className={`h-1.5 w-1.5 rounded-full ${active ? "bg-[#38a863]" : "bg-[#aaa59e]"}`} />{active ? "Active" : "Inactive"}</span>;
}

function Actions({ employee, busy, onEdit, onActivate, onDeactivate, onDelete }: { employee: Employee; busy: boolean; onEdit: (employee: Employee) => void; onActivate: (employee: Employee) => void; onDeactivate: (employee: Employee) => void; onDelete: (employee: Employee) => void }) {
  return <div className="flex items-center justify-end gap-1"><button type="button" disabled={busy} onClick={() => onEdit(employee)} aria-label={`Edit ${employee.full_name || "employee"}`} className="rounded-lg p-2 text-[#77736e] hover:bg-[#f2f0ec] hover:text-[#252525] disabled:opacity-40"><Pencil size={16} /></button>{employee.is_active ? <button type="button" disabled={busy} onClick={() => onDeactivate(employee)} aria-label={`Deactivate ${employee.full_name || "employee"}`} className="rounded-lg p-2 text-[#77736e] hover:bg-[#fff0ef] hover:text-[#B4232C] disabled:opacity-40"><UserX size={16} /></button> : <button type="button" disabled={busy} onClick={() => onActivate(employee)} aria-label={`Activate ${employee.full_name || "employee"}`} className="rounded-lg p-2 text-[#267342] hover:bg-[#edf8f0] disabled:opacity-40"><UserCheck size={16} /></button>}<button type="button" disabled={busy} onClick={() => onDelete(employee)} aria-label={`Delete ${employee.full_name || "employee"}`} className="rounded-lg p-2 text-[#9b4b50] hover:bg-[#fff0ef] hover:text-[#8f1f27] disabled:opacity-40"><Trash2 size={16} /></button></div>;
}
