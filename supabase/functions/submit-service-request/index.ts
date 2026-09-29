import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0"

const functionName = "submit-service-request"
const bucketName = "service-request-attachments"
const maxFiles = 5
const maxFileSize = 10 * 1024 * 1024
const allowedTypes = new Set(["image/jpeg", "image/png", "application/pdf"])
const allowedExtensions: Record<string, string[]> = {
  "image/jpeg": ["jpg", "jpeg"],
  "image/png": ["png"],
  "application/pdf": ["pdf"],
}
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

type AttachmentFailure = {
  fileName: string
  message: string
}

type RequestResult = {
  id: string
  request_number: string
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  })
}

function safeFileName(name: string) {
  const cleaned = name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 120)
  return cleaned || "attachment"
}

function validateFile(file: File) {
  const extension = file.name.toLowerCase().split(".").pop() ?? ""
  if (!allowedTypes.has(file.type) || !allowedExtensions[file.type]?.includes(extension)) throw new Error("This file type is not supported.")
  if (file.size <= 0 || file.size > maxFileSize) throw new Error("Files must be smaller than 10 MB.")
}

async function handleRequest(request: Request) {
  const formData = await request.formData()
  const payloadValue = formData.get("payload")
  if (typeof payloadValue !== "string") throw new Error("The request details are missing.")

  let payload: Record<string, unknown>
  try {
    const parsed = JSON.parse(payloadValue)
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("Invalid payload")
    payload = parsed as Record<string, unknown>
  } catch {
    throw new Error("The request details are invalid.")
  }

  const files = formData.getAll("files").filter((value): value is File => value instanceof File)
  if (files.length > maxFiles) throw new Error("You can attach up to 5 files.")
  for (const file of files) validateFile(file)

  const { data, error } = await supabaseAdmin.rpc("create_public_service_request", { p_payload: payload })
  if (error || !data) {
    console.error(`[${functionName}] database submission failed`, { error: error?.message })
    throw new Error("The request could not be saved.")
  }

  const rpcResult = data as RequestResult
  const result: RequestResult = { id: rpcResult.id, request_number: rpcResult.request_number }
  const attachmentErrors: AttachmentFailure[] = []

  for (const file of files) {
    const fileName = safeFileName(file.name)
    const storagePath = `${result.id}/${crypto.randomUUID()}-${fileName}`
    const { error: uploadError } = await supabaseAdmin.storage
      .from(bucketName)
      .upload(storagePath, file, { contentType: file.type, upsert: false })

    if (uploadError) {
      console.error(`[${functionName}] attachment upload failed`, { requestId: result.id, fileName, error: uploadError.message })
      attachmentErrors.push({ fileName: file.name, message: "The file could not be uploaded." })
      continue
    }

    const { error: metadataError } = await supabaseAdmin
      .from("service_request_attachments")
      .insert({
        service_request_id: result.id,
        file_name: file.name,
        storage_path: storagePath,
        content_type: file.type,
        file_size: file.size,
      })

    if (metadataError) {
      await supabaseAdmin.storage.from(bucketName).remove([storagePath])
      console.error(`[${functionName}] attachment metadata failed`, { requestId: result.id, fileName, error: metadataError.message })
      attachmentErrors.push({ fileName: file.name, message: "The file could not be saved." })
    }
  }

  const { error: notificationError } = await supabaseAdmin.functions.invoke("notification-worker", {
    body: { action: "process" },
  })
  if (notificationError) console.error(`[${functionName}] notification processing failed`, { error: notificationError.message })

  console.info(`[${functionName}] request submitted`, { requestId: result.id, requestNumber: result.request_number, attachmentFailures: attachmentErrors.length })
  return jsonResponse({ request: { request_number: result.request_number }, attachmentErrors }, 201)
}

serve(async (request) => {
  if (request.method === "OPTIONS") return new Response(null, { headers: corsHeaders })
  if (request.method !== "POST") return jsonResponse({ error: "Method not allowed." }, 405)

  try {
    return await handleRequest(request)
  } catch (error) {
    const message = error instanceof Error ? error.message : "The request could not be completed."
    console.error(`[${functionName}] request failed`, { message })
    return jsonResponse({ error: message }, 400)
  }
})

export {}
