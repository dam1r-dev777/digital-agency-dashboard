export type ActStatus =
  | "NOT_SENT"
  | "AWAITING_SIGNATURE"
  | "CLOSED"
  | "REQUIRES_ATTENTION";

export interface Act {
  id: string;
  payment_id: string;
  is_sent: boolean;
  sent_at: string | null;
  is_signed: boolean;
  signed_at: string | null;
  manager_comment: string | null;
  status: ActStatus;
}

export interface Payment {
  id: string;
  project_id: string;
  client_id: string;
  client_name: string | null;
  payment_date: string;
  amount: string;
  payment_purpose: string | null;
  service_stage: string | null;
  act: Act | null;
}

export interface PaymentListResponse {
  items: Payment[];
  total: number;
  page: number;
  size: number;
  pages: number;
}

export interface StatusBreakdown {
  NOT_SENT: number;
  AWAITING_SIGNATURE: number;
  CLOSED: number;
  REQUIRES_ATTENTION: number;
}

export interface DashboardSummary {
  total_payments: number;
  total_amount: string;
  amount_by_status: Record<ActStatus, string>;
  count_by_status: StatusBreakdown;
  requires_attention_count: number;
}

export interface Project {
  id: string;
  name: string;
  status: "active" | "paused" | "completed";
  total_payments: number;
  total_amount_paid: number;
  acts_sent: number;
  acts_signed: number;
}
