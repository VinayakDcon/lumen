import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { usePmoStore, mockArchetypes } from "@/store/use-pmo-store";
import { Programme, DashboardMetrics, Archetype, ScurvePoint, FollowUpTask, CharterData, JourneyData, DpdsGateInfo, Task, EvmReport, HeatmapReport, Milestone, ConsignmentKit, Risk, DfmeaItem, ChangeRequest, CustomerComm, Decision, Meeting, EmailQueueItem, Vendor, Quote, QuoteLine, PurchaseOrder, Invoice, Payment, BudgetLine, ProjectDocument, Standard, ToolingPart, LabEquipment, LabBooking, User, Person, Skill, PersonSkill, ProgrammeResource, TimeEntry } from "@/types/pmo";

// Mock delay to simulate network latency
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export function useProgrammesQuery() {
  const email = usePmoStore((state) => state.user?.email);
  return useQuery<Programme[]>({
    queryKey: ["programmes", email],
    queryFn: async () => {
      const res = await fetch(`/api-proxy/programmes?email=${encodeURIComponent(email || '')}`);
      if (!res.ok) throw new Error("Failed to fetch programmes");
      const list: Programme[] = await res.json();
      return list;
    },
  });
}

export function useActiveProgrammeQuery(id: string) {
  const { data: programmes } = useProgrammesQuery();
  return useQuery<Programme | null>({
    queryKey: ["programme", id],
    queryFn: async () => {
      if (!id) return null;
      try {
        const res = await fetch(`/api-proxy/programmes/${id}`);
        if (res.ok) return await res.json();
      } catch (e) {
        console.error("Error fetching single programme:", e);
      }
      return programmes?.find(p => p.id === id) || null;
    },
    initialData: () => programmes?.find(p => p.id === id) || null,
    enabled: !!id,
  });
}

export function useDashboardMetricsQuery(id: string) {
  return useQuery<DashboardMetrics | null>({
    queryKey: ["dashboard", id],
    queryFn: async () => {
      const res = await fetch(`/api-proxy/dashboard?programme_id=${id}`);
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
    enabled: !!id,
  });
}

export function useTemplatesQuery() {
  return useQuery<Archetype[]>({
    queryKey: ["templates"],
    queryFn: async () => {
      const res = await fetch("/api-proxy/templates/library");
      if (!res.ok) throw new Error("Failed to fetch templates");
      return res.json();
    },
  });
}

export function useScurveQuery(id: string) {
  return useQuery<ScurvePoint[]>({
    queryKey: ["scurve", id],
    queryFn: async () => {
      const res = await fetch(`/api-proxy/tasks/scurve?programme_id=${id}`);
      if (!res.ok) throw new Error("Failed to fetch scurve");
      return res.json();
    },
    enabled: !!id,
  });
}

export function useFollowUpQuery(id: string) {
  const email = usePmoStore((state) => state.user?.email);
  return useQuery<FollowUpTask[]>({
    queryKey: ["followup", id, email],
    queryFn: async () => {
      const res = await fetch(`/api-proxy/tasks/follow-up?programme_id=${id}&email=${encodeURIComponent(email || '')}`);
      if (!res.ok) throw new Error("Failed to fetch follow-ups");
      return res.json();
    },
    enabled: !!id,
  });
}

export function useCharterQuery(id: string) {
  return useQuery<CharterData | null>({
    queryKey: ["charter", id],
    queryFn: async () => {
      const res = await fetch(`/api-proxy/programmes/${id}/charter`);
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
    enabled: !!id,
  });
}


export function useJourneyQuery(id: string) {
  return useQuery<JourneyData | null>({
    queryKey: ["journey", id],
    queryFn: async () => {
      const res = await fetch(`/api-proxy/journey?programme_id=${id}`);
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
    enabled: !!id,
  });
}

export function useDpdsGatesQuery(id: string) {
  return useQuery<Record<string, DpdsGateInfo>>({
    queryKey: ["dpdsGates", id],
    queryFn: async () => {
      const res = await fetch(`/api-proxy/dpds/gates?programme_id=${id}`);
      if (!res.ok) throw new Error("Failed to fetch DPDS gates");
      return res.json();
    },
    enabled: !!id,
  });
}

export function useTasksQuery(id: string) {
  const setTasks = usePmoStore((state) => state.setTasks);
  
  return useQuery<Task[]>({
    queryKey: ["tasks", id],
    queryFn: async () => {
      const res = await fetch(`/api-proxy/tasks/programme/${id}`);
      if (!res.ok) throw new Error("Failed to fetch tasks");
      const data = await res.json();
      const normalized = data.map((t: any) => ({
        ...t,
        blocked_hr: t.blocked_hr !== undefined ? t.blocked_hr : (t.blocked_hours || 0)
      }));
      setTasks(normalized, id);
      return normalized;
    },
    enabled: !!id,
  });
}

export function useEvmReportQuery(id: string, week?: number) {
  const getEvmReport = usePmoStore((state) => state.getEvmReport);
  const setTasks = usePmoStore((state) => state.setTasks);
  const qc = useQueryClient();

  return useQuery<EvmReport>({
    queryKey: ["evmReport", id, week],
    queryFn: async () => {
      // BUG-09 fix: reuse already-fetched tasks from cache; only re-fetch if missing
      let normalized = qc.getQueryData<Task[]>(["tasks", id]);
      if (!normalized) {
        const res = await fetch(`/api-proxy/tasks/programme/${id}`);
        if (!res.ok) throw new Error("Failed to fetch tasks");
        const data = await res.json();
        normalized = data.map((t: any) => ({
          ...t,
          blocked_hr: t.blocked_hr !== undefined ? t.blocked_hr : (t.blocked_hours || 0)
        }));
      }
      if (normalized) {
        setTasks(normalized, id);
      }
      return getEvmReport(id, week);
    },
    enabled: !!id,
  });
}

export function useHeatmapReportQuery(id: string) {
  const getHeatmapReport = usePmoStore((state) => state.getHeatmapReport);
  const setTasks = usePmoStore((state) => state.setTasks);
  const qc = useQueryClient();

  return useQuery<HeatmapReport>({
    queryKey: ["heatmapReport", id],
    queryFn: async () => {
      // BUG-09 fix: reuse already-fetched tasks from cache; only re-fetch if missing
      let normalized = qc.getQueryData<Task[]>(["tasks", id]);
      if (!normalized) {
        const res = await fetch(`/api-proxy/tasks/programme/${id}`);
        if (!res.ok) throw new Error("Failed to fetch tasks");
        const data = await res.json();
        normalized = data.map((t: any) => ({
          ...t,
          blocked_hr: t.blocked_hr !== undefined ? t.blocked_hr : (t.blocked_hours || 0)
        }));
      }
      if (normalized) {
        setTasks(normalized, id);
      }
      return getHeatmapReport(id);
    },
    enabled: !!id,
  });
}

export function useAuditLogsQuery() {
  return useQuery<any[]>({
    queryKey: ["auditLogs"],
    queryFn: async () => {
      const res = await fetch("/api-proxy/manage/audit-logs");
      if (!res.ok) throw new Error("Failed to fetch audit logs");
      return res.json();
    }
  });
}

export function useMilestonesQuery(pid: string) {
  return useQuery<Milestone[]>({
    queryKey: ["milestones", pid],
    queryFn: async () => {
      const res = await fetch(`/api-proxy/milestones?programme_id=${pid}`);
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
    enabled: !!pid,
  });
}

export function useConsignmentsQuery(pid: string) {
  return useQuery<ConsignmentKit[]>({
    queryKey: ["consignments", pid],
    queryFn: async () => {
      const res = await fetch(`/api-proxy/deliver/consignments?programme_id=${pid}`);
      if (!res.ok) throw new Error("Failed to fetch consignments");
      return res.json();
    },
    enabled: !!pid,
  });
}

export function useRisksQuery(pid: string) {
  return useQuery<Risk[]>({
    queryKey: ["risks", pid],
    queryFn: async () => {
      const res = await fetch(`/api-proxy/deliver/risks?programme_id=${pid}`);
      if (!res.ok) throw new Error("Failed to fetch risks");
      return res.json();
    },
    enabled: !!pid,
  });
}

export function useDfmeaQuery(pid: string) {
  return useQuery<{ items: DfmeaItem[]; stats: any }>({
    queryKey: ["dfmea", pid],
    queryFn: async () => {
      const res = await fetch(`/api-proxy/deliver/dfmea?programme_id=${pid}`);
      if (!res.ok) throw new Error("Failed to fetch DFMEA");
      return res.json();
    },
    enabled: !!pid,
  });
}

export function useChangeRequestsQuery(pid: string) {
  return useQuery<ChangeRequest[]>({
    queryKey: ["changeRequests", pid],
    queryFn: async () => {
      const res = await fetch(`/api-proxy/deliver/change-requests?programme_id=${pid}`);
      if (!res.ok) throw new Error("Failed to fetch change requests");
      return res.json();
    },
    enabled: !!pid,
  });
}

export function useCustomerCommsQuery(pid: string) {
  return useQuery<CustomerComm[]>({
    queryKey: ["customerComms", pid],
    queryFn: async () => {
      const res = await fetch(`/api-proxy/deliver/customer-comms?programme_id=${pid}`);
      if (!res.ok) throw new Error("Failed to fetch customer comms");
      return res.json();
    },
    enabled: !!pid,
  });
}

export function useDecisionsQuery(pid: string) {
  return useQuery<Decision[]>({
    queryKey: ["decisions", pid],
    queryFn: async () => {
      const res = await fetch(`/api-proxy/records/decisions?programme_id=${pid}`);
      if (!res.ok) throw new Error("Failed to fetch decisions");
      return res.json();
    },
    enabled: !!pid,
  });
}

export function useMeetingsQuery(pid: string) {
  return useQuery<Meeting[]>({
    queryKey: ["meetings", pid],
    queryFn: async () => {
      const res = await fetch(`/api-proxy/records/meetings?programme_id=${pid}`);
      if (!res.ok) throw new Error("Failed to fetch meetings");
      return res.json();
    },
    enabled: !!pid,
  });
}

export function useEmailsQuery() {
  return useQuery<EmailQueueItem[]>({
    queryKey: ["emails"],
    queryFn: async () => {
      const res = await fetch("/api-proxy/records/emails");
      if (!res.ok) throw new Error("Failed to fetch emails");
      return res.json();
    }
  });
}

export function useVendorsQuery() {
  return useQuery<Vendor[]>({
    queryKey: ["vendors"],
    queryFn: async () => {
      const res = await fetch("/api-proxy/finance/vendors");
      if (!res.ok) throw new Error("Failed to fetch vendors");
      return res.json();
    }
  });
}

export function useQuotesQuery(pid: string) {
  return useQuery<Quote[]>({
    queryKey: ["quotes", pid],
    queryFn: async () => {
      const res = await fetch(`/api-proxy/finance/quotes?programme_id=${pid}`);
      if (!res.ok) throw new Error("Failed to fetch quotes");
      return res.json();
    },
    enabled: !!pid,
  });
}

export function usePurchaseOrdersQuery(pid: string) {
  return useQuery<PurchaseOrder[]>({
    queryKey: ["purchaseOrders", pid],
    queryFn: async () => {
      const res = await fetch(`/api-proxy/finance/purchase-orders?programme_id=${pid}`);
      if (!res.ok) throw new Error("Failed to fetch purchase orders");
      return res.json();
    },
    enabled: !!pid,
  });
}

export function useInvoicesQuery(pid: string) {
  return useQuery<Invoice[]>({
    queryKey: ["invoices", pid],
    queryFn: async () => {
      const res = await fetch(`/api-proxy/finance/invoices?programme_id=${pid}`);
      if (!res.ok) throw new Error("Failed to fetch invoices");
      return res.json();
    },
    enabled: !!pid,
  });
}

export function usePaymentsQuery(pid: string) {
  return useQuery<Payment[]>({
    queryKey: ["payments", pid],
    queryFn: async () => {
      const res = await fetch(`/api-proxy/finance/payments?programme_id=${pid}`);
      if (!res.ok) throw new Error("Failed to fetch payments");
      return res.json();
    },
    enabled: !!pid,
  });
}

export function useBudgetQuery(pid: string) {
  return useQuery<BudgetLine[]>({
    queryKey: ["budget", pid],
    queryFn: async () => {
      const res = await fetch(`/api-proxy/finance/budget-lines?programme_id=${pid}`);
      if (!res.ok) throw new Error("Failed to fetch budget");
      return res.json();
    },
    enabled: !!pid,
  });
}

export function useDocumentsQuery(pid: string) {
  return useQuery<ProjectDocument[]>({
    queryKey: ["documents", pid],
    queryFn: async () => {
      const res = await fetch(`/api-proxy/library/documents?programme_id=${pid}`);
      if (!res.ok) throw new Error("Failed to fetch documents");
      return res.json();
    },
    enabled: !!pid,
  });
}

export function useStandardsQuery() {
  return useQuery<Standard[]>({
    queryKey: ["standards"],
    queryFn: async () => {
      const res = await fetch("/api-proxy/library/standards");
      if (!res.ok) throw new Error("Failed to fetch standards");
      return res.json();
    }
  });
}

export function useToolingQuery(pid: string) {
  return useQuery<ToolingPart[]>({
    queryKey: ["tooling", pid],
    queryFn: async () => {
      const res = await fetch(`/api-proxy/library/tools?programme_id=${pid}`);
      if (!res.ok) throw new Error("Failed to fetch tooling");
      return res.json();
    },
    enabled: !!pid,
  });
}

export function useLabEquipmentQuery() {
  return useQuery<LabEquipment[]>({
    queryKey: ["labEquipment"],
    queryFn: async () => {
      const res = await fetch("/api-proxy/library/equipment");
      if (!res.ok) throw new Error("Failed to fetch lab equipment");
      return res.json();
    }
  });
}

export function useLabBookingsQuery(pid: string) {
  return useQuery<LabBooking[]>({
    queryKey: ["labBookings", pid],
    queryFn: async () => {
      const res = await fetch(`/api-proxy/library/equipment-bookings?programme_id=${pid}`);
      if (!res.ok) throw new Error("Failed to fetch lab bookings");
      return res.json();
    },
    enabled: !!pid,
  });
}

// Manage Queries

export function usePeopleQuery() {
  return useQuery<Person[]>({
    queryKey: ["people"],
    queryFn: async () => {
      const res = await fetch("/api-proxy/people");
      if (!res.ok) throw new Error("Failed to fetch people");
      return res.json();
    }
  });
}

export function useCreatePersonMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Omit<Person, "id">) => {
      const res = await fetch("/api-proxy/people", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create person");
      return res.json() as Promise<Person>;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["people"] });
      usePmoStore.getState().loadPeople(true);
    },
  });
}

export function useUpdatePersonMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<Person> & { id: string }) => {
      const res = await fetch(`/api-proxy/people/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update person");
      return res.json() as Promise<Person>;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["people"] });
      usePmoStore.getState().loadPeople(true);
    },
  });
}

export function useDeletePersonMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number | string) => {
      const res = await fetch(`/api-proxy/people/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete person");
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["people"] });
      usePmoStore.getState().loadPeople(true);
    },
  });
}

export function useUsersQuery() {
  return useQuery<User[]>({
    queryKey: ["users"],
    queryFn: async () => {
      const res = await fetch("/api-proxy/manage/users");
      if (!res.ok) throw new Error("Failed to fetch users");
      return res.json();
    }
  });
}

export function useCreateUserMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Omit<User, "id">) => {
      const res = await fetch("/api-proxy/manage/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create user");
      return res.json() as Promise<User>;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["users"] });
      qc.invalidateQueries({ queryKey: ["people"] });
    },
  });
}

export function useUpdateUserMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<User> & { id: string }) => {
      const res = await fetch(`/api-proxy/manage/users/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update user");
      return res.json() as Promise<User>;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["users"] });
      qc.invalidateQueries({ queryKey: ["people"] });
    },
  });
}

export function useDeleteUserMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api-proxy/manage/users/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete user");
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["users"] });
      qc.invalidateQueries({ queryKey: ["people"] });
    },
  });
}

export function useSkillsQuery() {
  return useQuery<Skill[]>({
    queryKey: ["skills"],
    queryFn: async () => {
      const res = await fetch("/api-proxy/manage/skills");
      if (!res.ok) throw new Error("Failed to fetch skills");
      return res.json();
    }
  });
}

export function usePersonSkillsQuery() {
  return useQuery<PersonSkill[]>({
    queryKey: ["personSkills"],
    queryFn: async () => {
      const res = await fetch("/api-proxy/manage/person-skills");
      if (!res.ok) throw new Error("Failed to fetch person skills");
      return res.json();
    }
  });
}

export function useProgrammeResourcesQuery(pid: string) {
  return useQuery<ProgrammeResource[]>({
    queryKey: ["programmeResources", pid],
    queryFn: async () => {
      const res = await fetch(`/api-proxy/manage/programme-resources?programme_id=${pid}`);
      if (!res.ok) throw new Error("Failed to fetch programme resources");
      return res.json();
    },
    enabled: !!pid,
  });
}

export function useResourcesQuery() {
  return useQuery<any[]>({
    queryKey: ["resources"],
    queryFn: async () => {
      const res = await fetch("/api-proxy/resources");
      if (!res.ok) throw new Error("Failed to fetch resources");
      return res.json();
    }
  });
}

export function useCreateResourceMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: { id: string; name: string; level?: string; rate_inr?: number; capacity_hr_per_wk?: number; actor?: string }) => {
      const res = await fetch("/api-proxy/resources", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to create resource");
      }
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["resources"] });
    },
  });
}

export function useUpdateResourceMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string; name?: string; level?: string; rate_inr?: number; capacity_hr_per_wk?: number; actor?: string }) => {
      const res = await fetch(`/api-proxy/resources/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update resource");
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["resources"] });
    },
  });
}

export function useTimeEntriesQuery() {
  const setTimeEntries = usePmoStore((state) => state.setTimeEntries);
  return useQuery<TimeEntry[]>({
    queryKey: ["timeEntries"],
    queryFn: async () => {
      const res = await fetch("/api-proxy/time");
      if (!res.ok) throw new Error("Failed to fetch time entries");
      const data = await res.json();
      setTimeEntries(data);
      return data;
    }
  });
}

export function useTimesheetReportQuery(weeks: number, pid?: string) {
  const email = usePmoStore((state) => state.user?.email);
  return useQuery<any>({
    queryKey: ["timesheetReport", weeks, pid, email],
    queryFn: async () => {
      let url = `/api-proxy/reports/timesheet?weeks=${weeks}`;
      if (pid) {
        url += `&programme_id=${encodeURIComponent(pid)}`;
      }
      if (email) {
        url += `&email=${encodeURIComponent(email)}`;
      }
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch timesheet report");
      return res.json();
    }
  });
}

export function useHoursAnalyticsQuery(email?: string, week?: string) {
  return useQuery<any>({
    queryKey: ["hoursAnalytics", email, week],
    queryFn: async () => {
      let url = "/api-proxy/reports/hours-analytics";
      const params = new URLSearchParams();
      if (email) params.append("email", email);
      if (week) params.append("week", week);
      const queryStr = params.toString();
      if (queryStr) {
        url += `?${queryStr}`;
      }
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch hours analytics report");
      return res.json();
    }
  });
}
