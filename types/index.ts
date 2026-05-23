// ============================================================
// GenXdigitizing — Complete TypeScript Types
// ============================================================

// ── Enums ────────────────────────────────────────────────────

export type UserRole     = "admin" | "crm" | "client" | "designer";
export type OrderStatus  = "submitted" | "assigned" | "in_progress" | "review" | "approved" | "delivered" | "revision" | "refunded" | "cancelled";
export type ServiceType  = "digitizing_standard" | "digitizing_large" | "digitizing_jumbo" | "vector_basic" | "vector_standard" | "vector_complex" | "sewout_standard" | "sewout_large" | "sewout_jumbo";
export type ServiceCategory = "digitizing" | "vector" | "sewout";
export type OutputFormat = "DST" | "PES" | "EMB" | "JEF" | "XXX" | "VIP" | "HUS" | "EXP" | "VP3" | "SEW";
export type ClientTier   = "new" | "active" | "vip";
export type Priority     = "low" | "medium" | "high";
export type PayStatus    = "pending" | "paid" | "refunded" | "failed";
export type LeadStage    = "lead" | "contacted" | "quote_sent" | "negotiation" | "won" | "lost";
export type NotifType    = "order_update" | "message" | "payment" | "system" | "sla_warning" | "review";
export type FileType     = "artwork" | "output" | "revision";
export type Turnaround   = "standard" | "rush" | "urgent";

// ── Core Entities ─────────────────────────────────────────────

export interface User {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string | null;
  role: UserRole;
  is_active: boolean;
  last_sign_in?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Client {
  id: string;
  user_id: string;
  company_name: string;
  country: string;
  phone?: string | null;
  address?: string | null;
  tier: ClientTier;
  ltv: number;
  credit_balance: number;
  notes?: string | null;
  joined_at: string;
  updated_at: string;
  // Joined
  user?: User;
  _order_count?: number;
}

export interface Designer {
  id: string;
  user_id: string;
  avg_turnaround_h: number;
  avg_rating: number;
  revision_rate: number;
  total_orders: number;
  completed_orders: number;
  specialties?: string[] | null;
  payoneer_id?: string | null;
  updated_at: string;
  // Joined
  user?: User;
}

export interface ServiceTier {
  id: string;           // e.g. "digitizing_standard"
  category: ServiceCategory;
  label: string;        // e.g. "Standard Design"
  size_desc: string;    // e.g. "4″–8″"
  price: number;        // editable by admin
  est_hours: string;    // e.g. "12–24h"
  is_big_design: boolean;
  is_active: boolean;
  sort_order: number;
  updated_at: string;
}

export interface Order {
  id: string;
  order_number: string;
  client_id: string;
  designer_id?: string | null;
  service_tier_id: string;
  output_format: OutputFormat;
  additional_formats?: OutputFormat[] | null;
  turnaround: Turnaround;
  status: OrderStatus;
  priority: Priority;
  width_inches?: number | null;
  height_inches?: number | null;
  stitch_count?: number | null;
  color_count?: number | null;
  placement_notes?: string | null;
  admin_notes?: string | null;
  price: number;
  currency: string;
  sla_deadline?: string | null;
  assigned_at?: string | null;
  in_progress_at?: string | null;
  completed_at?: string | null;
  delivered_at?: string | null;
  created_at: string;
  updated_at: string;
  // Joined
  client?: Client;
  designer?: Designer;
  service_tier?: ServiceTier;
  files?: OrderFile[];
  invoice?: Invoice;
  review?: Review;
}

export interface OrderFile {
  id: string;
  order_id: string;
  file_url: string;
  file_name: string;
  file_type: FileType;
  format?: OutputFormat | null;
  stitch_count?: number | null;
  file_size_kb?: number | null;
  version: number;
  uploaded_by: string;
  notes?: string | null;
  created_at: string;
  uploader?: User;
}

export interface Invoice {
  id: string;
  invoice_number: string;
  order_id: string;
  client_id: string;
  amount: number;
  currency: string;
  status: PayStatus;
  payoneer_ref?: string | null;
  payoneer_checkout_url?: string | null;
  pdf_url?: string | null;
  paid_at?: string | null;
  due_at?: string | null;
  created_at: string;
  updated_at: string;
  order?: Order;
  client?: Client;
}

export interface OrderEditLog {
  id: string;
  order_id: string;
  changed_by: string;
  field_name: string;
  old_value?: string | null;
  new_value?: string | null;
  reviewed_by_admin: boolean;
  reviewed_by?: string | null;
  reviewed_at?: string | null;
  created_at: string;
  changer?: User;
  reviewer?: User;
}

export interface Review {
  id: string;
  order_id: string;
  client_id: string;
  stars: 1 | 2 | 3 | 4 | 5;
  text?: string | null;
  is_published: boolean;
  created_at: string;
  order?: Order;
  client?: Client;
}

export interface Message {
  id: string;
  from_user: string;
  to_user: string;
  order_id?: string | null;
  subject?: string | null;
  body: string;
  file_url?: string | null;
  is_read: boolean;
  read_at?: string | null;
  created_at: string;
  sender?: User;
  recipient?: User;
  order?: Order;
}

export interface CrmLead {
  id: string;
  contact_name: string;
  email: string;
  company?: string | null;
  phone?: string | null;
  country?: string | null;
  stage: LeadStage;
  deal_value?: number | null;
  assigned_to?: string | null;
  follow_up_at?: string | null;
  lost_reason?: string | null;
  notes?: string | null;
  source?: string | null;
  created_at: string;
  updated_at: string;
  assignee?: User;
}

export interface Notification {
  id: string;
  user_id: string;
  type: NotifType;
  title: string;
  body: string;
  action_url?: string | null;
  is_read: boolean;
  read_at?: string | null;
  created_at: string;
}

export interface AuditLog {
  id: string;
  user_id?: string | null;
  action: string;
  entity: string;
  entity_id?: string | null;
  old_data?: Record<string, unknown> | null;
  new_data?: Record<string, unknown> | null;
  ip_address?: string | null;
  user_agent?: string | null;
  created_at: string;
  user?: User;
}

// ── Pricing config (stored in DB, editable by admin) ─────────

export interface PricingConfig {
  [serviceId: string]: {
    label: string;
    category: ServiceCategory;
    emoji: string;
    color: string;
    gradient: string;
    tiers: {
      id: string;
      label: string;
      size: string;
      price: number;
      est: string;
      isBigDesign: boolean;
    }[];
  };
}

// ── Dashboard stats ──────────────────────────────────────────

export interface AdminDashStats {
  orders_mtd: number;
  orders_prev_month: number;
  revenue_mtd: number;
  revenue_prev_month: number;
  active_clients: number;
  pending_orders: number;
  in_progress_orders: number;
  avg_turnaround_h: number;
  avg_rating: number;
  total_reviews: number;
}

export interface MonthlyRevenue {
  month: string;       // "Jan", "Feb", etc.
  year: number;
  revenue: number;
  orders: number;
}

export interface ServiceBreakdown {
  service_tier_id: string;
  label: string;
  count: number;
  revenue: number;
  pct: number;
}

// ── API request/response payloads ────────────────────────────

export interface CreateOrderPayload {
  service_tier_id: string;
  output_format: OutputFormat;
  additional_formats?: OutputFormat[];
  turnaround: Turnaround;
  width_inches?: number;
  height_inches?: number;
  color_count?: number;
  placement_notes?: string;
  artwork_file_url: string;  // uploaded to Storage before calling API
  artwork_file_name: string;
}

export interface AssignDesignerPayload {
  order_id: string;
  designer_id: string;
  priority?: Priority;
}

export interface UpdateOrderStatusPayload {
  order_id: string;
  status: OrderStatus;
  admin_notes?: string;
  stitch_count?: number;
}

export interface UploadOutputPayload {
  order_id: string;
  file_url: string;
  file_name: string;
  format: OutputFormat;
  stitch_count: number;
  notes?: string;
  version: number;
}

export interface SubmitReviewPayload {
  order_id: string;
  stars: 1 | 2 | 3 | 4 | 5;
  text?: string;
}

export interface UpdatePricingPayload {
  service_tier_id: string;
  price: number;
}

// ── Payoneer webhook ─────────────────────────────────────────

export interface PayoneerWebhookPayload {
  event_type: string;
  payment_id: string;
  order_id: string;
  amount: number;
  currency: string;
  status: string;
  timestamp: string;
  metadata?: Record<string, string>;
}

// ── Auth ─────────────────────────────────────────────────────

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
  full_name: string;
  avatar_url?: string | null;
  client_id?: string;    // set if role === 'client'
  designer_id?: string;  // set if role === 'designer'
}

// ── Free Designs ─────────────────────────────────────────────

export interface FreeDesignImage {
  id?: string;
  url: string;
  thumbnailUrl?: string;
  blurhash?: string;
  alt?: string;
  width?: number;
  height?: number;
  sortOrder: number;
}

export interface FreeDesign {
  id: string;
  title: string;
  slug: string;
  description: string;
  stitchCount: number;
  colors: number;
  designSize: string;
  formats: string[];
  machines: string[];
  downloadUrl?: string | null;
  downloadCount: number;
  featured: boolean;
  visible: boolean;
  sortOrder: number;
  images: FreeDesignImage[];
  createdAt?: string;
  updatedAt?: string;
}

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];
