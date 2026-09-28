import { supabase } from "@/integrations/supabase/client";

export const serviceCategories = [
  "Diagnostics",
  "Laptop Repair",
  "Desktop / PC Repair",
  "Hardware Upgrade",
  "Cleaning & Maintenance",
  "Software & OS Support",
  "Data Recovery",
  "Custom PC Services",
] as const;

export type ServiceCategory = (typeof serviceCategories)[number];

export type ServiceCatalogItem = {
  id: string;
  name: string;
  category: string;
  description: string | null;
  starting_price: number;
  estimated_time: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by: string | null;
};

type ServiceInput = {
  name: string;
  category: string;
  description: string | null;
  starting_price: number;
  estimated_time: string | null;
};

const serviceFields = "id, name, category, description, starting_price, estimated_time, is_active, created_at, updated_at, created_by";

function normalizeService(item: ServiceCatalogItem) {
  return { ...item, starting_price: Number(item.starting_price) };
}

export async function listServices() {
  const { data, error } = await supabase
    .from("service_catalog")
    .select(serviceFields)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data as ServiceCatalogItem[]).map(normalizeService);
}

export async function listActiveServices() {
  const { data, error } = await supabase
    .from("service_catalog")
    .select(serviceFields)
    .eq("is_active", true)
    .order("name", { ascending: true });

  if (error) throw new Error(error.message);
  return (data as ServiceCatalogItem[]).map(normalizeService);
}

export async function createService(input: ServiceInput, createdBy: string | null) {
  const { data, error } = await supabase
    .from("service_catalog")
    .insert({ ...input, created_by: createdBy })
    .select(serviceFields)
    .single();

  if (error) throw new Error(error.message);
  return normalizeService(data as ServiceCatalogItem);
}

export async function updateService(id: string, input: ServiceInput & { is_active: boolean }) {
  const { data, error } = await supabase
    .from("service_catalog")
    .update(input)
    .eq("id", id)
    .select(serviceFields)
    .single();

  if (error) throw new Error(error.message);
  return normalizeService(data as ServiceCatalogItem);
}

export async function setServiceStatus(id: string, isActive: boolean) {
  const { data, error } = await supabase
    .from("service_catalog")
    .update({ is_active: isActive })
    .eq("id", id)
    .select(serviceFields)
    .single();

  if (error) throw new Error(error.message);
  return normalizeService(data as ServiceCatalogItem);
}

export async function deleteService(id: string) {
  const { error } = await supabase.from("service_catalog").delete().eq("id", id);
  if (error) throw new Error(error.message);
}
