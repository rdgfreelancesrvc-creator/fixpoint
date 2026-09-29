import { supabase } from "@/integrations/supabase/client";
import type { RequestStatus } from "@/lib/adminServiceRequests";

export type CustomerSort = "latest_desc" | "latest_asc" | "name_asc" | "name_desc" | "requests_desc" | "requests_asc";

export type CustomerListItem = {
  id: string;
  full_name: string;
  phone: string;
  email: string | null;
  created_at: string;
  updated_at: string;
  request_count: number;
  latest_request_date: string | null;
  latest_request_number: string | null;
};

export type CustomerRequestSummary = {
  id: string;
  request_number: string;
  device_type: string;
  brand: string | null;
  model: string | null;
  service_name: string | null;
  status: RequestStatus;
  assigned_technician: {
    id: string;
    name: string;
  } | null;
  created_at: string;
};

export type CustomerDetail = {
  id: string;
  full_name: string;
  phone: string;
  email: string | null;
  created_at: string;
  updated_at: string;
  contact_email: boolean | null;
  contact_sms: boolean | null;
  contact_phone: boolean | null;
  requests: CustomerRequestSummary[];
};

type CustomerListResponse = {
  total_count: number;
  customers: CustomerListItem[];
};

export async function listInternalCustomers(input: { search: string; sort: CustomerSort }) {
  const { data, error } = await supabase.rpc("get_internal_customers", {
    p_search: input.search.trim() || null,
    p_sort: input.sort,
    p_limit: 250,
    p_offset: 0,
  });

  if (error) throw new Error(error.message);
  const result = (data ?? {}) as CustomerListResponse;
  return {
    totalCount: Number(result.total_count ?? 0),
    customers: (result.customers ?? []) as CustomerListItem[],
  };
}

export async function getInternalCustomer(customerId: string) {
  const { data, error } = await supabase.rpc("get_internal_customer", {
    p_customer_id: customerId,
  });

  if (error) throw new Error(error.message);
  if (!data) throw new Error("Customer not found.");
  return data as CustomerDetail;
}

export function formatCustomerDate(value: string | null) {
  if (!value) return "No requests yet";
  return new Intl.DateTimeFormat("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

export function formatCustomerDateTime(value: string) {
  return new Intl.DateTimeFormat("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

export const customerSortOptions: Array<{ value: CustomerSort; label: string }> = [
  { value: "latest_desc", label: "Most recent request" },
  { value: "latest_asc", label: "Oldest request" },
  { value: "name_asc", label: "Name A–Z" },
  { value: "name_desc", label: "Name Z–A" },
  { value: "requests_desc", label: "Most requests" },
  { value: "requests_asc", label: "Fewest requests" },
];

export const customerStatusLabels: Record<RequestStatus, string> = {
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

export function formatCustomerStatus(status: RequestStatus) {
  return customerStatusLabels[status] ?? status;
}

export function getDeviceLabel(request: Pick<CustomerRequestSummary, "device_type" | "brand" | "model">) {
  return [request.brand, request.model].filter(Boolean).join(" ") || request.device_type;
}
