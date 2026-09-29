import { supabase } from "@/integrations/supabase/client";

export type PublicServiceRequestInput = {
  full_name: string;
  email: string | null;
  phone: string;
  preferred_contact: string;
  device_type: string;
  brand: string;
  model: string | null;
  serial_number: string | null;
  service_id: string;
  problem_description: string;
  contact_preference: string;
};

export type AttachmentFailure = {
  fileName: string;
  message: string;
};

export type PublicServiceRequestResult = {
  request: {
    request_number: string;
  };
  attachmentErrors: AttachmentFailure[];
};

export async function submitPublicServiceRequest(input: PublicServiceRequestInput, files: File[]) {
  const formData = new FormData();
  formData.append("payload", JSON.stringify(input));
  files.forEach((file) => formData.append("files", file, file.name));

  const { data, error } = await supabase.functions.invoke("submit-service-request", {
    body: formData,
  });

  if (error || !data?.request?.request_number) {
    throw new Error("We couldn't submit your request. Please check your information and try again.");
  }

  return data as PublicServiceRequestResult;
}
