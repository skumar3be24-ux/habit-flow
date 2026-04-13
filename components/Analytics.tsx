"use client";
import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { Habit } from '@/app/page';
import { format, subDays, eachDayOfInterval } from 'date-fns';

export default function Analytics({ habits }: { habits: Habit[] }) {
  // Phase 2 & 3: Compute robust analytics from completions table
  const stats = useMemo(() => {
    let totalCompletions = 0;
    let maxStreak = 0;
    const dailyCounts: { [key: string]: number } = {};
    const habitStats = habits.map(h => ({ name: h.name, count: h.completions?.length || 0 }));

    // Initialize last 14 days for the chart
    const last14Days = eachDayOfInterval({ start: subDays(new Date(), 13), end: new Date() }).map(d => format(d, 'MMM dd'));
    last14Days.forEach(d => dailyCounts[d] = 0);

    habits.forEach(habit => {
      totalCompletions += habit.completions?.length || 0;
      if (habit.best_streak > maxStreak) maxStreak = habit.best_streak;
      
      habit.completions?.forEach(c => {
        const dStr = format(new Date(c.completed_date), 'MMM dd');
        if (dailyCounts[dStr] !== undefined) dailyCounts[dStr]++;
      });
    });

    const chartData = Object.keys(dailyCounts).map(date => ({ date, completed: dailyCounts[date] }));
    const totalPossible = habits.length * 30; // Assuming 30 day window for simple score
    const productivityScore = habits.length ? Math.round((totalCompletions / totalPossible) * 100) : 0;

    return { totalCompletions, maxStreak, chartData, habitStats, productivityScore };
  }, [habits]);

  if (habits.length === 0) return <div className="text-center text-slate-500 py-12">Add habits to see analytics.</div>;

  return (
    <div className="space-y-6">
      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-[#131b2f] border border-white/5 p-6 rounded-[2rem]">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Productivity Score</p>
          <div className="text-4xl font-black text-indigo-400">{stats.productivityScore}%</div>
        </div>
        <div className="bg-[#131b2f] border border-white/5 p-6 rounded-[2rem]">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Total Completions</p>
          <div className="text-4xl font-black text-white">{stats.totalCompletions}</div>
        </div>
        <div className="bg-[#131b2f] border border-white/5 p-6 rounded-[2rem]">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Active Habits</p>
          <div className="text-4xl font-black text-orange-400">{habits.length}</div>
        </div>
        <div className="bg-[#131b2f] border border-white/5 p-6 rounded-[2rem]">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Best Global Streak</p>
          <div className="text-4xl font-black text-green-400">{stats.maxStreak} 🔥</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Daily Discipline Chart */}
        <div className="bg-[#131b2f] border border-white/5 p-8 rounded-[2rem] lg:col-span-2">
          <h3 className="text-xl font-bold text-white mb-6">Daily Discipline (Last 14 Days)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={stats.chartData}>
                <XAxis dataKey="date" stroke="#475569" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#475569" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 2 }} contentStyle={{ backgroundColor: '#1a233a', border: 'none', borderRadius: '12px', color: '#fff' }} />
                <Line type="monotone" dataKey="completed" stroke="#6366f1" strokeWidth={4} dot={{ r: 4, fill: '#6366f1', strokeWidth: 0 }} activeDot={{ r: 8 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Habit Breakdown */}
        <div className="bg-[#131b2f] border border-white/5 p-8 rounded-[2rem]">
          <h3 className="text-xl font-bold text-white mb-6">Habit Breakdown</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.habitStats} layout="vertical" margin={{ left: 0, right: 0 }}>
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} width={80} />
                <Tooltip cursor={{ fill: 'rgba(255,255,255,0.05)' }} contentStyle={{ backgroundColor: '#1a233a', border: 'none', borderRadius: '12px', color: '#fff' }} />
                <Bar dataKey="count" fill="#6366f1" radius={[0, 8, 8, 0]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}