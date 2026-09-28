import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0"

const functionName = "admin-user-management"
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
}

const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? ""
const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? ""
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})
const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

type EmployeeRole = "staff" | "technician"
type Action = "list" | "create" | "update" | "set_status" | "delete"

type EmployeeInput = {
  full_name?: unknown
  email?: unknown
  phone?: unknown
  role?: unknown
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  })
}

function isEmployeeRole(role: unknown): role is EmployeeRole {
  return role === "staff" || role === "technician"
}

function requiredText(value: unknown, field: string) {
  if (typeof value !== "string" || !value.trim()) throw new Error(`${field} is required.`)
  return value.trim()
}

function optionalText(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null
}

async function requireAdmin(request: Request) {
  const authorization = request.headers.get("Authorization")
  if (!authorization?.startsWith("Bearer ")) throw new Error("Unauthorized.")

  const token = authorization.replace("Bearer ", "").trim()
  const { data: userData, error: userError } = await supabaseAuth.auth.getUser(token)
  if (userError || !userData.user) throw new Error("Unauthorized.")

  const { data: profile, error: profileError } = await supabaseAdmin
    .from("profiles")
    .select("role, is_active")
    .eq("id", userData.user.id)
    .maybeSingle()

  if (profileError || profile?.role !== "admin" || profile.is_active !== true) {
    throw new Error("Only active admin users can manage employees.")
  }

  return userData.user
}

async function getEmployee(id: string) {
  const { data, error } = await supabaseAdmin
    .from("profiles")
    .select("id, full_name, email, role, phone, is_active, created_at, updated_at")
    .eq("id", id)
    .maybeSingle()

  if (error) throw new Error(error.message)
  if (!data || !isEmployeeRole(data.role)) throw new Error("That employee could not be found.")
  return data
}

async function handleRequest(request: Request) {
  const actor = await requireAdmin(request)
  const body = await request.json() as { action?: Action } & EmployeeInput & { id?: unknown; is_active?: unknown }
  const action = body.action

  if (action === "list") {
    const { data, error } = await supabaseAdmin
      .from("profiles")
      .select("id, full_name, email, role, phone, is_active, created_at, updated_at")
      .in("role", ["staff", "technician"])
      .order("created_at", { ascending: false })

    if (error) throw new Error(error.message)
    return jsonResponse({ employees: data ?? [] })
  }

  if (action === "create") {
    const fullName = requiredText(body.full_name, "Full name")
    const email = requiredText(body.email, "Email").toLowerCase()
    const phone = optionalText(body.phone)
    if (!isEmployeeRole(body.role)) throw new Error("Choose Staff or Technician for the employee role.")

    const { data: invited, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
      data: { full_name: fullName, role: body.role },
    })

    if (inviteError || !invited.user) throw new Error(inviteError?.message ?? "The employee account could not be created.")

    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .insert({
        id: invited.user.id,
        full_name: fullName,
        email,
        phone,
        role: body.role,
        is_active: true,
      })
      .select("id, full_name, email, role, phone, is_active, created_at, updated_at")
      .single()

    if (profileError || !profile) {
      const { error: cleanupError } = await supabaseAdmin.auth.admin.deleteUser(invited.user.id)
      console.error(`[${functionName}] profile creation failed after invitation`, { profileError, cleanupError })
      throw new Error("The employee account could not be completed. No employee profile was created.")
    }

    console.info(`[${functionName}] employee created`, { actorId: actor.id, employeeId: invited.user.id, role: body.role })
    return jsonResponse({ employee: profile }, 201)
  }

  const id = requiredText(body.id, "Employee id")
  if (id === actor.id) throw new Error("You cannot change or delete your own admin account here.")
  const employee = await getEmployee(id)

  if (action === "update") {
    const fullName = requiredText(body.full_name, "Full name")
    if (!isEmployeeRole(body.role)) throw new Error("Choose Staff or Technician for the employee role.")

    const { data: updated, error } = await supabaseAdmin
      .from("profiles")
      .update({ full_name: fullName, phone: optionalText(body.phone), role: body.role, updated_at: new Date().toISOString() })
      .eq("id", employee.id)
      .select("id, full_name, email, role, phone, is_active, created_at, updated_at")
      .single()

    if (error || !updated) throw new Error(error?.message ?? "The employee could not be updated.")
    console.info(`[${functionName}] employee updated`, { actorId: actor.id, employeeId: employee.id, role: body.role })
    return jsonResponse({ employee: updated })
  }

  if (action === "set_status") {
    if (typeof body.is_active !== "boolean") throw new Error("A valid account status is required.")

    const { data: updated, error } = await supabaseAdmin
      .from("profiles")
      .update({ is_active: body.is_active, updated_at: new Date().toISOString() })
      .eq("id", employee.id)
      .select("id, full_name, email, role, phone, is_active, created_at, updated_at")
      .single()

    if (error || !updated) throw new Error(error?.message ?? "The employee status could not be updated.")
    console.info(`[${functionName}] employee status changed`, { actorId: actor.id, employeeId: employee.id, isActive: body.is_active })
    return jsonResponse({ employee: updated })
  }

  if (action === "delete") {
    const { error } = await supabaseAdmin.auth.admin.deleteUser(employee.id)
    if (error) throw new Error(error.message)
    console.info(`[${functionName}] employee deleted`, { actorId: actor.id, employeeId: employee.id })
    return jsonResponse({ success: true })
  }

  throw new Error("Unsupported employee management action.")
}

serve(async (request) => {
  if (request.method === "OPTIONS") return new Response(null, { headers: corsHeaders })
  if (request.method !== "POST") return jsonResponse({ error: "Method not allowed." }, 405)

  try {
    return await handleRequest(request)
  } catch (error) {
    const message = error instanceof Error ? error.message : "The request could not be completed."
    const status = message === "Unauthorized." ? 401 : message.startsWith("Only active") ? 403 : 400
    console.error(`[${functionName}] request failed`, { message })
    return jsonResponse({ error: message }, status)
  }
})
