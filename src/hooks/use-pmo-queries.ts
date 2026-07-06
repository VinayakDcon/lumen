import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { usePmoStore, mockArchetypes } from "@/store/use-pmo-store";
import { Programme, DashboardMetrics, Archetype, ScurvePoint, FollowUpTask, CharterData, JourneyData, DpdsGateInfo, Task, EvmReport, HeatmapReport, Milestone, ConsignmentKit, Risk, DfmeaItem, ChangeRequest, CustomerComm, Decision, Meeting, EmailQueueItem, Vendor, Quote, QuoteLine, PurchaseOrder, Invoice, Payment, BudgetLine, ProjectDocument, Standard, ToolingPart, LabEquipment, LabBooking, User, Person, Skill, PersonSkill, ProgrammeResource, TimeEntry } from "@/types/pmo";

// Mock delay to simulate network latency
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export function useProgrammesQuery() {
  return useQuery<Programme[]>({
    queryKey: ["programmes"],
    queryFn: async () => {
      const res = await fetch("http://localhost:5000/api/programmes");
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
  });
}

export function useActiveProgrammeQuery(id: string) {
  return useQuery<Programme | null>({
    queryKey: ["programme", id],
    queryFn: async () => {
      const res = await fetch(`http://localhost:5000/api/programmes/${id}`);
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
    enabled: !!id,
  });
}

export function useDashboardMetricsQuery(id: string) {
  return useQuery<DashboardMetrics | null>({
    queryKey: ["dashboard", id],
    queryFn: async () => {
      const res = await fetch(`http://localhost:5000/api/dashboard?programme_id=${id}`);
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
      const res = await fetch("http://localhost:5000/api/templates/library");
      if (!res.ok) throw new Error("Failed to fetch templates");
      return res.json();
    },
  });
}

export function useScurveQuery(id: string) {
  const getScurveData = usePmoStore((state) => state.getScurveData);
  
  return useQuery<ScurvePoint[]>({
    queryKey: ["scurve", id],
    queryFn: async () => {
      await delay(200);
      return getScurveData(id);
    },
    enabled: !!id,
  });
}

export function useFollowUpQuery(id: string) {
  const getFollowUpTasks = usePmoStore((state) => state.getFollowUpTasks);
  
  return useQuery<FollowUpTask[]>({
    queryKey: ["followup", id],
    queryFn: async () => {
      await delay(200);
      return getFollowUpTasks(id);
    },
    enabled: !!id,
  });
}

export function useCharterQuery(id: string) {
  return useQuery<CharterData | null>({
    queryKey: ["charter", id],
    queryFn: async () => {
      const res = await fetch(`http://localhost:5000/api/programmes/${id}/charter`);
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
      const res = await fetch(`http://localhost:5000/api/journey?programme_id=${id}`);
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
      const res = await fetch(`http://localhost:5000/api/dpds/gates?programme_id=${id}`);
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
      const res = await fetch(`http://localhost:5000/api/tasks/programme/${id}`);
      if (!res.ok) throw new Error("Failed to fetch tasks");
      const data = await res.json();
      setTasks(data, id);
      return data;
    },
    enabled: !!id,
  });
}

export function useEvmReportQuery(id: string, week?: number) {
  const getEvmReport = usePmoStore((state) => state.getEvmReport);
  const setTasks = usePmoStore((state) => state.setTasks);
  
  return useQuery<EvmReport>({
    queryKey: ["evmReport", id, week],
    queryFn: async () => {
      const res = await fetch(`http://localhost:5000/api/tasks/programme/${id}`);
      if (!res.ok) throw new Error("Failed to fetch tasks");
      const data = await res.json();
      setTasks(data, id);
      return getEvmReport(id, week);
    },
    enabled: !!id,
  });
}

export function useHeatmapReportQuery(id: string) {
  const getHeatmapReport = usePmoStore((state) => state.getHeatmapReport);
  const setTasks = usePmoStore((state) => state.setTasks);
  
  return useQuery<HeatmapReport>({
    queryKey: ["heatmapReport", id],
    queryFn: async () => {
      const res = await fetch(`http://localhost:5000/api/tasks/programme/${id}`);
      if (!res.ok) throw new Error("Failed to fetch tasks");
      const data = await res.json();
      setTasks(data, id);
      return getHeatmapReport(id);
    },
    enabled: !!id,
  });
}

export function useAuditLogsQuery() {
  const auditLogs = usePmoStore((state) => state.auditLogs);
  
  return useQuery<any[]>({
    queryKey: ["auditLogs"],
    queryFn: async () => {
      await delay(150);
      return auditLogs || [];
    }
  });
}

export function useMilestonesQuery(pid: string) {
  return useQuery<Milestone[]>({
    queryKey: ["milestones", pid],
    queryFn: async () => {
      const res = await fetch(`http://localhost:5000/api/milestones?programme_id=${pid}`);
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
    enabled: !!pid,
  });
}

export function useConsignmentsQuery(pid: string) {
  const consignments = usePmoStore((state) => state.consignments);
  
  return useQuery<ConsignmentKit[]>({
    queryKey: ["consignments", pid],
    queryFn: async () => {
      await delay(200);
      return consignments.filter(c => c.programme_id === pid);
    },
    enabled: !!pid,
  });
}

export function useRisksQuery(pid: string) {
  return useQuery<Risk[]>({
    queryKey: ["risks", pid],
    queryFn: async () => {
      const res = await fetch(`http://localhost:5000/api/risks?programme_id=${pid}`);
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
    enabled: !!pid,
  });
}

export function useDfmeaQuery(pid: string) {
  const dfmeaItems = usePmoStore((state) => state.dfmeaItems);
  
  return useQuery<{ items: DfmeaItem[]; stats: any }>({
    queryKey: ["dfmea", pid],
    queryFn: async () => {
      await delay(200);
      const items = dfmeaItems.filter(i => i.programme_id === pid);
      const total = items.length;
      const highRpn = items.filter(i => (i.severity * i.occurrence * i.detection) >= 100).length;
      const open = items.filter(i => i.action_status !== 'CLOSED').length;
      return {
        items,
        stats: { total, high_rpn: highRpn, open }
      };
    },
    enabled: !!pid,
  });
}

export function useChangeRequestsQuery(pid: string) {
  const changeRequests = usePmoStore((state) => state.changeRequests);
  
  return useQuery<ChangeRequest[]>({
    queryKey: ["changeRequests", pid],
    queryFn: async () => {
      await delay(200);
      return changeRequests.filter(cr => cr.programme_id === pid);
    },
    enabled: !!pid,
  });
}

export function useCustomerCommsQuery(pid: string) {
  const customerComms = usePmoStore((state) => state.customerComms);
  
  return useQuery<CustomerComm[]>({
    queryKey: ["customerComms", pid],
    queryFn: async () => {
      await delay(200);
      return customerComms.filter(cc => cc.programme_id === pid);
    },
    enabled: !!pid,
  });
}

export function useDecisionsQuery(pid: string) {
  const decisions = usePmoStore((state) => state.decisions);
  
  return useQuery<Decision[]>({
    queryKey: ["decisions", pid],
    queryFn: async () => {
      await delay(200);
      return decisions.filter(d => d.programme_id === pid);
    },
    enabled: !!pid,
  });
}

export function useMeetingsQuery(pid: string) {
  const meetings = usePmoStore((state) => state.meetings);
  
  return useQuery<Meeting[]>({
    queryKey: ["meetings", pid],
    queryFn: async () => {
      await delay(200);
      return meetings.filter(m => m.programme_id === pid);
    },
    enabled: !!pid,
  });
}

export function useEmailsQuery() {
  const emails = usePmoStore((state) => state.emails);
  
  return useQuery<EmailQueueItem[]>({
    queryKey: ["emails"],
    queryFn: async () => {
      await delay(200);
      return emails;
    }
  });
}

export function useVendorsQuery() {
  const vendors = usePmoStore((state) => state.vendors);
  
  return useQuery<Vendor[]>({
    queryKey: ["vendors"],
    queryFn: async () => {
      await delay(200);
      return vendors;
    }
  });
}

export function useQuotesQuery(pid: string) {
  const quotes = usePmoStore((state) => state.quotes);
  
  return useQuery<Quote[]>({
    queryKey: ["quotes", pid],
    queryFn: async () => {
      await delay(200);
      return quotes.filter(q => q.programme_id === pid);
    },
    enabled: !!pid,
  });
}

export function usePurchaseOrdersQuery(pid: string) {
  const purchaseOrders = usePmoStore((state) => state.purchaseOrders);
  
  return useQuery<PurchaseOrder[]>({
    queryKey: ["purchaseOrders", pid],
    queryFn: async () => {
      await delay(200);
      return purchaseOrders.filter(po => po.programme_id === pid);
    },
    enabled: !!pid,
  });
}

export function useInvoicesQuery(pid: string) {
  const invoices = usePmoStore((state) => state.invoices);
  
  return useQuery<Invoice[]>({
    queryKey: ["invoices", pid],
    queryFn: async () => {
      await delay(200);
      return invoices.filter(inv => inv.programme_id === pid);
    },
    enabled: !!pid,
  });
}

export function usePaymentsQuery(pid: string) {
  const payments = usePmoStore((state) => state.payments);
  
  return useQuery<Payment[]>({
    queryKey: ["payments", pid],
    queryFn: async () => {
      await delay(200);
      return payments.filter(p => p.programme_id === pid);
    },
    enabled: !!pid,
  });
}

export function useBudgetQuery(pid: string) {
  const budgetLines = usePmoStore((state) => state.budgetLines);
  return useQuery<BudgetLine[]>({
    queryKey: ["budget", pid],
    queryFn: async () => {
      await delay(200);
      return budgetLines.filter(b => b.programme_id === pid);
    },
    enabled: !!pid,
  });
}

export function useDocumentsQuery(pid: string) {
  const documents = usePmoStore((state) => state.documents);
  return useQuery<ProjectDocument[]>({
    queryKey: ["documents", pid],
    queryFn: async () => {
      await delay(200);
      return documents.filter(d => d.programme_id === pid);
    },
    enabled: !!pid,
  });
}

export function useStandardsQuery() {
  const standards = usePmoStore((state) => state.standards);
  return useQuery<Standard[]>({
    queryKey: ["standards"],
    queryFn: async () => {
      await delay(200);
      return standards;
    }
  });
}

export function useToolingQuery(pid: string) {
  const tooling = usePmoStore((state) => state.tooling);
  return useQuery<ToolingPart[]>({
    queryKey: ["tooling", pid],
    queryFn: async () => {
      await delay(200);
      return tooling.filter(t => t.programme_id === pid);
    },
    enabled: !!pid,
  });
}

export function useLabEquipmentQuery() {
  const labEquipment = usePmoStore((state) => state.labEquipment);
  return useQuery<LabEquipment[]>({
    queryKey: ["labEquipment"],
    queryFn: async () => {
      await delay(200);
      return labEquipment;
    }
  });
}

export function useLabBookingsQuery(pid: string) {
  const labBookings = usePmoStore((state) => state.labBookings);
  return useQuery<LabBooking[]>({
    queryKey: ["labBookings", pid],
    queryFn: async () => {
      await delay(200);
      return labBookings.filter(b => b.programme_id === pid);
    },
    enabled: !!pid,
  });
}

// Manage Queries

export function usePeopleQuery() {
  return useQuery<Person[]>({
    queryKey: ["people"],
    queryFn: async () => {
      const res = await fetch("http://localhost:5000/api/people");
      if (!res.ok) throw new Error("Failed to fetch people");
      return res.json();
    }
  });
}

export function useCreatePersonMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Omit<Person, "id">) => {
      const res = await fetch("http://localhost:5000/api/people", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create person");
      return res.json() as Promise<Person>;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["people"] }),
  });
}

export function useUpdatePersonMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<Person> & { id: string }) => {
      const res = await fetch(`http://localhost:5000/api/people/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update person");
      return res.json() as Promise<Person>;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["people"] }),
  });
}

export function useUsersQuery() {
  return useQuery<User[]>({
    queryKey: ["users"],
    queryFn: async () => {
      const res = await fetch("http://localhost:5000/api/manage/users");
      if (!res.ok) throw new Error("Failed to fetch users");
      return res.json();
    }
  });
}

export function useCreateUserMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Omit<User, "id">) => {
      const res = await fetch("http://localhost:5000/api/manage/users", {
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
      const res = await fetch(`http://localhost:5000/api/manage/users/${id}`, {
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

export function useSkillsQuery() {
  const skills = usePmoStore((state) => state.skills);
  return useQuery<Skill[]>({
    queryKey: ["skills"],
    queryFn: async () => {
      await delay(200);
      return skills;
    }
  });
}

export function usePersonSkillsQuery() {
  const personSkills = usePmoStore((state) => state.personSkills);
  return useQuery<PersonSkill[]>({
    queryKey: ["personSkills"],
    queryFn: async () => {
      await delay(200);
      return personSkills;
    }
  });
}

export function useProgrammeResourcesQuery(pid: string) {
  const resources = usePmoStore((state) => state.programmeResources);
  return useQuery<ProgrammeResource[]>({
    queryKey: ["programmeResources", pid],
    queryFn: async () => {
      await delay(200);
      return resources.filter(r => r.programme_id === pid);
    },
    enabled: !!pid,
  });
}

export function useTimeEntriesQuery() {
  const setTimeEntries = usePmoStore((state) => state.setTimeEntries);
  return useQuery<TimeEntry[]>({
    queryKey: ["timeEntries"],
    queryFn: async () => {
      const res = await fetch("http://localhost:5000/api/time");
      if (!res.ok) throw new Error("Failed to fetch time entries");
      const data = await res.json();
      setTimeEntries(data);
      return data;
    }
  });
}

export function useTimesheetReportQuery(weeks: number, pid?: string) {
  return useQuery<any>({
    queryKey: ["timesheetReport", weeks, pid],
    queryFn: async () => {
      let url = `http://localhost:5000/api/reports/timesheet?weeks=${weeks}`;
      if (pid) {
        url += `&programme_id=${encodeURIComponent(pid)}`;
      }
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch timesheet report");
      return res.json();
    }
  });
}
