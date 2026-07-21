"use client";

import React, { useState, useEffect, useRef } from "react";
import { useHoursAnalyticsQuery } from "@/hooks/use-pmo-queries";
import { usePmoStore } from "@/store/use-pmo-store";
import { 
  LineChart, Calendar, Users, Hourglass, TrendingUp, TrendingDown,
  Info, ShieldCheck, AlertCircle, HelpCircle
} from "lucide-react";
import { 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, Cell, ReferenceLine, PieChart, Pie, Legend
} from "recharts";

const PIE_COLORS = ["#1E90E8", "#10B981", "#8B5CF6", "#EC4899", "#F59E0B", "#14B8A6", "#3B82F6", "#6B7280"];

export default function HoursAnalyticsPage() {
  const [selectedWeek, setSelectedWeek] = useState<string>("");
  const user = usePmoStore((state) => state.user);

  // Fetch report data
  const { data, isLoading } = useHoursAnalyticsQuery(user?.email, selectedWeek || undefined);

  const availableWeeks = data?.available_weeks || [];
  const activeWeek = data?.selected_week || "";
  const resourceHours = data?.resource_hours || [];
  const projectDistribution = data?.project_distribution || [];
  const departmentAverages = data?.department_averages || [];
  const phaseDistribution = data?.phase_distribution || [];

  const totalHoursLogged = data?.total_hours_logged || 0;
  const activeEmployeesCount = data?.active_employees_count || 0;
  const mostActiveProject = data?.most_active_project || "N/A";
  const leastActiveProject = data?.least_active_project || "N/A";

  const isPMOOrAdmin = user?.role === "PMO" || user?.role === "ADMIN" || user?.role === "PM";

  const getStatusColor = (status: string) => {
    switch (status) {
      case "green":
        return { text: "text-emerald-700 bg-emerald-50 border-emerald-200", fill: "#10B981" };
      case "yellow":
        return { text: "text-amber-700 bg-amber-50 border-amber-200", fill: "#F59E0B" };
      case "red":
      default:
        return { text: "text-rose-700 bg-rose-50 border-rose-200", fill: "#EF4444" };
    }
  };

  return (
    <div className="page-container space-y-6 p-6 max-h-screen overflow-y-auto">
      {/* Header Panel */}
      <div className="flex flex-col md:flex-row md:items-center justify-between bg-white border border-border-base rounded-xl p-5 shadow-sm gap-4">
        <div>
          <h2 className="text-xl font-black text-navy flex items-center gap-2">
            <LineChart className="w-6 h-6 text-dc-blue" />
            <span>Hours Analytics Dashboard</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Weekly timesheet capacity tracking, project distributions, and department breakdowns for executive reviews.
          </p>
        </div>

        {/* Week Selector Dropdown */}
        <div className="flex items-center gap-2 bg-slate-50 border border-border-base rounded-lg px-3 py-1.5 self-start md:self-auto">
          <Calendar className="w-4 h-4 text-slate-400" />
          <span className="text-xs font-bold text-navy">Reporting Week:</span>
          <select 
            value={selectedWeek || activeWeek} 
            onChange={(e) => setSelectedWeek(e.target.value)}
            className="bg-transparent text-xs font-black text-dc-blue outline-none border-none cursor-pointer pr-4"
          >
            {availableWeeks.map((wk: string) => {
              const dateObj = new Date(wk);
              const formattedDate = dateObj.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
              return (
                <option key={wk} value={wk} className="text-navy font-normal">
                  Week of {formattedDate}
                </option>
              );
            })}
            {availableWeeks.length === 0 && (
              <option value="" className="text-navy">No Weeks Logged</option>
            )}
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center min-h-[400px] bg-white border border-border-base rounded-xl p-8 shadow-sm">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-dc-blue mb-4"></div>
          <span className="text-xs text-slate-400 font-semibold">Compiling analytics report data...</span>
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white border border-border-base rounded-xl p-5 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 bg-dc-blue/10 text-dc-blue rounded-lg flex items-center justify-center">
                <Hourglass className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs text-slate-400 font-semibold block">Total Hours Logged</span>
                <span className="text-xl font-black text-navy">{totalHoursLogged} hrs</span>
              </div>
            </div>

            <div className="bg-white border border-border-base rounded-xl p-5 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center border border-emerald-100">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs text-slate-400 font-semibold block">Active Employees</span>
                <span className="text-xl font-black text-navy">{activeEmployeesCount}</span>
              </div>
            </div>

            <div className="bg-white border border-border-base rounded-xl p-5 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-lg flex items-center justify-center border border-purple-100">
                <TrendingUp className="w-6 h-6" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-xs text-slate-400 font-semibold block">Most Active Project</span>
                <span className="text-sm font-black text-navy truncate block">{mostActiveProject}</span>
              </div>
            </div>

            <div className="bg-white border border-border-base rounded-xl p-5 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-lg flex items-center justify-center border border-amber-100">
                <TrendingDown className="w-6 h-6" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-xs text-slate-400 font-semibold block">Least Active Project</span>
                <span className="text-sm font-black text-navy truncate block">{leastActiveProject}</span>
              </div>
            </div>
          </div>

          {/* Main Chart - Weekly Hours */}
          <div className="bg-white border border-border-base rounded-xl p-6 shadow-sm space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-black text-navy">Weekly Employee Hours & Threshold Tracker</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Tracks total weekly capacity (Hours Logged + Blocked Hours) against the standard 45-hour baseline.
                </p>
              </div>

              {/* Legend explanation */}
              <div className="flex flex-wrap items-center gap-4 text-xs font-bold">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 bg-emerald-500 rounded-full"></span>
                  <span className="text-slate-500">Over Capacity (&ge;45 hrs)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 bg-amber-500 rounded-full"></span>
                  <span className="text-slate-500">Active (10-44 hrs)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 bg-rose-500 rounded-full"></span>
                  <span className="text-slate-500">Under Capacity (&lt;10 hrs)</span>
                </div>
              </div>
            </div>

            <div className="h-[400px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={resourceHours} margin={{ top: 20, right: 30, left: 10, bottom: 40 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fill: "#64748B", fontSize: 10, fontWeight: "bold" }}
                    angle={-25}
                    textAnchor="end"
                    interval={0}
                    stroke="#E2E8F0"
                  />
                  <YAxis 
                    tick={{ fill: "#64748B", fontSize: 11, fontWeight: "bold" }}
                    axisLine={false}
                    stroke="#E2E8F0"
                    label={{ value: 'Hours Logged', angle: -90, position: 'insideLeft', fill: '#64748B', fontSize: 11, fontWeight: 'black', offset: -2 }}
                  />
                  <Tooltip 
                    cursor={{ fill: '#F8FAFC' }}
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const item = payload[0].payload;
                        return (
                          <div className="bg-white border border-border-base rounded-xl p-3 shadow-lg max-w-[240px]">
                            <p className="text-xs font-black text-navy">{item.name}</p>
                            <p className="text-[10px] text-slate-400 mt-0.5">{item.role} &bull; {item.department}</p>
                            <hr className="my-2 border-slate-100" />
                            <div className="space-y-1 text-xs">
                              <div className="flex justify-between gap-4 text-slate-500">
                                <span>Billable Hours:</span>
                                <strong className="text-navy">{item.billable} hrs</strong>
                              </div>
                              <div className="flex justify-between gap-4 text-slate-500">
                                <span>Non-Billable:</span>
                                <strong className="text-navy">{item.non_billable} hrs</strong>
                              </div>
                              {item.blocked > 0 && (
                                <div className="flex justify-between gap-4 text-slate-500">
                                  <span>Blocked Hours:</span>
                                  <strong className="text-rose-500">{item.blocked} hrs</strong>
                                </div>
                              )}
                              <div className="flex justify-between gap-4 pt-1 border-t border-dashed border-slate-100 font-bold">
                                <span>Total Logged:</span>
                                <span className="text-dc-blue">{item.total} hrs</span>
                              </div>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <ReferenceLine 
                    y={45} 
                    stroke="#10B981" 
                    strokeWidth={2}
                    strokeDasharray="4 4" 
                    label={{ value: '45 hr Baseline', position: 'top', fill: '#059669', fontSize: 10, fontWeight: 'bold' }} 
                  />
                  <Bar dataKey="total" radius={[4, 4, 0, 0]} maxBarSize={45}>
                    {resourceHours.map((entry: any, index: number) => {
                      const colorInfo = getStatusColor(entry.status);
                      return <Cell key={`cell-${index}`} fill={colorInfo.fill} />;
                    })}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Billable Hours Chart */}
          <div className="bg-white border border-border-base rounded-xl p-6 shadow-sm space-y-4">
            <div>
              <h3 className="text-sm font-black text-navy">Customer Projects - Billable Hours Tracker</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Displays total weekly billable time spent directly on client/customer programs (excluding Bench / BAU activities) per employee.
              </p>
            </div>

            <div className="h-[320px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart 
                  data={resourceHours.filter((r: any) => r.total > 0).sort((a: any, b: any) => b.billable - a.billable)} 
                  margin={{ top: 20, right: 30, left: 10, bottom: 40 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fill: "#64748B", fontSize: 10, fontWeight: "bold" }}
                    angle={-25}
                    textAnchor="end"
                    interval={0}
                    stroke="#E2E8F0"
                  />
                  <YAxis 
                    tick={{ fill: "#64748B", fontSize: 11, fontWeight: "bold" }}
                    axisLine={false}
                    stroke="#E2E8F0"
                    label={{ value: 'Billable Hours', angle: -90, position: 'insideLeft', fill: '#64748B', fontSize: 11, fontWeight: 'black', offset: -2 }}
                  />
                  <Tooltip 
                    cursor={{ fill: '#F8FAFC' }}
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const item = payload[0].payload;
                        return (
                          <div className="bg-white border border-border-base rounded-xl p-3 shadow-lg max-w-[250px]">
                            <p className="text-xs font-black text-navy">{item.name}</p>
                            <p className="text-[10px] text-slate-400 mt-0.5">{item.role} &bull; {item.department}</p>
                            <hr className="my-2 border-slate-100" />
                            <div className="flex justify-between gap-4 text-xs font-bold">
                              <span className="text-slate-500">Billable Project Hours:</span>
                              <span className="text-dc-blue">{item.billable} hrs</span>
                            </div>

                            {item.projects_worked && item.projects_worked.length > 0 && (
                              <div className="mt-2.5 pt-2 border-t border-dashed border-slate-150">
                                <p className="text-[9px] uppercase font-black text-slate-400 mb-1 tracking-wider">Customer Projects Worked</p>
                                <div className="space-y-1">
                                  {item.projects_worked.map((p: any) => (
                                    <div key={p.id} className="flex justify-between gap-4 text-[11px]">
                                      <span className="text-slate-500 truncate max-w-[150px]" title={p.name}>{p.name}</span>
                                      <strong className="text-navy shrink-0">{p.hours} hrs</strong>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="billable" fill="#1E90E8" radius={[4, 4, 0, 0]} maxBarSize={45} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Billable Details list under the chart */}
            <div className="pt-3 border-t border-slate-100 mt-2">
              <p className="text-[10px] uppercase font-black text-slate-400 mb-2 tracking-wider">Active Customer Project Workload Details</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 max-h-[160px] overflow-y-auto pr-2 custom-scrollbar">
                {resourceHours
                  .filter((r: any) => r.billable > 0)
                  .sort((a: any, b: any) => b.billable - a.billable)
                  .map((r: any) => (
                    <div key={r.person_id} className="bg-slate-50/50 hover:bg-slate-50 border border-slate-100 rounded-lg p-2.5 flex flex-col justify-between transition-colors">
                      <div className="flex items-center justify-between gap-2 border-b border-dashed border-slate-100 pb-1.5 mb-1.5">
                        <span className="font-bold text-navy text-xs truncate max-w-[120px]" title={r.name}>{r.name}</span>
                        <span className="font-black text-dc-blue text-xs shrink-0">{r.billable} hrs</span>
                      </div>
                      <div className="space-y-1">
                        {r.projects_worked && r.projects_worked.map((p: any) => (
                          <div key={p.id} className="flex justify-between gap-2 text-[10px] text-slate-500">
                            <span className="truncate max-w-[130px]" title={p.name}>{p.name}</span>
                            <span className="font-bold text-navy shrink-0">{p.hours} hrs</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>

          {/* Side-by-Side Breakdown Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Card - Project Hours Distribution */}
            <div className="bg-white border border-border-base rounded-xl p-6 shadow-sm space-y-4">
              <div>
                <h3 className="text-sm font-black text-navy">Project Hours Distribution</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Breakdown of accumulated logged hours across active engineering projects.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-5 gap-6 items-center pt-2">
                {/* Left Donut Chart (2/5 cols) */}
                <div className="h-[280px] md:col-span-2 flex items-center justify-center relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={projectDistribution}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={85}
                        innerRadius={55}
                        paddingAngle={2}
                        label={false}
                      >
                        {projectDistribution.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const item = payload[0].payload;
                            return (
                              <div className="bg-white border border-border-base rounded-xl p-2.5 shadow-md text-xs">
                                <p className="font-black text-navy">{item.name}</p>
                                <p className="text-slate-500 mt-0.5">Logged Time: <strong className="text-dc-blue">{item.value} hrs</strong></p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* Right Scrollable Legend (3/5 cols) */}
                <div className="md:col-span-3 max-h-[280px] overflow-y-auto pr-2 space-y-1.5 border-l border-slate-100 pl-4 custom-scrollbar">
                  {(() => {
                    const totalProjHours = projectDistribution.reduce((sum: number, p: any) => sum + p.value, 0);
                    return projectDistribution.map((entry: any, index: number) => {
                      const pct = totalProjHours > 0 ? Math.round((entry.value / totalProjHours) * 100) : 0;
                      return (
                        <div key={entry.id} className="flex items-center justify-between text-xs hover:bg-slate-50/50 p-1.5 rounded-lg transition-colors">
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            <span 
                              className="w-2.5 h-2.5 rounded-full shrink-0" 
                              style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }}
                            />
                            <span className="font-bold text-navy truncate" title={entry.name}>
                              {entry.name}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 shrink-0 ml-4">
                            <span className="text-slate-400 font-semibold">{entry.value} hrs</span>
                            <span className="font-black text-dc-blue w-8 text-right">{pct}%</span>
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>
            </div>

            {/* Right Card - Department Averages (PMO/Admin) OR Phase Distribution (Leads/Heads) */}
            {isPMOOrAdmin ? (
              <div className="bg-white border border-border-base rounded-xl p-6 shadow-sm space-y-4">
                <div>
                  <h3 className="text-sm font-black text-navy">Department Capacity Averages</h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Comparison of standard weekly average output logged per employee by department.
                  </p>
                </div>

                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={departmentAverages} layout="vertical" margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#F1F5F9" />
                      <XAxis type="number" tick={{ fill: "#64748B", fontSize: 10, fontWeight: "bold" }} stroke="#E2E8F0" />
                      <YAxis dataKey="department" type="category" tick={{ fill: "#64748B", fontSize: 11, fontWeight: "bold" }} stroke="#E2E8F0" />
                      <Tooltip 
                        cursor={{ fill: '#F8FAFC' }}
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const item = payload[0].payload;
                            return (
                              <div className="bg-white border border-border-base rounded-xl p-2.5 shadow-md text-xs">
                                <p className="font-black text-navy">{item.department} Department</p>
                                <p className="text-slate-500 mt-1">Average Hours / Employee: <strong className="text-purple-600">{item.average_hours} hrs</strong></p>
                                <p className="text-slate-400 text-[10px] mt-0.5">Total logged: {item.total_hours} hrs across {item.employees_count} team members</p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Bar dataKey="average_hours" fill="#8B5CF6" radius={[0, 4, 4, 0]} maxBarSize={30} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            ) : (
              <div className="bg-white border border-border-base rounded-xl p-6 shadow-sm space-y-4">
                <div>
                  <h3 className="text-sm font-black text-navy">Project Phase Hour Distribution</h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Breakdown of weekly logged hours across different project gates and phases.
                  </p>
                </div>

                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={phaseDistribution} layout="vertical" margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#F1F5F9" />
                      <XAxis type="number" tick={{ fill: "#64748B", fontSize: 10, fontWeight: "bold" }} stroke="#E2E8F0" />
                      <YAxis dataKey="phase" type="category" tick={{ fill: "#64748B", fontSize: 11, fontWeight: "bold" }} stroke="#E2E8F0" />
                      <Tooltip 
                        cursor={{ fill: '#F8FAFC' }}
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const item = payload[0].payload;
                            return (
                              <div className="bg-white border border-border-base rounded-xl p-2.5 shadow-md text-xs">
                                <p className="font-black text-navy">{item.phase}</p>
                                <p className="text-slate-500 mt-1">Total Effort: <strong className="text-purple-600">{item.total_hours} hrs</strong></p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Bar dataKey="total_hours" fill="#8B5CF6" radius={[0, 4, 4, 0]} maxBarSize={30} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </div>

          {/* Interactive Hours Workflow Flowchart */}
          <NodeConnectionFlow weekEntries={data?.week_entries || []} />
        </>
      )}
    </div>
  );
}

function NodeConnectionFlow({ weekEntries }: { weekEntries: any[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);
  const [connections, setConnections] = useState<Array<{ d: string; color: string; strokeWidth: number }>>([]);

  // Process entries into hierarchy
  const projectsMap: Record<string, any> = {};

  weekEntries.forEach((e: any) => {
    const progId = e.programme_id || 'BENCH_TIME';
    const progName = e.programme_name || (progId === 'BENCH_TIME' ? 'Bench / BAU' : progId);
    const isBillable = progId !== 'BENCH_TIME' && progId !== 'DC_BAU';

    if (!projectsMap[progId]) {
      projectsMap[progId] = {
        id: progId,
        name: progName,
        totalHours: 0,
        benchHours: 0,
        employees: {}
      };
    }

    const hrs = e.hours || 0;
    const blk = e.blocked_hours || 0;
    const logHrs = hrs + blk;

    projectsMap[progId].totalHours += logHrs;
    if (!isBillable) {
      projectsMap[progId].benchHours += logHrs;
    }

    const rawPersonId = e.person_id || 'unknown';
    const personId = String(rawPersonId).replace('person-', '');
    if (!projectsMap[progId].employees[personId]) {
      projectsMap[progId].employees[personId] = {
        personId,
        name: e.person_name || 'Unknown',
        role: e.person_role || 'Engineer',
        department: e.department || 'Other',
        resourceId: e.resource_id || 'N/A',
        totalHours: 0,
        tasks: []
      };
    }

    projectsMap[progId].employees[personId].totalHours += logHrs;
    projectsMap[progId].employees[personId].tasks.push({
      wbs: e.wbs || '',
      name: e.task_name || e.wbs || 'General Task',
      hours: logHrs,
      notes: e.note || e.blocker_note || ''
    });
  });

  const projects = Object.values(projectsMap).map((p: any) => {
    p.totalHours = Math.round(p.totalHours * 10) / 10;
    p.benchHours = Math.round(p.benchHours * 10) / 10;
    p.employees = Object.values(p.employees).map((emp: any) => {
      emp.totalHours = Math.round(emp.totalHours * 10) / 10;
      emp.tasks = emp.tasks.map((t: any) => {
        t.hours = Math.round(t.hours * 10) / 10;
        return t;
      }).sort((a: any, b: any) => b.hours - a.hours);
      return emp;
    }).sort((a: any, b: any) => b.totalHours - a.totalHours);
    return p;
  }).sort((a: any, b: any) => b.totalHours - a.totalHours);

  // Auto-select first project if none selected and projects exist
  useEffect(() => {
    if (projects.length > 0 && !selectedProjectId) {
      setSelectedProjectId(projects[0].id);
    }
  }, [projects, selectedProjectId]);

  // Reset employee when project changes
  const handleProjectSelect = (id: string) => {
    if (selectedProjectId === id) {
      setSelectedProjectId(null);
      setSelectedEmployeeId(null);
    } else {
      setSelectedProjectId(id);
      setSelectedEmployeeId(null);
    }
  };

  const handleEmployeeSelect = (id: string) => {
    if (selectedEmployeeId === id) {
      setSelectedEmployeeId(null);
    } else {
      setSelectedEmployeeId(id);
    }
  };

  const recalculateLines = () => {
    const container = containerRef.current;
    if (!container) return;

    const newConnections: Array<{ d: string; color: string; strokeWidth: number }> = [];
    const containerRect = container.getBoundingClientRect();

    if (selectedProjectId) {
      const outPort = document.getElementById(`port-out-proj-${selectedProjectId}`);
      if (outPort) {
        const outRect = outPort.getBoundingClientRect();
        const startX = outRect.left - containerRect.left + outRect.width / 2;
        const startY = outRect.top - containerRect.top + outRect.height / 2;

        const currentProj = projects.find(p => p.id === selectedProjectId);
        if (currentProj) {
          currentProj.employees.forEach((emp: any) => {
            const inPort = document.getElementById(`port-in-emp-${selectedProjectId}-${emp.personId}`);
            if (inPort) {
              const inRect = inPort.getBoundingClientRect();
              const endX = inRect.left - containerRect.left + inRect.width / 2;
              const endY = inRect.top - containerRect.top + inRect.height / 2;

              const cpX1 = startX + (endX - startX) * 0.4;
              const cpY1 = startY;
              const cpX2 = startX + (endX - startX) * 0.6;
              const cpY2 = endY;

              const isActive = selectedEmployeeId === emp.personId;
              const color = isActive ? '#3B82F6' : '#94A3B8';
              const strokeWidth = isActive ? 3 : 1.5;
              const d = `M ${startX} ${startY} C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${endX} ${endY}`;
              newConnections.push({ d, color, strokeWidth });
            }
          });
        }
      }
    }

    if (selectedProjectId && selectedEmployeeId) {
      const outPort = document.getElementById(`port-out-emp-${selectedProjectId}-${selectedEmployeeId}`);
      if (outPort) {
        const outRect = outPort.getBoundingClientRect();
        const startX = outRect.left - containerRect.left + outRect.width / 2;
        const startY = outRect.top - containerRect.top + outRect.height / 2;

        const currentProj = projects.find(p => p.id === selectedProjectId);
        if (currentProj) {
          const currentEmp = currentProj.employees.find((emp: any) => emp.personId === selectedEmployeeId);
          if (currentEmp) {
            currentEmp.tasks.forEach((task: any, idx: number) => {
              const inPort = document.getElementById(`port-in-task-${idx}`);
              if (inPort) {
                const inRect = inPort.getBoundingClientRect();
                const endX = inRect.left - containerRect.left + inRect.width / 2;
                const endY = inRect.top - containerRect.top + inRect.height / 2;

                const cpX1 = startX + (endX - startX) * 0.4;
                const cpY1 = startY;
                const cpX2 = startX + (endX - startX) * 0.6;
                const cpY2 = endY;

                const color = '#8B5CF6';
                const strokeWidth = 2;
                const d = `M ${startX} ${startY} C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${endX} ${endY}`;
                newConnections.push({ d, color, strokeWidth });
              }
            });
          }
        }
      }
    }

    setConnections(newConnections);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      recalculateLines();
    }, 100);

    window.addEventListener('resize', recalculateLines);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', recalculateLines);
    };
  }, [selectedProjectId, selectedEmployeeId, weekEntries, projects.length]);

  const activeProject = projects.find(p => p.id === selectedProjectId);
  const activeEmployee = activeProject?.employees.find((e: any) => e.personId === selectedEmployeeId);

  return (
    <div className="bg-white border border-border-base rounded-xl shadow-sm overflow-hidden flex flex-col">
      <div className="p-5 border-b border-border-base flex items-center justify-between">
        <div>
          <h3 className="text-sm font-black text-navy">Interactive Hours Workflow Flowchart</h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Click a project node to view team members, then click a team member node to drill down to tasks of the selected project.
          </p>
        </div>
      </div>

      <div 
        ref={containerRef}
        className="node-workspace min-h-[500px] flex flex-row items-stretch gap-12 p-8 relative dot-grid-bg overflow-x-auto"
      >
        <style>{`
          .dot-grid-bg {
            background-color: #F8FAFC;
            background-image: radial-gradient(#CBD5E1 1.2px, transparent 1.2px);
            background-size: 18px 18px;
          }
          @keyframes strokeDash {
            to {
              stroke-dashoffset: -20;
            }
          }
          .stroke-animated {
            stroke-dasharray: 6, 4;
            animation: strokeDash 0.8s linear infinite;
          }
        `}</style>

        {/* SVG connection canvas */}
        <svg className="absolute inset-0 pointer-events-none w-full h-full z-0">
          {connections.map((conn, index) => (
            <path
              key={index}
              d={conn.d}
              fill="none"
              stroke={conn.color}
              strokeWidth={conn.strokeWidth}
              className={conn.strokeWidth > 1.5 ? "stroke-animated" : ""}
              style={{ transition: 'stroke 0.3s, stroke-width 0.3s' }}
            />
          ))}
        </svg>

        {/* COLUMN 1: PROJECTS */}
        <div className="flex-1 max-w-[280px] flex flex-col gap-4 z-10 shrink-0">
          <div className="text-[10px] uppercase font-black text-slate-400 tracking-wider mb-1 px-1">Projects</div>
          <div className="flex flex-col gap-3 max-h-[500px] overflow-y-auto pr-1">
            {projects.map((proj: any) => {
              const isSelected = selectedProjectId === proj.id;
              return (
                <div
                  key={proj.id}
                  onClick={() => handleProjectSelect(proj.id)}
                  className={`relative p-4 rounded-xl border-2 bg-white cursor-pointer transition-all duration-300 select-none shadow-xs group ${
                    isSelected 
                      ? 'border-dc-blue shadow-[0_4px_12px_rgba(30,144,232,0.12)]' 
                      : 'border-slate-200 hover:border-slate-300 hover:shadow-sm'
                  }`}
                >
                  <div className="flex flex-col gap-1">
                    <span className="font-black text-xs text-navy group-hover:text-dc-blue transition-colors leading-normal">{proj.name}</span>
                    <div className="flex items-center justify-between text-[10px] text-slate-500 mt-2 font-medium">
                      <span>Total hours:</span>
                      <strong className="text-dc-blue font-bold">{proj.totalHours} hrs</strong>
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-slate-500 font-medium">
                      <span>Bench/BAU:</span>
                      <strong className="text-slate-600 font-bold">{proj.benchHours} hrs</strong>
                    </div>
                  </div>
                  {/* Port handle */}
                  <div 
                    id={`port-out-proj-${proj.id}`}
                    className={`absolute right-0 top-1/2 -translate-y-1/2 translate-x-1.5 w-3 h-3 rounded-full border-2 border-white shadow-sm transition-transform duration-300 ${
                      isSelected ? 'bg-dc-blue scale-125' : 'bg-slate-300 hover:bg-slate-400'
                    }`}
                  />
                </div>
              );
            })}
            {projects.length === 0 && (
              <div className="p-6 bg-slate-50 border border-slate-200 rounded-xl text-center text-slate-400 font-semibold text-[11px]">
                No projects logged
              </div>
            )}
          </div>
        </div>

        {/* COLUMN 2: EMPLOYEES */}
        <div className="flex-1 max-w-[280px] flex flex-col gap-4 z-10 shrink-0">
          <div className="text-[10px] uppercase font-black text-slate-400 tracking-wider mb-1 px-1">Team Members</div>
          <div className="flex flex-col gap-3 max-h-[500px] overflow-y-auto pr-1">
            {activeProject ? (
              activeProject.employees.map((emp: any) => {
                const isSelected = selectedEmployeeId === emp.personId;
                return (
                  <div
                    key={emp.personId}
                    onClick={() => handleEmployeeSelect(emp.personId)}
                    className={`relative p-4 rounded-xl border-2 bg-white cursor-pointer transition-all duration-300 select-none shadow-xs group ${
                      isSelected 
                        ? 'border-purple-500 shadow-[0_4px_12px_rgba(139,92,246,0.12)]' 
                        : 'border-slate-200 hover:border-slate-300 hover:shadow-sm'
                    }`}
                  >
                    {/* Input Port handle */}
                    <div 
                      id={`port-in-emp-${selectedProjectId}-${emp.personId}`}
                      className={`absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1.5 w-3 h-3 rounded-full border-2 border-white shadow-sm transition-transform duration-300 ${
                        isSelected ? 'bg-dc-blue scale-110' : 'bg-slate-300'
                      }`}
                    />
                    
                    <div className="flex flex-col gap-1.5">
                      <span className="font-black text-xs text-navy group-hover:text-purple-600 transition-colors leading-none">{emp.name}</span>
                      <span className="text-[9px] text-slate-400 font-semibold uppercase">{emp.role} &bull; {emp.department}</span>
                      <div className="flex items-center justify-between text-[10px] mt-1.5 font-bold pt-1.5 border-t border-slate-100/60">
                        <span className="text-slate-500 font-medium">Logged hours:</span>
                        <span className="text-purple-600">{emp.totalHours} hrs</span>
                      </div>
                    </div>

                    {/* Output Port handle */}
                    <div 
                      id={`port-out-emp-${selectedProjectId}-${emp.personId}`}
                      className={`absolute right-0 top-1/2 -translate-y-1/2 translate-x-1.5 w-3 h-3 rounded-full border-2 border-white shadow-sm transition-transform duration-300 ${
                        isSelected ? 'bg-purple-500 scale-125' : 'bg-slate-300 hover:bg-slate-400'
                      }`}
                    />
                  </div>
                );
              })
            ) : (
              <div className="p-6 bg-slate-50/50 border border-slate-200 border-dashed rounded-xl text-center text-slate-400 font-medium text-[11px] h-32 flex items-center justify-center">
                Select a project on the left to see team members
              </div>
            )}
          </div>
        </div>

        {/* COLUMN 3: TASKS */}
        <div className="flex-1 max-w-[340px] flex flex-col gap-4 z-10 shrink-0">
          <div className="text-[10px] uppercase font-black text-slate-400 tracking-wider mb-1 px-1">Project Tasks Logged</div>
          <div className="flex flex-col gap-3 max-h-[500px] overflow-y-auto pr-1">
            {activeEmployee ? (
              activeEmployee.tasks.map((task: any, idx: number) => (
                <div
                  key={idx}
                  className="relative p-4 rounded-xl border border-slate-200 bg-white shadow-xs transition-shadow duration-300 hover:shadow-sm"
                >
                  {/* Input Port handle */}
                  <div 
                    id={`port-in-task-${idx}`}
                    className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1.5 w-3 h-3 rounded-full bg-purple-500 border-2 border-white shadow-sm"
                  />
                  
                  <div className="flex flex-col gap-2">
                    <div className="flex items-start justify-between gap-3">
                      <span className="font-black text-navy text-xs leading-tight">{task.name}</span>
                      <span className="text-[9px] font-black text-dc-blue bg-blue-50 border border-blue-100 px-1.5 py-0.5 rounded-md shrink-0">
                        {task.hours} hrs
                      </span>
                    </div>
                    {task.notes && (
                      <div className="text-[10px] text-slate-500 italic bg-slate-50 p-2 rounded-lg border border-slate-100/60 leading-relaxed font-sans font-medium">
                        "{task.notes}"
                      </div>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="p-6 bg-slate-50/50 border border-slate-200 border-dashed rounded-xl text-center text-slate-400 font-medium text-[11px] h-32 flex items-center justify-center">
                Select a team member to see task logs for this project
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
