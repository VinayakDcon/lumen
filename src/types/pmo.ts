export type ProgramStatus = 'ACTIVE' | 'PLANNING' | 'RFQ_RESPONSE' | 'ON_HOLD' | 'CLOSED';

export interface Programme {
  id: string;
  name: string;
  customer?: string;
  programme_weeks: number;
  total_kits?: number | null;
  status: ProgramStatus;
  bu?: string;
  department?: string;
  portfolio_type?: 'ACTIVE' | 'RFQ' | '';
  kickoff_date?: string | null;
  sop_target?: string | null;
  scope_parts?: string[];
  markets?: string[];
  variants?: string[];
  template_id?: string;
  colour?: string;
  category?: string;
  activity_type?: string | null;
  objective?: string | null;
  sponsor_owner?: string | null;
  notes?: string;
  team_members?: string[];
  created_by?: string;
  created_at?: string;
}

export interface Person {
  id: string;
  name: string;
  email?: string;
  role?: string;
  avatar_color?: string;
  active?: number;
  resource_id?: string;
  capacity_pct?: number;
  allocated_hr?: number;
  department?: string;
  system_role?: string;
  weekly_target_hr?: number;
  billable_target_hr?: number;
  bau_target_hr?: number;
}

export interface Skill {
  id: number;
  name: string;
  category: string;
  description?: string;
}

export interface PersonSkill {
  person_id: string;
  skill_id: number;
  proficiency_level: 1 | 2 | 3 | 4 | 5; // 1: Novice, 5: Expert
}

export interface ProgrammeResource {
  id: number;
  programme_id: string;
  person_id: string;
  role_override?: string;
  level?: string;
  rate_per_hr: number;
  capacity_hr_per_wk: number;
  allocated_hr: number;
  cost: number;
}

export type TaskStatus = 'NOT STARTED' | 'IN PROGRESS' | 'DONE' | 'AT RISK' | 'DELAYED';

export interface TaskDoc {
  name: string;
  url: string;
  size?: string;
}

export interface Task {
  wbs: string;
  name: string;
  phase: string;
  part: string;
  discipline: string;
  weeks: number;
  plan_hr: number;
  actual_hr: number;
  blocked_hr: number;
  resources: string; // Comma separated IDs or names
  reviewer: string;
  status: TaskStatus;
  percent_complete: number;
  approval_status?: 'PENDING' | 'APPROVED' | 'REVISION_NEEDED' | 'REJECTED' | 'NOT_REQUIRED' | '';
  cost_inr?: number;
  level?: number; // 1, 2, or 3 representing WBS hierarchy depth
  updated_at?: string;
  programme_id: string;
  start_wk?: number;
  finish_wk?: number;
  wbs_sort?: string;
  effort_hr?: number;
  blocker_reason?: string;
  blocker_note?: string;
  docs?: TaskDoc[];
  deliverable?: string;
  notes?: string;
}

export interface User {
  id: string;
  username: string;
  name: string;
  email: string;
  role: string;
  last_login?: string;
  active: boolean;
  customer_company?: string;
  customer_programme_id?: string;
  avatar_color?: string;
  person_id?: string;
}

export interface Notification {
  id: number;
  kind: string;
  title: string;
  body?: string;
  read: boolean;
  link?: string;
  created_at: string;
}

export interface Archetype {
  archetype: string;
  label: string;
  description: string;
  typical_weeks: number;
  workstream_count: number;
  intent_kind: string;
}

export interface DashboardMetrics {
  avgPercentComplete: number;
  totalTasks: number;
  totalEffortHr: number;
  actualEffortHr: number;
  milestonesDone: number;
  milestonesPending: number;
  kitsShipped: number;
  kitsTotal?: number;
  risksOpen: number;
  byPhase: Array<{ phase: string; tasks_count: number; effort: number; avg_pct: number }>;
  byPart: Array<{ part: string; tasks_count: number; effort: number; avg_pct: number }>;
  byStatus: Array<{ status: TaskStatus; c: number }>;
}

export interface TimeEntry {
  id: number;
  wbs: string;
  person_id: string;
  person_name: string;
  hours: number;
  blocked_hours?: number;
  blocker_reason?: string;
  blocker_note?: string;
  entry_date: string; // YYYY-MM-DD
  note?: string;
  programme_id?: string;
  task_name?: string;
  discipline?: string;
}

export interface TimesheetSubmission {
  id: number;
  person_id: string;
  week_start_date: string; // Monday of the week
  status: 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED';
  total_hours: number;
  billable_hours: number;
  bau_hours: number;
  submitted_at?: string;
  approved_by?: string;
  approved_at?: string;
  rejection_notes?: string;
}

export interface ScurvePoint {
  week: number;
  weekly_hr: number;
  cumul_hr: number;
  cumul_cost: number;
}

export interface FollowUpTask {
  wbs: string;
  name: string;
  status: TaskStatus;
  part: string;
  finish_wk: number;
  updated_at?: string;
}

export interface DpdsDeliverable {
  id: number;
  programme_id: string;
  gate_code: string;
  deliverable_name: string;
  kind: 'DOC' | 'TASK' | 'DECISION' | 'DFMEA' | 'CHECKBOX';
  required: number;
  completed: number;
  completed_at?: string | null;
  completed_by?: string | null;
  carryover_from_programme_id?: string | null;
  carryover_note?: string | null;
  linked_doc_id?: number | null;
  linked_wbs?: string | null;
  linked_decision_id?: number | null;
  notes?: string | null;
}

export interface DpdsDmaic {
  id: number;
  programme_id: string;
  gate_code: string;
  dmaic_phase: 'D' | 'M' | 'A' | 'I' | 'C';
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'DONE' | 'CARRYOVER';
  notes?: string | null;
}

export interface DpdsGateInfo {
  code: string;
  name: string;
  start_wk: number;
  end_wk: number;
  colour: string;
  deliverables: DpdsDeliverable[];
  dmaic: DpdsDmaic[];
  readiness_pct: number;
  completed_count: number;
  total_count: number;
  required_count: number;
  required_completed: number;
  status: string;
}

export interface JourneyPhase {
  code: string;
  name: string;
  start_wk: number;
  end_wk: number;
  colour: string;
  avg_pct: number;
  tasks_count: number;
}

export interface JourneyMilestone {
  week: number;
  event: string;
  type: string;
  status: string;
  phase: string;
}

export interface JourneyData {
  programme: Programme;
  phases: JourneyPhase[];
  milestones: JourneyMilestone[];
  todayWk: number;
  weightedPct: number;
  scheduledPctAtToday: number;
  delta: number;
}

export interface CharterRisk {
  id: string;
  area: string;
  description: string;
  probability: string;
  impact: string;
  owner: string;
  status: string;
  mitigation: string;
}

export interface CharterData {
  programme: Programme;
  metrics: DashboardMetrics | null;
  journey: JourneyData | null;
  risks: CharterRisk[];
  team: Person[];
  pendingDeliverables: DpdsDeliverable[];
}

export interface EvmPoint {
  week: number;
  bcws: number;
  bcwp: number;
  acwp: number;
}

export interface EvmReport {
  todayWeek: number;
  totalBudget: number;
  bcws: number;
  bcwp: number;
  acwp: number;
  cv: number;
  sv: number;
  cpi: number;
  spi: number;
  eac: number;
  etc: number;
  series: EvmPoint[];
}

export interface HeatmapCell {
  wk: number;
  hr: number;
  util_pct: number;
  class: string;
}

export interface HeatmapRow {
  resource_id: string;
  name: string;
  capacity_hr_per_wk: number;
  cells: HeatmapCell[];
}

export interface HeatmapReport {
  programme_id: string;
  weeks: number;
  rows: HeatmapRow[];
}

export interface Milestone {
  id: number;
  programme_id: string;
  week: number;
  event: string;
  type: string | null; // e.g. '★ Key', '★★ Gate', 'Customer', 'Internal'
  phase: string | null;
  wbs_link: string | null;
  owner: string | null;
  status: 'PENDING' | 'AT RISK' | 'DONE';
  notes: string | null;
  customer_visible: number;
  updated_at?: string;
}

export interface KitAttachment {
  id: number;
  kit_number: number;
  kind: 'AWB' | 'RECEIPT' | 'POD' | 'INVOICE' | 'PHOTO' | 'OTHER';
  filename: string;
  original_name: string;
  mime_type: string;
  size_bytes: number;
  uploaded_by: string;
  uploaded_at: string;
  caption?: string;
}

export interface ConsignmentKit {
  kit_number: number;
  programme_id: string;
  kind: 'KIT' | 'SPARE';
  build_wk: number;
  ship_wk: number;
  ship_date: string | null;
  status: 'NOT STARTED' | 'BUILDING' | 'EOL TEST' | 'PACKED' | 'SHIPPED';
  eol_test_pass: number;
  imds_packet: number;
  invoice_sent: number;
  carrier?: string | null;
  awb_number?: string | null;
  tracking_url?: string | null;
  customs_status?: string | null; // 'PENDING', 'CLEARED', 'HOLD', 'DELIVERED'
  dispatched_at?: string | null;
  notes?: string | null;
  attachments?: KitAttachment[];
}

export interface Risk {
  id: string;
  programme_id: string;
  area: 'COMMERCIAL' | 'TECHNICAL' | 'SUPPLY' | 'SCHEDULE' | 'QUALITY' | 'SAFETY' | 'COST' | 'OTHER';
  description: string;
  probability: 'Low' | 'Med' | 'High';
  impact: 'Low' | 'Med' | 'High';
  owner: string;
  mitigation: string;
  target_close: string | null;
  status: 'OPEN' | 'MITIGATED' | 'CLOSED';
  notes: string | null;
}

export interface DfmeaItem {
  id: number;
  programme_id: string;
  item_code: string;
  function_or_part: string;
  failure_mode: string;
  effect: string;
  severity: number;
  cause: string;
  occurrence: number;
  prevention_control: string;
  detection_control: string;
  detection: number;
  rpn?: number; // severity * occurrence * detection
  action_recommended: string;
  action_owner: string;
  action_due_date: string | null;
  action_status: 'OPEN' | 'IN_PROGRESS' | 'CLOSED';
  revised_severity?: number | null;
  revised_occurrence?: number | null;
  revised_detection?: number | null;
  created_at?: string;
}

export interface ChangeRequest {
  id: number;
  programme_id: string;
  cr_code: string;
  title: string;
  raised_by: string;
  raised_at: string;
  description: string | null;
  type: 'DESIGN' | 'SPEC' | 'TIMELINE' | 'COST' | 'SCOPE';
  status: 'OPEN' | 'IN_REVIEW' | 'APPROVED' | 'REJECTED' | 'CLOSED';
  cost_impact_inr: number | null;
  timeline_impact_weeks: number | null;
  eval_due_at: string | null;
  eval_completed_at: string | null;
  decision_by: string | null;
  decision_at: string | null;
  decision_notes: string | null;
}

export interface CustomerComm {
  id: number;
  programme_id: string;
  comm_date: string;
  comm_type: 'CALL' | 'EMAIL' | 'MEETING' | 'VISIT';
  direction: 'IN' | 'OUT';
  subject: string;
  attendees: string | null;
  summary: string | null;
  action_items: string | null;
  sentiment: 'POSITIVE' | 'NEUTRAL' | 'CONCERNED';
  logged_by: string;
  logged_at: string;
  follow_up_date: string | null;
  status: string;
}

export interface Decision {
  id: number;
  programme_id: string;
  decision_code: string;
  title: string;
  decision_text: string | null;
  rationale: string | null;
  decided_by: string | null;
  decided_at: string | null;
  status: 'PROPOSED' | 'APPROVED' | 'REVISITED';
  attendees: string | null;
  linked_wbs: string | null;
  created_at: string;
}

export interface Meeting {
  id: number;
  programme_id: string;
  meeting_type: 'KICKOFF' | 'STATUS' | 'DESIGN_REVIEW' | 'DAILY';
  meeting_date: string;
  title: string;
  attendees: string | null;
  agenda: string | null;
  notes: string | null;
  action_items: string | null;
  next_meeting_date: string | null;
  logged_by: string;
  created_at: string;
}

export interface EmailQueueItem {
  id: number;
  to_email: string;
  cc_email: string | null;
  from_email: string;
  subject: string;
  body: string | null;
  kind: string | null;
  programme_id: string | null;
  queued_by: string | null;
  queued_at: string;
  sent_at: string | null;
  status: 'QUEUED' | 'SENT' | 'FAILED' | 'CANCELLED';
  error_msg: string | null;
}

export interface Vendor {
  id: number;
  vendor_code: string;
  name: string;
  category: 'TOOLING' | 'PCB_FAB' | 'PVD' | 'HARDCOAT' | 'SMT' | 'LAB_SUBOUT' | 'LOGISTICS' | string;
  country: string;
  city: string;
  contact_person: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  website: string | null;
  payment_terms: string | null;
  currency: string;
  bank_name: string | null;
  bank_account: string | null;
  ifsc_swift: string | null;
  gst_number: string | null;
  pan_number: string | null;
  address: string | null;
  capabilities: string | null;
  status: 'ACTIVE' | 'UNDER_REVIEW' | 'BLOCKED';
  performance_rating: number | null;
  notes: string | null;
  created_at?: string;
}

export interface Quote {
  id: number;
  quote_code: string;
  programme_id: string;
  title: string;
  description: string | null;
  category: string | null;
  target_decision_date: string | null;
  status: 'OPEN' | 'RECEIVED' | 'UNDER_EVAL' | 'SELECTED' | 'DECLINED';
  selected_vendor_id: number | null;
  raised_by: string;
  raised_at: string;
  decided_at?: string | null;
  decision_notes?: string | null;
}

export interface QuoteLine {
  id: number;
  quote_id: number;
  vendor_id: number;
  quoted_value: number;
  currency: string;
  lead_time_weeks: number | null;
  payment_terms: string | null;
  validity_until: string | null;
  technical_score: number | null;
  commercial_score: number | null;
  total_score: number | null;
  comments: string | null;
  attachment_filename: string | null;
  received_at: string | null;
  vendor_name?: string;
  vendor_country?: string;
}

export interface PurchaseOrder {
  id: number;
  po_number: string;
  programme_id: string;
  vendor_id: number;
  vendor: string;
  vendor_country: string | null;
  description: string | null;
  tool_id: number | null;
  value_inr: number;
  currency: string;
  raised_at: string;
  sent_at?: string | null;
  received_at?: string | null;
  invoiced_at?: string | null;
  paid_at?: string | null;
  advance_paid_inr: number;
  balance_paid_inr: number;
  status: 'RAISED' | 'SENT' | 'IN_FAB' | 'RECEIVED' | 'INVOICED' | 'PAID' | 'CANCELLED';
  payment_terms: string | null;
  raised_by: string;
  notes: string | null;
  created_at?: string;
}

export interface Invoice {
  id: number;
  invoice_number: string;
  vendor_id: number;
  programme_id: string;
  po_id: number | null;
  amount: number;
  currency: string;
  tax_amount: number;
  invoice_date: string;
  due_date: string | null;
  received_at: string;
  approved_by?: string | null;
  approved_at?: string | null;
  paid_at?: string | null;
  status: 'RECEIVED' | 'UNDER_REVIEW' | 'APPROVED' | 'PAID';
  filename?: string | null;
  description: string | null;
  notes: string | null;
  created_at?: string;
  vendor_name?: string;
  po_number?: string;
}

export interface Payment {
  id: number;
  invoice_id: number;
  vendor_id: number;
  programme_id: string;
  amount: number;
  currency: string;
  payment_date: string;
  payment_method: 'BANK_TRANSFER' | 'LC' | 'NEFT' | string;
  transaction_ref: string | null;
  approved_by: string | null;
  notes: string | null;
  created_at?: string;
  vendor_name?: string;
  invoice_number?: string;
}

export interface BudgetLine {
  id: number;
  programme_id: string;
  phase: string;
  category: string;
  line_item: string;
  planned_amount: number;
  committed_amount: number;
  actual_amount: number;
  currency: string;
  notes: string | null;
}

export interface ProjectDocument {
  id: number;
  programme_id: string;
  title: string;
  type: string;
  version: string;
  status: 'DRAFT' | 'REVIEW' | 'RELEASED' | 'OBSOLETE';
  author: string;
  reviewer: string | null;
  tags: string[];
  link_url: string | null;
  uploaded_at: string;
}

export interface Standard {
  id: number;
  programme_id: string;
  code: string;
  title: string;
  authority: string;
  market: string;
  version: string;
  applies_to: string;
  summary: string | null;
  tags: string[];
  link_url: string | null;
}

export interface ToolingPart {
  id: number;
  programme_id: string;
  tool_code: string;
  part_name: string;
  type: string;
  vendor: string;
  country: string;
  cost: number;
  currency: string;
  lead_time_wk: number;
  status: 'DESIGN' | 'FABRICATION' | 'T1_TRIAL' | 'T2_TRIAL' | 'RELEASED';
  location: string;
  owner: string;
  notes: string | null;
}

export interface LabEquipment {
  id: number;
  name: string;
  type: string;
  capacity: string;
  rate_per_hr: number;
  currency: string;
  location: string;
  status: 'AVAILABLE' | 'MAINTENANCE' | 'DECOMMISSIONED';
  notes: string | null;
}

export interface LabBooking {
  id: number;
  equipment_id: number;
  programme_id: string;
  start_date: string;
  end_date: string;
  booked_by: string;
  purpose: string;
  status: 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';
  created_at?: string;
}

