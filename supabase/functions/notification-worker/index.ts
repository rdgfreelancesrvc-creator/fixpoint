import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0"

const functionName = "notification-worker"
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
}
const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? ""
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? ""
const resendApiKey = Deno.env.get("RESEND_API_KEY") ?? ""
const semaphoreApiKey = Deno.env.get("SEMAPHORE_API_KEY") ?? ""
const appUrl = (Deno.env.get("APP_URL") ?? "http://localhost:5173").replace(/\/$/, "")
const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, { auth: { autoRefreshToken: false, persistSession: false } })
const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, { auth: { autoRefreshToken: false, persistSession: false } })

type NotificationType = "repair_request_received" | "technician_assigned" | "quotation_ready" | "quotation_approved" | "quotation_declined" | "repair_status_changed" | "ready_for_pickup" | "repair_completed"
type Channel = "email" | "sms"
type Settings = Record<string, unknown> & { email_enabled: boolean; sms_enabled: boolean; resend_from_name: string; resend_from_email: string | null; resend_reply_to: string | null; semaphore_sender_name: string }
type EventRow = { id: string; event_key: string; service_request_id: string | null; quotation_id: string | null; notification_type: NotificationType; payload: Record<string, unknown> }

type RequestRecord = {
  id: string; request_number: string; status: string; device_type: string; brand: string | null; model: string | null
  contact_email: boolean; contact_sms: boolean; customer: { id: string; full_name: string; email: string | null; phone: string } | null
}
type QuoteRecord = { quotation_number: string; total_amount: number; valid_until: string | null; service_request: RequestRecord | null }

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } })
}
function text(value: unknown) { return typeof value === "string" ? value : "" }
function escapeHtml(value: string) { return value.replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[character] ?? character) }
function money(value: number) { return new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" }).format(Number(value) || 0) }
function statusLabel(status: string) {
  return ({ received: "Repair Request Received", diagnosing: "Your Device Is Being Diagnosed", waiting_customer_approval: "Quotation Awaiting Your Approval", approved: "Repair Approved", in_repair: "Repair In Progress", waiting_parts: "Waiting for Required Parts", ready_for_pickup: "Ready for Pickup", completed: "Repair Completed", cancelled: "Repair Cancelled" } as Record<string, string>)[status] ?? "Repair Status Updated"
}
function preferenceKey(channel: Channel, type: NotificationType) { return `${channel}_${type}` }
function safeMessageForLog(message: string) { return message.replace(/https?:\/\/[^\s]+/g, "[secure link]") }

async function requireActor(request: Request, adminOnly = false) {
  const authorization = request.headers.get("Authorization") ?? ""
  const token = authorization.replace(/^Bearer\s+/i, "").trim()
  if (!token) throw new Error("Unauthorized.")
  if (token === serviceRoleKey) return { id: "service-role", role: "service_role" }
  if (token === supabaseAnonKey && !adminOnly) return { id: "anonymous", role: "anonymous" }
  const { data, error } = await supabaseAuth.auth.getUser(token)
  if (error || !data.user) throw new Error("Unauthorized.")
  const { data: profile } = await supabaseAdmin.from("profiles").select("role, is_active").eq("id", data.user.id).maybeSingle()
  if (!profile?.is_active || !["admin", "staff"].includes(profile.role) || (adminOnly && profile.role !== "admin")) throw new Error(adminOnly ? "Only active admins can manage notification settings." : "Not authorized.")
  return { id: data.user.id, role: profile.role }
}

async function getSettings(): Promise<Settings> {
  const { data, error } = await supabaseAdmin.from("notification_settings").select("*").eq("id", "00000000-0000-0000-0000-000000000001").single()
  if (error || !data) throw new Error("Notification settings could not be loaded.")
  return data as Settings
}
function publicSettings(settings: Settings) {
  const result: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(settings)) {
    if (!key.includes("api_key") && key !== "id" && key !== "created_at" && key !== "updated_at") result[key] = value
  }
  result.resend_configured = Boolean(resendApiKey)
  result.semaphore_configured = Boolean(semaphoreApiKey)
  return result
}

async function sendEmail(settings: Settings, recipient: string, subject: string, html: string) {
  if (!resendApiKey) throw new Error("RESEND_API_KEY is not configured on the server.")
  if (!settings.resend_from_email) throw new Error("A Resend From Email must be configured.")
  const response = await fetch("https://api.resend.com/emails", { method: "POST", headers: { Authorization: `Bearer ${resendApiKey}`, "Content-Type": "application/json" }, body: JSON.stringify({ from: `${settings.resend_from_name} <${settings.resend_from_email}>`, to: [recipient], reply_to: settings.resend_reply_to || undefined, subject, html }) })
  const body = await response.json().catch(() => ({})) as { id?: string; message?: string }
  if (!response.ok) throw new Error(body.message || `Resend returned HTTP ${response.status}.`)
  return body.id ?? null
}
async function sendSms(settings: Settings, recipient: string, message: string) {
  if (!semaphoreApiKey) throw new Error("SEMAPHORE_API_KEY is not configured on the server.")
  const form = new URLSearchParams({ apikey: semaphoreApiKey, number: recipient, message, sendername: settings.semaphore_sender_name })
  const response = await fetch("https://api.semaphore.co/api/v4/messages", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: form })
  const body = await response.json().catch(() => ({})) as Array<{ message_id?: string; id?: string; message?: string }> | { message?: string }
  if (!response.ok) throw new Error((body as { message?: string }).message || `Semaphore returned HTTP ${response.status}.`)
  const first = Array.isArray(body) ? body[0] : body
  return first?.message_id ?? first?.id ?? null
}

function template(type: NotificationType, request: RequestRecord, quote: QuoteRecord | null, payload: Record<string, unknown>) {
  const name = request.customer?.full_name || "there"
  const number = request.request_number
  const device = [request.brand, request.model].filter(Boolean).join(" ") || request.device_type
  const token = text(payload.customer_token)
  const quoteLink = token ? `${appUrl}/quote?token=${encodeURIComponent(token)}` : `${appUrl}/quote`
  const title = type === "repair_request_received" ? "We received your repair request" : type === "technician_assigned" ? "Your repair is now being handled" : type === "quotation_ready" ? "Your repair quotation is ready" : type === "quotation_approved" ? "Your quotation was approved" : type === "quotation_declined" ? "Your quotation response was recorded" : type === "ready_for_pickup" ? "Your repair is ready for pickup" : type === "repair_completed" ? "Your repair is completed" : "Your repair status has been updated"
  const subject = `FixPoint · ${title}`
  let sms = `FixPoint: Your repair request ${number} has been updated.`
  let body = `We have an update about your ${escapeHtml(device)} repair request.`
  if (type === "repair_request_received") { body = `We received your repair request ${escapeHtml(number)}. We'll update you as your repair progresses.`; sms = `FixPoint: We received your repair request ${number}. We'll update you as your repair progresses.` }
  if (type === "technician_assigned") { body = `Your FixPoint repair request ${escapeHtml(number)} has been assigned and is now being handled by our repair team.`; sms = `FixPoint: Your repair request ${number} has been assigned to our repair team.` }
  if (type === "quotation_ready") { body = `Your quotation ${escapeHtml(quote?.quotation_number || "") } for request ${escapeHtml(number)} is ready. The total is <strong>${escapeHtml(money(Number(quote?.total_amount) || 0))}</strong>. <a href="${escapeHtml(quoteLink)}">Review and approve your quotation</a>${quote?.valid_until ? ` before ${escapeHtml(quote.valid_until)}.` : "."}`; sms = `FixPoint: Your repair quotation for ${number} is ready. Review and approve it here: ${quoteLink}` }
  if (type === "quotation_approved") { body = `Thank you, ${escapeHtml(name)}. We recorded your approval for quotation ${escapeHtml(quote?.quotation_number || "")} on request ${escapeHtml(number)}.`; sms = `FixPoint: Thank you. Your quotation for ${number} was approved.` }
  if (type === "quotation_declined") { body = `We recorded your response for quotation ${escapeHtml(quote?.quotation_number || "")} on request ${escapeHtml(number)}. Our team is available if you have questions.`; sms = `FixPoint: Your quotation response for ${number} was recorded. Contact us with any questions.` }
  if (type === "repair_status_changed") { const label = statusLabel(text(payload.new_status) || request.status); body = `The status of your repair request ${escapeHtml(number)} is now <strong>${escapeHtml(label)}</strong>.`; sms = `FixPoint: Repair ${number} update: ${label}.` }
  if (type === "ready_for_pickup") { body = `Your repair request ${escapeHtml(number)} is ready for pickup. Please contact FixPoint if you have questions.`; sms = `FixPoint: Your repair ${number} is ready for pickup. Please contact us if you have questions.` }
  if (type === "repair_completed") { body = `Your repair request ${escapeHtml(number)} has been completed. Thank you for choosing FixPoint.`; sms = `FixPoint: Your repair ${number} is completed. Thank you for choosing FixPoint.` }
  const html = `<div style="background:#ffffff;color:#252525;font-family:Arial,sans-serif;padding:28px 16px"><div style="max-width:560px;margin:0 auto;border:1px solid #ead9d6;border-radius:18px;overflow:hidden"><div style="background:#fff5f3;padding:28px"><div style="color:#B4232C;font-size:13px;font-weight:700;letter-spacing:.14em;text-transform:uppercase">FixPoint</div><h1 style="font-size:26px;line-height:1.2;margin:12px 0 0;color:#252525">${escapeHtml(title)}</h1></div><div style="padding:28px"><p style="font-size:16px;line-height:1.6;margin:0 0 18px">Hi ${escapeHtml(name)},</p><p style="font-size:15px;line-height:1.7;margin:0">${body}</p><div style="background:#fbfaf8;border-radius:12px;padding:16px;margin:22px 0"><div style="font-size:11px;color:#817c76;text-transform:uppercase;letter-spacing:.1em;font-weight:700">Request number</div><div style="font-size:17px;font-weight:700;margin-top:6px">${escapeHtml(number)}</div></div>${type === "quotation_ready" ? `<a href="${escapeHtml(quoteLink)}" style="display:inline-block;background:#B4232C;color:#fff;text-decoration:none;padding:13px 18px;border-radius:999px;font-weight:700">Review quotation</a>` : ""}<p style="font-size:13px;line-height:1.6;color:#77736e;margin:26px 0 0">Questions? Reply to this email or contact the FixPoint repair team.</p></div></div></div>`
  return { subject, html, sms }
}

async function logDelivery(event: EventRow, request: RequestRecord, channel: Channel, recipient: string, subject: string | null, message: string, provider: string, status: "sent" | "failed", providerMessageId: string | null, errorMessage: string | null) {
  const { data: existing } = await supabaseAdmin.from("notification_logs").select("id").eq("event_id", event.id).eq("channel", channel).maybeSingle()
  if (existing) return
  await supabaseAdmin.from("notification_logs").insert({ event_id: event.id, service_request_id: request.id, customer_id: request.customer?.id ?? null, channel, notification_type: event.notification_type, recipient, subject, message: safeMessageForLog(message), provider, provider_message_id: providerMessageId, status, error_message: errorMessage, sent_at: status === "sent" ? new Date().toISOString() : null })
}

async function processEvent(event: EventRow) {
  const settings = await getSettings()
  const { data: request, error: requestError } = await supabaseAdmin.from("service_requests").select("id, request_number, status, device_type, brand, model, contact_email, contact_sms, customer:customers(id, full_name, email, phone)").eq("id", event.service_request_id).maybeSingle()
  if (requestError || !request) throw new Error("The repair request for this notification could not be found.")
  const requestRecord = request as unknown as RequestRecord
  let quote: QuoteRecord | null = null
  if (event.quotation_id) {
    const { data } = await supabaseAdmin.from("service_request_quotations").select("quotation_number, total_amount, valid_until").eq("id", event.quotation_id).maybeSingle()
    quote = data ? { ...(data as QuoteRecord), service_request: requestRecord } : null
  }
  const content = template(event.notification_type, requestRecord, quote, event.payload || {})
  const channels: Channel[] = ["email", "sms"]
  for (const channel of channels) {
    const enabled = Boolean(settings[`${channel}_enabled`]) && Boolean(settings[preferenceKey(channel, event.notification_type)])
    const customerEnabled = channel === "email" ? requestRecord.contact_email : requestRecord.contact_sms
    const recipient = channel === "email" ? requestRecord.customer?.email : requestRecord.customer?.phone
    if (!enabled || !customerEnabled || !recipient) {
      if (recipient) await logDelivery(event, requestRecord, channel, recipient, channel === "email" ? content.subject : null, channel === "email" ? content.subject : content.sms, channel === "email" ? "Resend" : "Semaphore", "failed", null, !enabled ? "Skipped: disabled by notification settings." : !customerEnabled ? "Skipped: customer disabled this channel for the request." : "Skipped: customer has no contact address.")
      continue
    }
    try {
      const provider = channel === "email" ? "Resend" : "Semaphore"
      const providerMessageId = channel === "email" ? await sendEmail(settings, recipient, content.subject, content.html) : await sendSms(settings, recipient, content.sms)
      await logDelivery(event, requestRecord, channel, recipient, channel === "email" ? content.subject : null, channel === "email" ? content.subject : content.sms, provider, "sent", providerMessageId, null)
    } catch (error) {
      const message = error instanceof Error ? error.message : "Provider delivery failed."
      await logDelivery(event, requestRecord, channel, recipient, channel === "email" ? content.subject : null, channel === "email" ? content.subject : content.sms, channel === "email" ? "Resend" : "Semaphore", "failed", null, message)
    }
  }
}

async function processPending(eventId?: string) {
  let events: EventRow[] = []
  if (eventId) {
    const { data } = await supabaseAdmin.rpc("claim_notification_event", { p_event_id: eventId })
    if (data) events = [data as EventRow]
  } else {
    const { data } = await supabaseAdmin.from("notification_events").select("*").eq("status", "queued").order("created_at", { ascending: true }).limit(20)
    for (const candidate of (data ?? []) as EventRow[]) {
      const { data: claimed } = await supabaseAdmin.rpc("claim_notification_event", { p_event_id: candidate.id })
      if (claimed) events.push(claimed as EventRow)
    }
  }
  for (const event of events) {
    try { await processEvent(event) } catch (error) { console.error(`[${functionName}] event processing failed`, { eventId: event.id, error: error instanceof Error ? error.message : "unknown" }) }
    await supabaseAdmin.from("notification_events").update({ status: "processed", processed_at: new Date().toISOString() }).eq("id", event.id)
  }
  return { processed: events.length }
}

async function testEmail(settings: Settings, recipient: string) {
  const subject = "FixPoint notification test"
  const html = `<div style="font-family:Arial,sans-serif;color:#252525;padding:24px"><strong style="color:#B4232C">FixPoint</strong><h1>Test email sent successfully.</h1><p>Email delivery is working.</p></div>`
  return sendEmail(settings, recipient, subject, html)
}
async function testSms(settings: Settings, recipient: string) { return sendSms(settings, recipient, "FixPoint notification test: SMS delivery is working.") }

async function handleRequest(request: Request) {
  const body = await request.json().catch(() => ({})) as { action?: string; event_id?: string; recipient?: string; settings?: Record<string, unknown> }
  const action = body.action ?? "process"
  if (action === "process") {
    const authorization = request.headers.get("Authorization")
    if (authorization) await requireActor(request)
    return jsonResponse(await processPending(body.event_id))
  }
  if (action === "get_settings") { await requireActor(request, true); return jsonResponse({ settings: publicSettings(await getSettings()) }) }
  if (action === "save_settings") {
    await requireActor(request, true)
    const allowed = ["email_enabled", "sms_enabled", "resend_from_name", "resend_from_email", "resend_reply_to", "semaphore_sender_name", ...["repair_request_received", "technician_assigned", "quotation_ready", "quotation_approved", "quotation_declined", "repair_status_changed", "ready_for_pickup", "repair_completed"].flatMap((type) => [`email_${type}`, `sms_${type}`])]
    const update: Record<string, unknown> = {}
    for (const key of allowed) if (key in (body.settings ?? {})) update[key] = body.settings?.[key]
    update.updated_at = new Date().toISOString()
    const { error } = await supabaseAdmin.from("notification_settings").update(update).eq("id", "00000000-0000-0000-0000-000000000001")
    if (error) throw new Error(error.message)
    return jsonResponse({ settings: publicSettings(await getSettings()) })
  }
  if (action === "test_email") { await requireActor(request, true); const recipient = text(body.recipient); if (!/^\S+@\S+\.\S+$/.test(recipient)) throw new Error("Enter a valid test email address."); return jsonResponse({ message_id: await testEmail(await getSettings(), recipient) }) }
  if (action === "test_sms") { await requireActor(request, true); const recipient = text(body.recipient); if (!/^\+?[0-9]{10,15}$/.test(recipient.replace(/[\s-]/g, ""))) throw new Error("Enter a valid Philippine mobile number."); return jsonResponse({ message_id: await testSms(await getSettings(), recipient) }) }
  throw new Error("Unsupported notification action.")
}

serve(async (request) => {
  if (request.method === "OPTIONS") return new Response(null, { headers: corsHeaders })
  if (request.method !== "POST") return jsonResponse({ error: "Method not allowed." }, 405)
  try { return await handleRequest(request) } catch (error) {
    const message = error instanceof Error ? error.message : "The notification request could not be completed."
    const status = message === "Unauthorized." ? 401 : message.startsWith("Only active") || message === "Not authorized." ? 403 : 400
    console.error(`[${functionName}] request failed`, { message })
    return jsonResponse({ error: message }, status)
  }
})

export {}
