import { supabase } from "@/integrations/supabase/client";

export type ReportRange = {
  startDate: string;
  endDate: string;
};

export type ReportMetric = {
  total_requests: number;
  new_received_requests: number;
  active_repairs: number;
  completed_repairs: number;
  cancelled_requests: number;
  total_quoted_amount: number;
  average_quotation_amount: number;
};

export type ReportStatus = { status: string; count: number };
export type ReportDatePoint = { date: string; count: number };
export type ReportService = { service_name: string; count: number };
export type ReportTechnician = {
  technician_id: string;
  technician_name: string;
  active_repairs: number;
  completed_repairs: number;
};
export type ReportQuotations = {
  number_of_quotations: number;
  pending_customer_action: number;
  approved_quotations: number;
  declined_quotations: number;
  expired_quotations: number;
  total_quoted_amount: number;
  average_quoted_amount: number;
};

export type ReportsDashboard = {
  start_date: string;
  end_date: string;
  summary: ReportMetric;
  requests_by_status: ReportStatus[];
  requests_over_time: ReportDatePoint[];
  services: ReportService[];
  technician_workload: ReportTechnician[];
  quotations: ReportQuotations;
};

export async function getReportsDashboard(range: ReportRange) {
  const { data, error } = await supabase.rpc("get_reports_dashboard", {
    p_start_date: range.startDate,
    p_end_date: range.endDate,
  });

  if (error) throw new Error(error.message);
  const dashboard = data as ReportsDashboard;
  return {
    ...dashboard,
    requests_by_status: dashboard?.requests_by_status ?? [],
    requests_over_time: dashboard?.requests_over_time ?? [],
    services: dashboard?.services ?? [],
    technician_workload: dashboard?.technician_workload ?? [],
  };
}
