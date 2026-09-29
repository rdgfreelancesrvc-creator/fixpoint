import { supabase } from "@/integrations/supabase/client";

export const requestStatuses = [
  "received",
  "diagnosing",
  "waiting_customer_approval",
  "approved",
  "in_repair",
  "waiting_parts",
  "ready_for_pickup",
  "completed",
  "cancelled",
] as const;

export type RequestStatus = (typeof requestStatuses)[number];

export const requestStatusLabels: Record<RequestStatus, string> = {
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

const requestTransitions: Record<RequestStatus, RequestStatus[]> = {
  received: ["diagnosing", "cancelled"],
  diagnosing: ["waiting_customer_approval", "in_repair", "waiting_parts", "cancelled"],
  waiting_customer_approval: ["approved", "cancelled"],
  approved: ["in_repair", "waiting_parts", "cancelled"],
  in_repair: ["waiting_parts", "ready_for_pickup", "cancelled"],
  waiting_parts: ["in_repair", "cancelled"],
  ready_for_pickup: ["completed"],
  completed: [],
  cancelled: [],
};

export type RequestDateFilter = "all_time" | "today" | "last_7_days" | "last_30_days";
export type TechnicianFilter = "all" | "unassigned" | string;

export type TechnicianSummary = {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  is_active: boolean;
  active_repairs: number;
};

export type AssignedTechnician = {
  id: string;
  full_name: string | null;
  email: string | null;
  is_active: boolean;
};

export type ServiceRequestListItem = {
  id: string;
  request_number: string;
  customer_name: string;
  customer_phone: string;
  device_type: string;
  brand: string | null;
  model: string | null;
  service_name: string | null;
  status: RequestStatus;
  created_at: string;
  updated_at: string;
  assigned_technician: AssignedTechnician | null;
};

export type ServiceRequestAttachment = {
  id: string;
  file_name: string;
  storage_path: string;
  content_type: string;
  file_size: number;
  created_at: string;
  signed_url?: string;
};

export type RequestStatusHistoryItem = {
  id: string;
  old_status: RequestStatus | null;
  new_status: RequestStatus;
  created_at: string;
  changed_by_name: string | null;
  changed_by_role: string | null;
};

export type AssignmentHistoryItem = {
  id: string;
  action: "assigned" | "reassigned" | "unassigned";
  technician_id: string | null;
  technician_name: string;
  assigned_by: string | null;
  assigned_by_name: string;
  created_at: string;
};

export type RepairPart = {
  id: string;
  part_name: string;
  quantity: number;
  unit_cost: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type RepairLabor = {
  id: string;
  description: string;
  hours: number;
  hourly_rate: number;
  created_at: string;
  updated_at: string;
};

export type ServiceRequestDetail = {
  id: string;
  request_number: string;
  status: RequestStatus;
  created_at: string;
  updated_at: string;
  device_type: string;
  brand: string | null;
  model: string | null;
  serial_number: string | null;
  problem_description: string;
  diagnosis: string | null;
  diagnostic_findings: string | null;
  internal_notes: string | null;
  parts: RepairPart[];
  labor: RepairLabor[];
  parts_subtotal: number;
  labor_subtotal: number;
  contact_email: boolean;
  contact_sms: boolean;
  contact_phone: boolean;
  customer: {
    id: string;
    full_name: string;
    phone: string;
    email: string | null;
  };
  service: {
    id: string;
    name: string;
    category: string;
  } | null;
  assigned_technician: AssignedTechnician | null;
  attachments: ServiceRequestAttachment[];
  history: RequestStatusHistoryItem[];
  assignment_history: AssignmentHistoryItem[];
};

type ListResponse = {
  total_count: number;
  requests: ServiceRequestListItem[];
};

export type TechnicianRepair = {
  id: string;
  request_number: string;
  customer_name: string;
  device_type: string;
  brand: string | null;
  model: string | null;
  service_name: string | null;
  status: RequestStatus;
  created_at: string;
  updated_at: string;
};

export type TechnicianRepairDetail = TechnicianRepair & {
  serial_number: string | null;
  problem_description: string;
  diagnosis: string | null;
  diagnostic_findings: string | null;
  internal_notes: string | null;
  customer: { full_name: string };
  service: { name: string; category: string } | null;
  parts: RepairPart[];
  labor: RepairLabor[];
  parts_subtotal: number;
  labor_subtotal: number;
  assignment_history: Array<Pick<AssignmentHistoryItem, "id" | "action" | "technician_name" | "assigned_by_name" | "created_at">>;
};

export function getAllowedRequestTransitions(status: RequestStatus) {
  return requestTransitions[status];
}

export async function listAssignmentTechnicians() {
  const { data, error } = await supabase.rpc("get_assignment_technicians");
  if (error) throw new Error(error.message);
  return (data ?? []) as TechnicianSummary[];
}

export async function listInternalServiceRequests(filters: {
  search: string;
  status: RequestStatus | "all";
  serviceId: string;
  dateFilter: RequestDateFilter;
  technicianId: TechnicianFilter;
}) {
  const { data, error } = await supabase.rpc("get_internal_service_requests", {
    p_search: filters.search.trim() || null,
    p_status: filters.status === "all" ? null : filters.status,
    p_service_id: filters.serviceId === "all" ? null : filters.serviceId,
    p_date_filter: filters.dateFilter,
    p_limit: 100,
    p_offset: 0,
    p_technician_id: filters.technicianId !== "all" && filters.technicianId !== "unassigned" ? filters.technicianId : null,
    p_unassigned: filters.technicianId === "unassigned",
  });

  if (error) throw new Error(error.message);
  const result = data as ListResponse;
  return {
    totalCount: Number(result?.total_count ?? 0),
    requests: (result?.requests ?? []) as ServiceRequestListItem[],
  };
}

export async function getInternalServiceRequest(requestId: string) {
  const { data, error } = await supabase.rpc("get_internal_service_request_with_assignment", {
    p_request_id: requestId,
  });

  if (error) throw new Error(error.message);
  if (!data) throw new Error("Service request not found.");
  return data as ServiceRequestDetail;
}

export async function assignServiceRequest(requestId: string, technicianId: string | null) {
  const { data, error } = await supabase.rpc("assign_service_request_technician", {
    p_request_id: requestId,
    p_technician_id: technicianId,
  });

  if (error) throw new Error(error.message);
  return data as { id: string; assigned_technician_id: string | null; action: "assigned" | "reassigned" | "unassigned" };
}

export async function changeServiceRequestStatus(requestId: string, newStatus: RequestStatus) {
  const { data, error } = await supabase.rpc("change_service_request_status", {
    p_request_id: requestId,
    p_new_status: newStatus,
  });

  if (error) throw new Error(error.message);
  return data as { id: string; old_status: RequestStatus; new_status: RequestStatus };
}

export async function createRequestAttachmentUrl(storagePath: string) {
  const { data, error } = await supabase.storage
    .from("service-request-attachments")
    .createSignedUrl(storagePath, 300);

  if (error || !data?.signedUrl) throw new Error(error?.message ?? "Attachment could not be opened.");
  return data.signedUrl;
}

export async function getNewRequestsToday() {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const { count, error } = await supabase
    .from("service_requests")
    .select("id", { count: "exact", head: true })
    .gte("created_at", startOfToday.toISOString());

  if (error) throw new Error(error.message);
  return count ?? 0;
}

export async function listTechnicianRepairs() {
  const { data, error } = await supabase.rpc("get_technician_service_requests");
  if (error) throw new Error(error.message);
  return (data ?? []) as TechnicianRepair[];
}

export async function getTechnicianActiveRepairCount() {
  const { data, error } = await supabase.rpc("get_technician_active_repair_count");
  if (error) throw new Error(error.message);
  return Number(data ?? 0);
}

export async function getTechnicianRepair(requestId: string) {
  const { data, error } = await supabase.rpc("get_technician_service_request", { p_request_id: requestId });
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Repair not available.");
  return data as TechnicianRepairDetail;
}

export async function saveTechnicianRepairFields(input: { requestId: string; diagnosis: string; diagnosticFindings: string; internalNotes: string }) {
  const { data, error } = await supabase.rpc("update_service_request_repair_fields", {
    p_request_id: input.requestId,
    p_diagnosis: input.diagnosis,
    p_diagnostic_findings: input.diagnosticFindings,
    p_internal_notes: input.internalNotes,
  });
  if (error) throw new Error(error.message);
  return data as { id: string; updated_at: string };
}

export async function addRepairPart(input: { requestId: string; partName: string; quantity: number; unitCost: number; notes: string }) {
  const { data, error } = await supabase.rpc("add_service_request_part", {
    p_request_id: input.requestId,
    p_part_name: input.partName,
    p_quantity: input.quantity,
    p_unit_cost: input.unitCost,
    p_notes: input.notes || null,
  });
  if (error) throw new Error(error.message);
  return data as { id: string };
}

export async function updateRepairPart(input: { id: string; partName: string; quantity: number; unitCost: number; notes: string }) {
  const { data, error } = await supabase.rpc("update_service_request_part", {
    p_part_id: input.id,
    p_part_name: input.partName,
    p_quantity: input.quantity,
    p_unit_cost: input.unitCost,
    p_notes: input.notes || null,
  });
  if (error) throw new Error(error.message);
  return data as { id: string };
}

export async function deleteRepairPart(id: string) {
  const { data, error } = await supabase.rpc("delete_service_request_part", { p_part_id: id });
  if (error) throw new Error(error.message);
  return data as { id: string };
}

export async function addRepairLabor(input: { requestId: string; description: string; hours: number; hourlyRate: number }) {
  const { data, error } = await supabase.rpc("add_service_request_labor", {
    p_request_id: input.requestId,
    p_description: input.description,
    p_hours: input.hours,
    p_hourly_rate: input.hourlyRate,
  });
  if (error) throw new Error(error.message);
  return data as { id: string };
}

export async function updateRepairLabor(input: { id: string; description: string; hours: number; hourlyRate: number }) {
  const { data, error } = await supabase.rpc("update_service_request_labor", {
    p_labor_id: input.id,
    p_description: input.description,
    p_hours: input.hours,
    p_hourly_rate: input.hourlyRate,
  });
  if (error) throw new Error(error.message);
  return data as { id: string };
}

export async function deleteRepairLabor(id: string) {
  const { data, error } = await supabase.rpc("delete_service_request_labor", { p_labor_id: id });
  if (error) throw new Error(error.message);
  return data as { id: string };
}

export type PublicTrackedRequest = {
  request_number: string;
  status: RequestStatus;
  created_at: string;
  updated_at: string;
  device_type: string;
  brand: string | null;
  model: string | null;
  serial_number: string | null;
  service_name: string | null;
  history: Array<{
    old_status: RequestStatus | null;
    new_status: RequestStatus;
    created_at: string;
  }>;
};

export async function trackPublicServiceRequest(requestNumber: string, phone: string) {
  const { data, error } = await supabase.rpc("get_public_service_request", {
    p_request_number: requestNumber.trim(),
    p_phone: phone.trim(),
  });

  if (error) throw new Error(error.message);
  return (data as PublicTrackedRequest | null) ?? null;
}

export function formatRequestStatus(status: RequestStatus) {
  return requestStatusLabels[status];
}

export function formatRequestDate(value: string) {
  return new Intl.DateTimeFormat("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

export function formatRequestDateTime(value: string) {
  return new Intl.DateTimeFormat("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

export function formatFileSize(size: number) {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${Math.round(size / 1024)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

export function getAssignmentActionLabel(action: AssignmentHistoryItem["action"]) {
  return action.charAt(0).toUpperCase() + action.slice(1);
}
