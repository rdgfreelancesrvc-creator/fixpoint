import { supabase } from "@/integrations/supabase/client";

export async function processPendingNotifications() {
  const { error } = await supabase.functions.invoke("notification-worker", { body: { action: "process" } });
  if (error) throw new Error(error.message);
}

export async function getNotificationSettings() {
  const { data, error } = await supabase.functions.invoke("notification-worker", { body: { action: "get_settings" } });
  if (error) throw new Error(error.message);
  return data.settings as NotificationSettings;
}

export async function saveNotificationSettings(settings: Partial<NotificationSettings>) {
  const { data, error } = await supabase.functions.invoke("notification-worker", { body: { action: "save_settings", settings } });
  if (error) throw new Error(error.message);
  return data.settings as NotificationSettings;
}

export async function sendTestEmail(recipient: string) {
  const { error } = await supabase.functions.invoke("notification-worker", { body: { action: "test_email", recipient } });
  if (error) throw new Error(error.message);
}

export async function sendTestSms(recipient: string) {
  const { error } = await supabase.functions.invoke("notification-worker", { body: { action: "test_sms", recipient } });
  if (error) throw new Error(error.message);
}

export type NotificationSettings = {
  email_enabled: boolean;
  sms_enabled: boolean;
  resend_from_name: string;
  resend_from_email: string | null;
  resend_reply_to: string | null;
  semaphore_sender_name: string;
  resend_configured: boolean;
  semaphore_configured: boolean;
} & Record<string, boolean | string | null>;

export type NotificationLog = {
  id: string;
  service_request_id: string | null;
  customer_id: string | null;
  channel: "email" | "sms";
  notification_type: string;
  recipient: string;
  subject: string | null;
  message: string | null;
  provider: string;
  provider_message_id: string | null;
  status: "queued" | "sent" | "failed";
  error_message: string | null;
  sent_at: string | null;
  created_at: string;
  request_number?: string | null;
};

export async function listNotificationLogs(filters: { channel?: string; status?: string; notificationType?: string }) {
  let query = supabase.from("notification_logs").select("*, service_requests(request_number)").order("created_at", { ascending: false }).limit(200);
  if (filters.channel && filters.channel !== "all") query = query.eq("channel", filters.channel);
  if (filters.status && filters.status !== "all") query = query.eq("status", filters.status);
  if (filters.notificationType && filters.notificationType !== "all") query = query.eq("notification_type", filters.notificationType);
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => ({ ...row, request_number: (row.service_requests as { request_number?: string } | null)?.request_number ?? null })) as NotificationLog[];
}

export function notificationTypeLabel(value: string) {
  return value.split("_").map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" ");
}

export function notificationKey(channel: "email" | "sms", type: string) {
  return `${channel}_${type}`;
}

export const notificationTypes = [
  "repair_request_received",
  "technician_assigned",
  "quotation_ready",
  "quotation_approved",
  "quotation_declined",
  "repair_status_changed",
  "ready_for_pickup",
  "repair_completed",
] as const;

export function triggerNotificationProcessing() {
  void processPendingNotifications().catch(() => undefined);
}
