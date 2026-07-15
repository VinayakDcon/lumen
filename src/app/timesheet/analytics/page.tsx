"use client";

import React, { useState } from "react";
import { useHoursAnalyticsQuery } from "@/hooks/use-pmo-queries";
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

  // Fetch report data
  const { data, isLoading } = useHoursAnalyticsQuery(selectedWeek || undefined);

  const availableWeeks = data?.available_weeks || [];
  const activeWeek = data?.selected_week || "";
  const resourceHours = data?.resource_hours || [];
  const projectDistribution = data?.project_distribution || [];
  const departmentAverages = data?.department_averages || [];

  const totalHoursLogged = data?.total_hours_logged || 0;
  const activeEmployeesCount = data?.active_employees_count || 0;
  const mostActiveProject = data?.most_active_project || "N/A";
  const leastActiveProject = data?.least_active_project || "N/A";

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

            {/* Right Card - Department Averages */}
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
          </div>

          {/* Detailed Data Table */}
          <div className="bg-white border border-border-base rounded-xl shadow-sm overflow-hidden">
            <div className="p-5 border-b border-border-base">
              <h3 className="text-sm font-black text-navy">Employee Weekly Timesheet Summary</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Detailed breakdowns of logged hours, billable vs non-billable categorization, and status.
              </p>
            </div>

            <div className="overflow-auto max-h-[650px]">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-55 text-[10px] uppercase font-black text-slate-400 border-b border-border-base">
                    <th className="py-3 px-5 sticky left-0 top-0 bg-slate-50 z-30 border-r border-slate-250">Employee Name</th>
                    <th className="py-3 px-5 sticky top-0 bg-slate-50 z-20">Department</th>
                    <th className="py-3 px-5 sticky top-0 bg-slate-50 z-20">Resource ID</th>
                    <th className="py-3 px-5 text-right sticky top-0 bg-slate-50 z-20">Billable (Hrs)</th>
                    <th className="py-3 px-5 text-right sticky top-0 bg-slate-50 z-20">Non-Billable (Hrs)</th>
                    <th className="py-3 px-5 text-right sticky top-0 bg-slate-50 z-20">Blocked (Hrs)</th>
                    <th className="py-3 px-5 text-right sticky top-0 bg-slate-50 z-20">Total (Hrs)</th>
                    <th className="py-3 px-5 text-center sticky top-0 bg-slate-50 z-20">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {resourceHours.map((r: any) => {
                    const statusInfo = getStatusColor(r.status);
                    return (
                      <tr key={r.person_id} className="group hover:bg-slate-50/50 transition-colors">
                        <td className="py-3 px-5 sticky left-0 bg-white group-hover:bg-slate-50 transition-colors z-10 border-r border-slate-200">
                          <span className="font-bold text-navy block">{r.name}</span>
                          <span className="text-[10px] text-slate-400 block">{r.role}</span>
                        </td>
                        <td className="py-3 px-5 text-slate-500 font-medium">{r.department}</td>
                        <td className="py-3 px-5 text-slate-500 font-mono font-semibold">{r.resource_id}</td>
                        <td className="py-3 px-5 text-right text-emerald-600 font-bold">{r.billable}</td>
                        <td className="py-3 px-5 text-right text-slate-500 font-semibold">{r.non_billable}</td>
                        <td className="py-3 px-5 text-right text-rose-500 font-semibold">{r.blocked}</td>
                        <td className="py-3 px-5 text-right text-navy font-bold">{r.total}</td>
                        <td className="py-3 px-5 text-center">
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-black border uppercase tracking-wider ${statusInfo.text}`}>
                            {r.total >= 45 ? "Target Met" : r.total >= 10 ? "Active" : "Under Limit"}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                  {resourceHours.length === 0 && (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-400 font-semibold">
                        No resource hours logged for this week.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
