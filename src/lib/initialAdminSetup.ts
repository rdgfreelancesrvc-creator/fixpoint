import { supabase } from "@/integrations/supabase/client";

export type InitialAdminProfile = {
  id: string;
  full_name: string;
  email: string;
  role: "admin";
  is_active: true;
  created_at: string;
  updated_at: string;
};

type SetupResponse = {
  available?: boolean;
  profile?: InitialAdminProfile;
};

async function invokeSetup(body: Record<string, unknown>) {
  const { data, error } = await supabase.functions.invoke("initial-admin-setup", { body });
  if (error) {
    const context = "context" in error ? error.context : undefined;
    if (context instanceof Response) {
      const responseBody = await context.json().catch(() => null) as { error?: string } | null;
      throw new Error(responseBody?.error || error.message || "The setup request could not be completed.");
    }
    throw new Error(error.message || "The setup request could not be completed.");
  }
  if (!data || typeof data !== "object") throw new Error("The setup request returned an invalid response.");
  return data as SetupResponse;
}

export async function getInitialAdminSetupStatus() {
  const data = await invokeSetup({ action: "status" });
  return data.available === true;
}

export async function createInitialAdmin(fullName: string, email: string) {
  const data = await invokeSetup({
    action: "create",
    full_name: fullName,
    email,
    redirect_to: `${window.location.origin}/setup/complete`,
  });

  if (!data.profile) throw new Error("The setup request returned an incomplete account.");
  return data.profile;
}
