"use client";

import { useEffect, useState } from "react";
import { 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  Tooltip, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid,
  AreaChart,
  Area
} from "recharts";
import { Building2, TrendingUp, CalendarDays } from "lucide-react";

type DeptStat = {
  department: string;
  count: number;
};

type PopularCourse = {
  id: number;
  name: string;
  code: string;
  enrollment_count: number;
};

type EnrollmentTrend = {
  date: string;
  count: number;
};

type DashboardChartsProps = {
  departmentStats: DeptStat[];
  popularCourses: PopularCourse[];
  enrollmentTrends: EnrollmentTrend[];
};

const COLORS = [
  "#6366f1", // Indigo
  "#a855f7", // Purple
  "#f59e0b", // Amber
  "#10b981", // Emerald
  "#f43f5e", // Rose
  "#3b82f6", // Blue
];

export default function DashboardCharts({
  departmentStats,
  popularCourses,
  enrollmentTrends,
}: DashboardChartsProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="grid gap-6">
        <div className="h-[280px] rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 animate-pulse" />
        <div className="h-[280px] rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 animate-pulse" />
        <div className="h-[280px] rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 animate-pulse" />
      </div>
    );
  }

  // Format dates for the enrollment trend graph
  const formattedTrends = enrollmentTrends.map(item => {
    try {
      const date = new Date(item.date);
      return {
        ...item,
        formattedDate: date.toLocaleDateString([], { month: "short", day: "numeric" }),
      };
    } catch {
      return {
        ...item,
        formattedDate: item.date,
      };
    }
  });

  return (
    <div className="flex flex-col gap-6">
      {/* Enrollment Volume Trends Over Time */}
      <div className="rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 shadow-sm p-5">
        <div className="border-b border-zinc-200/60 dark:border-zinc-800/60 pb-4 mb-4 flex items-center gap-2">
          <CalendarDays className="h-5 w-5 text-indigo-500" />
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-white">Enrollment Volume Trends</h2>
        </div>
        
        {formattedTrends.length === 0 ? (
          <div className="h-[200px] flex items-center justify-center text-xs text-zinc-450 dark:text-zinc-500 italic">
            No enrollment trend records available yet.
          </div>
        ) : (
          <div className="h-[220px] w-full mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={formattedTrends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorEnrollments" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-zinc-100 dark:stroke-zinc-800/50" />
                <XAxis 
                  dataKey="formattedDate" 
                  tickLine={false}
                  axisLine={false}
                  className="text-[10px] fill-zinc-400 font-medium"
                />
                <YAxis 
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                  className="text-[10px] fill-zinc-400 font-medium"
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: "var(--color-bg-popover, #fff)", 
                    borderColor: "var(--color-border, #e4e4e7)",
                    borderRadius: "8px",
                    fontSize: "11px"
                  }}
                  itemStyle={{ color: "#6366f1" }}
                  labelClassName="text-zinc-900 dark:text-white font-semibold"
                />
                <Area 
                  type="monotone" 
                  dataKey="count" 
                  name="Enrollments"
                  stroke="#6366f1" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#colorEnrollments)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Grid for Pie Chart and Bar Chart */}
      <div className="grid gap-6 sm:grid-cols-2">
        {/* Department Distribution (Pie/Donut Chart) */}
        <div className="rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 shadow-sm p-5 flex flex-col justify-between">
          <div>
            <div className="border-b border-zinc-200/60 dark:border-zinc-800/60 pb-4 mb-4 flex items-center gap-2">
              <Building2 className="h-5 w-5 text-purple-500" />
              <h2 className="text-sm font-semibold text-zinc-900 dark:text-white">Department Distribution</h2>
            </div>

            {departmentStats.length === 0 ? (
              <div className="h-[180px] flex items-center justify-center text-xs text-zinc-450 dark:text-zinc-500 italic">
                Register students to generate department metrics.
              </div>
            ) : (
              <div className="flex flex-col items-center gap-4 py-2">
                <div className="h-[160px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={departmentStats}
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={65}
                        paddingAngle={3}
                        dataKey="count"
                        nameKey="department"
                      >
                        {departmentStats.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: "#fff", 
                          borderColor: "#e4e4e7",
                          borderRadius: "8px",
                          fontSize: "11px"
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="w-full space-y-1.5 max-h-[140px] overflow-y-auto pr-1">
                  {departmentStats.map((item, index) => (
                    <div key={index} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span 
                          className="h-2.5 w-2.5 rounded-full shrink-0" 
                          style={{ backgroundColor: COLORS[index % COLORS.length] }} 
                        />
                        <span className="font-medium text-zinc-650 dark:text-zinc-350 truncate max-w-[120px]">
                          {item.department}
                        </span>
                      </div>
                      <span className="font-bold text-zinc-850 dark:text-zinc-150">
                        {item.count}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Popular Courses (Bar Chart) */}
        <div className="rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 shadow-sm p-5 flex flex-col justify-between">
          <div>
            <div className="border-b border-zinc-200/60 dark:border-zinc-800/60 pb-4 mb-4 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-emerald-500" />
              <h2 className="text-sm font-semibold text-zinc-900 dark:text-white">Popular Courses</h2>
            </div>

            {popularCourses.length === 0 ? (
              <div className="h-[180px] flex items-center justify-center text-xs text-zinc-450 dark:text-zinc-500 italic">
                Create courses and enroll students.
              </div>
            ) : (
              <div className="h-[260px] w-full mt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={popularCourses} layout="vertical" margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} className="stroke-zinc-100 dark:stroke-zinc-800/50" />
                    <XAxis 
                      type="number" 
                      tickLine={false} 
                      axisLine={false} 
                      allowDecimals={false}
                      className="text-[10px] fill-zinc-400 font-medium"
                    />
                    <YAxis 
                      type="category" 
                      dataKey="code" 
                      width={70}
                      tickLine={false} 
                      axisLine={false}
                      className="text-[10px] fill-zinc-400 font-mono font-bold"
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: "#fff", 
                        borderColor: "#e4e4e7",
                        borderRadius: "8px",
                        fontSize: "11px"
                      }}
                      formatter={(value, name, props) => [value, "Students"]}
                      labelFormatter={(label) => {
                        const course = popularCourses.find(c => c.code === label);
                        return course ? course.name : label;
                      }}
                    />
                    <Bar 
                      dataKey="enrollment_count" 
                      radius={[0, 4, 4, 0]}
                      className="fill-emerald-500 dark:fill-emerald-400"
                    >
                      {popularCourses.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[(index + 3) % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
