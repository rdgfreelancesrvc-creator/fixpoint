import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0"

const functionName = "initial-admin-setup"
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
}

const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? ""
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

type SetupAction = "status" | "create"

type SetupBody = {
  action?: unknown
  full_name?: unknown
  email?: unknown
  redirect_to?: unknown
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  })
}

function requiredText(value: unknown, field: string, maxLength: number) {
  if (typeof value !== "string" || !value.trim()) throw new Error(`${field} is required.`)
  const text = value.trim()
  if (text.length > maxLength) throw new Error(`${field} is too long.`)
  return text
}

function validateEmail(value: unknown) {
  const email = requiredText(value, "Email", 254).toLowerCase()
  if (!/^\S+@\S+\.\S+$/.test(email)) throw new Error("Enter a valid email address.")
  return email
}

async function hasActiveAdmin() {
  const { data, error } = await supabaseAdmin
    .from("profiles")
    .select("id")
    .eq("role", "admin")
    .eq("is_active", true)
    .limit(1)

  if (error) throw new Error("The setup status could not be checked.")
  return (data?.length ?? 0) > 0
}

function getInviteRedirect(value: unknown, request: Request) {
  if (typeof value !== "string" || !value.trim()) return undefined

  let redirect: URL
  try {
    redirect = new URL(value)
  } catch {
    throw new Error("The invitation redirect is invalid.")
  }

  const origin = request.headers.get("Origin")
  if (origin && redirect.origin !== origin) throw new Error("The invitation redirect is invalid.")
  if (redirect.pathname !== "/setup/complete") throw new Error("The invitation redirect is invalid.")
  return redirect.toString()
}

async function createInitialAdmin(body: SetupBody, request: Request) {
  if (await hasActiveAdmin()) {
    return jsonResponse({ error: "Setup already complete." }, 409)
  }

  const fullName = requiredText(body.full_name, "Full name", 160)
  const email = validateEmail(body.email)
  const redirectTo = getInviteRedirect(body.redirect_to, request)

  const { data: invited, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
    data: { full_name: fullName, role: "admin" },
    ...(redirectTo ? { redirectTo } : {}),
  })

  if (inviteError || !invited.user) {
    throw new Error(inviteError?.message ?? "The Owner/Admin invitation could not be created.")
  }

  const { data: profile, error: profileError } = await supabaseAdmin
    .from("profiles")
    .insert({
      id: invited.user.id,
      full_name: fullName,
      email,
      role: "admin",
      is_active: true,
    })
    .select("id, full_name, email, role, is_active, created_at, updated_at")
    .single()

  if (profileError || !profile) {
    const { error: cleanupError } = await supabaseAdmin.auth.admin.deleteUser(invited.user.id)
    console.error(`[${functionName}] profile creation failed after invitation`, { profileError, cleanupError })

    if (profileError?.code === "23505") {
      return jsonResponse({ error: "Setup already complete." }, 409)
    }

    throw new Error("The Owner/Admin account could not be completed. No profile was created.")
  }

  console.info(`[${functionName}] initial admin invitation created`, { adminId: invited.user.id })
  return jsonResponse({ profile }, 201)
}

async function handleRequest(request: Request) {
  const body = await request.json() as SetupBody
  const action = body.action as SetupAction | undefined

  if (action === "status") {
    return jsonResponse({ available: !(await hasActiveAdmin()) })
  }

  if (action === "create") return createInitialAdmin(body, request)
  throw new Error("Unsupported setup action.")
}

serve(async (request) => {
  if (request.method === "OPTIONS") return new Response(null, { headers: corsHeaders })
  if (request.method !== "POST") return jsonResponse({ error: "Method not allowed." }, 405)

  try {
    return await handleRequest(request)
  } catch (error) {
    const message = error instanceof Error ? error.message : "The setup request could not be completed."
    const status = message === "Setup already complete." ? 409 : 400
    console.error(`[${functionName}] request failed`, { message })
    return jsonResponse({ error: message }, status)
  }
})
