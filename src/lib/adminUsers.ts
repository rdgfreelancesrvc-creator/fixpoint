import { supabase } from "@/integrations/supabase/client";
import type { Profile } from "@/lib/auth";

export type EmployeeRole = "staff" | "technician";
export type Employee = Profile & { role: EmployeeRole };

type EmployeePayload = {
  action: "create" | "update" | "set_status" | "delete" | "list";
  id?: string;
  full_name?: string;
  email?: string;
  phone?: string;
  role?: EmployeeRole;
  is_active?: boolean;
};

async function invokeEmployeeManagement(payload: EmployeePayload) {
  const { data, error } = await supabase.functions.invoke("admin-user-management", { body: payload });
  if (error) {
    const context = "context" in error ? error.context : undefined;
    if (context instanceof Response) {
      const responseBody = await context.json().catch(() => null) as { error?: string } | null;
      throw new Error(responseBody?.error || error.message || "The employee request could not be completed.");
    }
    throw new Error(error.message || "The employee request could not be completed.");
  }
  if (!data || typeof data !== "object") throw new Error("The employee request returned an invalid response.");
  return data as Record<string, unknown>;
}

export async function listEmployees() {
  const data = await invokeEmployeeManagement({ action: "list" });
  return (data.employees as Employee[] | undefined) ?? [];
}

export async function createEmployee(input: Pick<EmployeePayload, "full_name" | "email" | "phone" | "role">) {
  const data = await invokeEmployeeManagement({ action: "create", ...input });
  return data.employee as Employee;
}

export async function updateEmployee(input: Pick<EmployeePayload, "id" | "full_name" | "phone" | "role">) {
  const data = await invokeEmployeeManagement({ action: "update", ...input });
  return data.employee as Employee;
}

export async function setEmployeeStatus(id: string, isActive: boolean) {
  const data = await invokeEmployeeManagement({ action: "set_status", id, is_active: isActive });
  return data.employee as Employee;
}

export async function deleteEmployee(id: string) {
  await invokeEmployeeManagement({ action: "delete", id });
}
