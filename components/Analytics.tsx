"use client";
import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Habit } from '@/app/page';
import { format, subDays, eachDayOfInterval } from 'date-fns';

export default function Analytics({ habits }: { habits: Habit[] }) {
  const stats = useMemo(() => {
    let totalCompletions = 0;
    const dailyCounts: { [key: string]: number } = {};
    const last14Days = eachDayOfInterval({ start: subDays(new Date(), 13), end: new Date() });
    
    last14Days.forEach(d => dailyCounts[format(d, 'MMM dd')] = 0);
    
    habits.forEach(h => {
      totalCompletions += h.completions.length;
      h.completions.forEach(c => {
        const d = format(new Date(c.completed_date), 'MMM dd');
        if (dailyCounts[d] !== undefined) dailyCounts[d]++;
      });
    });

    const chartData = Object.keys(dailyCounts).map(date => ({ date, completed: dailyCounts[date] }));
    const completionRate = habits.length ? Math.round((totalCompletions / (habits.length * 30)) * 100) : 0;

    return { totalCompletions, chartData, completionRate };
  }, [habits]);

  if (!habits.length) return <div className="p-10 text-center text-slate-500 mt-10 font-bold uppercase tracking-widest text-xs">Add habits to see analytics</div>;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-[#131b2f] p-8 rounded-[2rem] border border-white/5 shadow-lg">
          <p className="text-[10px] font-black text-slate-500 uppercase mb-2 tracking-[0.2em]">Completion Rate</p>
          <div className="text-4xl font-black text-indigo-400">{stats.completionRate}%</div>
        </div>
        <div className="bg-[#131b2f] p-8 rounded-[2rem] border border-white/5 shadow-lg">
          <p className="text-[10px] font-black text-slate-500 uppercase mb-2 tracking-[0.2em]">Total Completions</p>
          <div className="text-4xl font-black text-white">{stats.totalCompletions}</div>
        </div>
        <div className="bg-[#131b2f] p-8 rounded-[2rem] border border-white/5 shadow-lg">
          <p className="text-[10px] font-black text-slate-500 uppercase mb-2 tracking-[0.2em]">Active Goals</p>
          <div className="text-4xl font-black text-orange-400">{habits.length}</div>
        </div>
      </div>

      <div className="bg-[#131b2f] p-8 rounded-[2.5rem] border border-white/5 h-80 shadow-lg">
        <h3 className="text-lg font-black text-white italic mb-6 uppercase tracking-tight">Daily Discipline</h3>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={stats.chartData}>
            <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 10, fontWeight: 'bold'}} />
            <Tooltip cursor={{fill: 'rgba(255,255,255,0.02)'}} contentStyle={{backgroundColor: '#1a233a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '1rem', color: '#fff', fontWeight: 'bold'}} />
            <Bar dataKey="completed" fill="#6366f1" radius={[6, 6, 0, 0]} barSize={20} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}