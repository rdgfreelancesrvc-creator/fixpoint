import { supabase } from "@/integrations/supabase/client";

export type QuotationStatus = "draft" | "sent" | "approved" | "declined" | "expired" | "cancelled";
export type QuotationItemType = "part" | "labor" | "service";

export type ServiceRequestQuotationItem = {
  id?: string;
  item_type: QuotationItemType;
  description: string;
  quantity: number;
  unit_price: number;
  line_total: number;
};

export type ServiceRequestQuotation = {
  id: string;
  quotation_number: string;
  status: QuotationStatus;
  diagnosis_summary: string | null;
  customer_message: string | null;
  parts_subtotal: number;
  labor_subtotal: number;
  total_amount: number;
  valid_until: string | null;
  created_at: string;
  updated_at: string;
  sent_at: string | null;
  response: "approved" | "declined" | null;
  customer_name: string | null;
  customer_phone: string | null;
  customer_comment: string | null;
  responded_at: string | null;
  items: ServiceRequestQuotationItem[];
};

export type QuotationCreationResult = {
  id: string;
  quotation_number: string;
  status: "draft";
  parts_subtotal: number;
  labor_subtotal: number;
  total_amount: number;
  customer_token: string;
};

export type QuotationSendResult = {
  id: string;
  quotation_number: string;
  status: "sent";
  customer_token: string;
  sent_at: string;
};

export type PublicQuotation = {
  quotation_number: string;
  status: QuotationStatus;
  diagnosis_summary: string | null;
  customer_message: string | null;
  parts_subtotal: number;
  labor_subtotal: number;
  total_amount: number;
  valid_until: string | null;
  created_at: string;
  sent_at: string | null;
  request_number: string;
  device_type: string;
  brand: string | null;
  model: string | null;
  service_name: string | null;
  items: Omit<ServiceRequestQuotationItem, "id">[];
};

export async function createQuotation(input: { requestId: string; diagnosisSummary: string; customerMessage: string; validUntil: string | null }) {
  const { data, error } = await supabase.rpc("create_service_request_quotation", {
    p_request_id: input.requestId,
    p_diagnosis_summary: input.diagnosisSummary || null,
    p_customer_message: input.customerMessage || null,
    p_valid_until: input.validUntil || null,
  });
  if (error) throw new Error(error.message);
  return data as QuotationCreationResult;
}

export async function updateDraftQuotation(input: { quotationId: string; diagnosisSummary: string; customerMessage: string; validUntil: string | null; items: ServiceRequestQuotationItem[] }) {
  const { data, error } = await supabase.rpc("update_draft_service_request_quotation", {
    p_quotation_id: input.quotationId,
    p_diagnosis_summary: input.diagnosisSummary || null,
    p_customer_message: input.customerMessage || null,
    p_valid_until: input.validUntil || null,
    p_items: input.items.map(({ item_type, description, quantity, unit_price }) => ({ item_type, description, quantity, unit_price })),
  });
  if (error) throw new Error(error.message);
  return data as { id: string; parts_subtotal: number; labor_subtotal: number; total_amount: number };
}

export async function sendQuotation(quotationId: string) {
  const { data, error } = await supabase.rpc("send_service_request_quotation", { p_quotation_id: quotationId });
  if (error) throw new Error(error.message);
  return data as QuotationSendResult;
}

export async function createRevisedQuotation(quotationId: string) {
  const { data, error } = await supabase.rpc("create_revised_service_request_quotation", { p_quotation_id: quotationId });
  if (error) throw new Error(error.message);
  return data as QuotationCreationResult;
}

export async function listQuotations(requestId: string) {
  const { data, error } = await supabase.rpc("get_service_request_quotations", { p_request_id: requestId });
  if (error) throw new Error(error.message);
  return (data ?? []) as ServiceRequestQuotation[];
}

export async function getPublicQuotation(token: string) {
  const { data, error } = await supabase.rpc("get_public_service_request_quotation", { p_token: token });
  if (error) throw new Error(error.message);
  return (data as PublicQuotation | null) ?? null;
}

export async function respondToQuotation(input: { token: string; response: "approved" | "declined"; customerName: string; customerPhone: string; customerComment: string }) {
  const { data, error } = await supabase.rpc("respond_to_service_request_quotation", {
    p_token: input.token,
    p_response: input.response,
    p_customer_name: input.customerName || null,
    p_customer_phone: input.customerPhone || null,
    p_customer_comment: input.customerComment || null,
  });
  if (error) throw new Error(error.message);
  return data as { quotation_number: string; status: QuotationStatus; request_status?: string; already_responded: boolean; response_id?: string };
}

export function getQuotationUrl(token: string) {
  return `${window.location.origin}/quote?token=${encodeURIComponent(token)}`;
}

export function formatQuotationDate(value: string | null) {
  if (!value) return "Not specified";
  return new Intl.DateTimeFormat("en-PH", { month: "short", day: "numeric", year: "numeric" }).format(new Date(`${value}T00:00:00`));
}

export function formatQuotationDateTime(value: string | null) {
  if (!value) return "Not sent";
  return new Intl.DateTimeFormat("en-PH", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" }).format(new Date(value));
}
