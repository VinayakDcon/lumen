/**
 * Frontend Role-Based Access Control (RBAC) Configuration
 * Mirrors backend rolesConfig.js — update both together when roles change.
 */

// ─── Tab → Route mapping ───────────────────────────────────────────────────
export const ROUTE_TO_TAB: Record<string, string> = {
  "/portfolio":              "programmes",
  "/templates":              "templates",
  "/":                       "dashboard",
  "/programme/charter":      "charter",
  "/programme/journey":      "journey",
  "/programme/dpds":         "dpds",
  "/programme/wbs":          "wbs",
  "/programme/gantt":        "gantt",
  "/programme/kanban":       "kanban",
  "/track/reports":          "reports",
  "/track/heatmap":          "heatmap",
  "/track/approvals":        "approvals",
  "/track/audit":            "audit",
  "/deliver/deliverables":   "deliverables",
  "/deliver/milestones":     "milestones",
  "/deliver/shipments":      "consignment",
  "/deliver/risks":          "risks",
  "/deliver/dfmea":          "dfmea",
  "/deliver/changes":        "changes",
  "/deliver/custcomms":      "custcomms",
  "/records/decisions":      "decisions",
  "/records/meetings":       "meetings",
  "/records/emails":         "emails",
  "/library/documents":      "documents",
  "/library/standards":      "standards",
  "/library/tooling":        "tooling",
  "/library/lab":            "lab",
  "/manage/team":            "team",
  "/manage/skills":          "skills",
  "/manage/resources":       "resources",
  "/manage/users":           "users",
  "/timesheet/mine":         "my-timesheet",
  "/timesheet/team":         "timesheet",
  "/timesheet/approvals":    "approvals-ts",
  "/timesheet/resources":    "resource-utilization",
  "/timesheet/analytics":    "hours-analytics",
};

// ─── Role → Allowed tabs ───────────────────────────────────────────────────
const ALL_TABS = "ALL" as const;

const ROLE_TABS: Record<string, string[] | typeof ALL_TABS> = {
  ADMIN: ALL_TABS,
  PMO:   ALL_TABS,
  PM:    ALL_TABS, // legacy

  PROJECT_MANAGER: [
    "programmes", "templates",
    "dashboard", "charter", "journey", "dpds", "wbs", "gantt", "kanban",
    "reports", "heatmap", "approvals", "audit",
    "deliverables", "milestones", "consignment", "risks", "dfmea", "changes", "custcomms",
    "decisions", "meetings", "emails",
    "documents", "standards", "tooling", "lab",
    "team", "skills", "resources", "users",
    "my-timesheet", "timesheet", "approvals-ts", "resource-utilization",
  ],

  OPTICS_LEAD: [
    "programmes",
    "dashboard", "wbs", "gantt", "kanban",
    "deliverables", "milestones", "risks", "dfmea",
    "documents", "standards", "lab",
    "skills", "resources",
    "my-timesheet", "timesheet", "approvals-ts", "resource-utilization",
  ],

  MECHANICAL_LEAD: [
    "programmes",
    "dashboard", "wbs", "gantt", "kanban",
    "deliverables", "milestones", "risks", "dfmea",
    "documents", "standards", "lab",
    "skills", "resources",
    "my-timesheet", "timesheet", "approvals-ts", "resource-utilization",
  ],

  ELECTRONICS_LEAD: [
    "programmes",
    "dashboard", "wbs", "gantt", "kanban",
    "deliverables", "milestones", "risks", "dfmea",
    "documents", "standards", "lab",
    "skills", "resources",
    "my-timesheet", "timesheet", "approvals-ts", "resource-utilization",
  ],

  SOFTWARE_LEAD: [
    "programmes",
    "dashboard", "wbs", "gantt", "kanban",
    "deliverables", "milestones", "risks", "dfmea",
    "documents", "standards", "lab",
    "skills", "resources",
    "my-timesheet", "timesheet", "approvals-ts", "resource-utilization",
  ],

  TEAM_LEAD: [
    "programmes",
    "dashboard", "charter", "journey", "dpds", "wbs", "gantt", "kanban",
    "reports", "heatmap", "approvals",
    "deliverables", "milestones", "risks", "dfmea", "changes",
    "decisions", "meetings",
    "documents", "standards", "tooling", "lab",
    "skills", "resources",
    "my-timesheet", "timesheet", "approvals-ts", "resource-utilization",
  ],

  ENGINEER: [
    "programmes", "dashboard", "wbs", "gantt", "kanban",
    "my-timesheet", "deliverables", "risks", "documents", "standards", "lab",
  ],

  INTERN_SUPPORT_ENGINEER: [
    "programmes", "dashboard", "wbs", "gantt", "kanban",
    "my-timesheet", "deliverables", "risks", "documents", "standards", "lab",
  ],

  BUSINESS_DEVELOPMENT_EXECUTIVE: [
    "programmes", "dashboard", "wbs", "gantt", "kanban",
    "my-timesheet", "deliverables", "milestones", "risks", "documents", "standards", "lab",
  ],

  CUSTOMER: [
    "dashboard", "charter", "journey", "milestones", "consignment", "documents",
  ],

  // Legacy roles
  BU1HEAD: [
    "programmes", "my-timesheet", "timesheet",
    "dashboard", "charter", "journey",
    "reports", "heatmap", "approvals",
    "deliverables", "milestones", "consignment", "risks", "custcomms",
    "decisions", "meetings",
  ],
  BU2HEAD: [
    "programmes", "my-timesheet", "timesheet",
    "dashboard", "charter", "journey", "dpds",
    "heatmap", "reports",
    "deliverables", "milestones", "risks",
    "decisions", "resources",
  ],
  BU3HEAD: [
    "programmes", "my-timesheet", "timesheet",
    "dashboard", "charter", "journey",
    "heatmap",
    "milestones", "risks", "custcomms",
    "resources",
  ],
  DESIGN_LEAD: [
    "programmes", "my-timesheet", "timesheet",
    "dashboard", "wbs", "gantt",
    "heatmap",
    "deliverables", "milestones", "risks",
    "resources",
  ],
  ELECTRICAL_LEAD: [
    "programmes", "my-timesheet", "timesheet",
    "dashboard", "wbs", "gantt",
    "heatmap",
    "deliverables", "milestones", "risks",
    "resources",
  ],
  PROCUREMENT_LEAD: [
    "programmes", "my-timesheet", "timesheet",
    "dashboard", "wbs", "gantt",
    "heatmap",
    "deliverables", "milestones", "risks",
    "resources",
  ],
  LEAD: [
    "programmes", "my-timesheet", "timesheet",
    "dashboard", "wbs", "gantt",
    "heatmap",
    "deliverables", "milestones", "risks",
    "resources",
  ],
};

// ─── Roles that can EDIT (create/update/delete) content ───────────────────
// Engineers and below are read-only on most sections (except own timesheet)
const EDIT_ROLES = new Set([
  "ADMIN", "PMO", "PM",
  "PROJECT_MANAGER",
  "OPTICS_LEAD", "MECHANICAL_LEAD", "ELECTRONICS_LEAD", "SOFTWARE_LEAD",
  "TEAM_LEAD",
  "BU1HEAD", "BU2HEAD", "BU3HEAD",
  "DESIGN_LEAD", "ELECTRICAL_LEAD", "PROCUREMENT_LEAD", "LEAD",
]);

// Roles that can create / manage Programmes
const PROGRAMME_ADMIN_ROLES = new Set(["ADMIN", "PMO", "PM"]);

// Roles that can manage Users & Team (add people)
const TEAM_ADMIN_ROLES = new Set(["ADMIN", "PMO", "PROJECT_MANAGER"]);

// ─── Public API ────────────────────────────────────────────────────────────

/**
 * Check if a role is allowed to view a given route.
 * @param role  - user.role from store
 * @param route - pathname, e.g. "/programme/kanban"
 */
export function canAccessRoute(role: string | undefined, route: string): boolean {
  if (!role) return false;
  const tabs = ROLE_TABS[role];
  if (!tabs) return false; // unknown role → deny
  if (tabs === ALL_TABS) return true;
  const tab = ROUTE_TO_TAB[route];
  if (!tab) return true; // unmapped routes are open (e.g., /api, /auth)
  return tabs.includes(tab);
}

/**
 * Check if a role has edit/create/delete access (not read-only).
 */
export function canEdit(role: string | undefined): boolean {
  if (!role) return false;
  return EDIT_ROLES.has(role);
}

/**
 * BDE-specific: can add/edit tasks assigned to them specifically.
 * Engineers are purely read-only. BDE can write their own tasks.
 */
export function canEditOwnTasks(role: string | undefined): boolean {
  if (!role) return false;
  return role === "BUSINESS_DEVELOPMENT_EXECUTIVE" || canEdit(role);
}

/** Whether this role can create / delete programmes. */
export function canManageProgrammes(role: string | undefined): boolean {
  if (!role) return false;
  return PROGRAMME_ADMIN_ROLES.has(role);
}

/** Whether this role can add people to the global team. */
export function canManageTeam(role: string | undefined): boolean {
  if (!role) return false;
  return TEAM_ADMIN_ROLES.has(role);
}

/** Convenience: returns true for purely view-only roles. */
export function isReadOnly(role: string | undefined): boolean {
  return !canEdit(role);
}

/** Human-readable role name. */
export const ROLE_DISPLAY: Record<string, string> = {
  ADMIN: "Administrator",
  PMO: "Project Management Office",
  PROJECT_MANAGER: "Project Manager",
  OPTICS_LEAD: "Optics Lead",
  MECHANICAL_LEAD: "Mechanical Lead",
  ELECTRONICS_LEAD: "Electronics Lead",
  SOFTWARE_LEAD: "Software Lead",
  TEAM_LEAD: "Team Lead",
  ENGINEER: "Engineer",
  INTERN_SUPPORT_ENGINEER: "Intern Support Engineer",
  BUSINESS_DEVELOPMENT_EXECUTIVE: "Business Development Executive",
  CUSTOMER: "Customer",
  PM: "Project Manager (Legacy)",
  BU1HEAD: "Business Unit 1 Head",
  BU2HEAD: "Business Unit 2 Head",
  BU3HEAD: "Business Unit 3 Head",
  DESIGN_LEAD: "Design Lead",
  ELECTRICAL_LEAD: "Electrical Lead",
  PROCUREMENT_LEAD: "Procurement Lead",
  LEAD: "Lead",
};
