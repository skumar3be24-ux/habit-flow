"use client";
import React, { useMemo } from 'react';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts';
import { motion } from 'framer-motion';
import { Habit } from '@/app/page';
import { format, subDays, eachDayOfInterval } from 'date-fns';

export default function Analytics({ habits }: { habits: Habit[] }) {
  const stats = useMemo(() => {
    let totalCompletions = 0;
    let globalBestStreak = 0;
    
    const dailyCounts: { [key: string]: number } = {};
    const weeklyCounts: { [key: string]: number } = { 'Sun': 0, 'Mon': 0, 'Tue': 0, 'Wed': 0, 'Thu': 0, 'Fri': 0, 'Sat': 0 };
    const breakdown: { name: string; count: number }[] = [];
    
    const last14Days = eachDayOfInterval({ start: subDays(new Date(), 13), end: new Date() });
    last14Days.forEach(d => dailyCounts[format(d, 'MMM dd')] = 0);
    
    habits.forEach(h => {
      const records = h.records || {};
      const dates = Object.keys(records).filter(k => records[k]);
      
      const count = dates.length;
      totalCompletions += count;
      breakdown.push({ name: h.name, count });

      const best = h.best_streak || h.streak || 0;
      if (best > globalBestStreak) globalBestStreak = best;

      dates.forEach(dateStr => {
        const [year, month, day] = dateStr.split('-');
        const d = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
        const formatDaily = format(d, 'MMM dd');
        const formatWeekly = format(d, 'EEE'); 
        
        if (dailyCounts[formatDaily] !== undefined) dailyCounts[formatDaily]++;
        if (weeklyCounts[formatWeekly] !== undefined) weeklyCounts[formatWeekly]++;
      });
    });

    const cData = Object.keys(dailyCounts).map(date => ({ date, count: dailyCounts[date] }));
    const wData = Object.keys(weeklyCounts).map(day => ({ day, count: weeklyCounts[day] }));
    const rawProdScore = habits.length > 0 ? Math.round((totalCompletions / (habits.length * 30)) * 100) : 0;
    
    breakdown.sort((a, b) => b.count - a.count);

    return { 
      totalCompletions, activeHabits: habits.length, globalBestStreak, 
      productivityScore: Math.min(100, rawProdScore), chartData: cData, 
      weeklyData: wData, habitBreakdown: breakdown
    };
  }, [habits]);

  if (!habits || habits.length === 0) return <div className="py-20 text-center border border-white/5 rounded-[3rem] bg-white/5"><h3 className="text-xl font-bold text-white mb-2">No data yet</h3><p className="text-slate-500 uppercase text-[10px] tracking-widest font-bold">Add habits to unlock your analytics dashboard</p></div>;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-8">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <div className="bg-white/5 border border-white/10 p-6 md:p-8 rounded-[2rem] shadow-xl"><p className="text-[10px] font-black text-slate-500 uppercase mb-2 tracking-[0.2em]">Productivity Score</p><div className="text-3xl md:text-4xl font-black text-indigo-400">{stats.productivityScore}%</div></div>
        <div className="bg-white/5 border border-white/10 p-6 md:p-8 rounded-[2rem] shadow-xl"><p className="text-[10px] font-black text-slate-500 uppercase mb-2 tracking-[0.2em]">Total Completions</p><div className="text-3xl md:text-4xl font-black text-white">{stats.totalCompletions}</div></div>
        <div className="bg-white/5 border border-white/10 p-6 md:p-8 rounded-[2rem] shadow-xl"><p className="text-[10px] font-black text-slate-500 uppercase mb-2 tracking-[0.2em]">Active Habits</p><div className="text-3xl md:text-4xl font-black text-orange-400">{stats.activeHabits}</div></div>
        <div className="bg-white/5 border border-white/10 p-6 md:p-8 rounded-[2rem] shadow-xl"><p className="text-[10px] font-black text-slate-500 uppercase mb-2 tracking-[0.2em]">Best Global Streak</p><div className="text-3xl md:text-4xl font-black text-green-400">{stats.globalBestStreak} 🔥</div></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white/5 border border-white/10 p-6 md:p-8 rounded-[3rem] shadow-xl">
          <h3 className="text-xl font-bold mb-8 text-white">Daily Discipline (14 Days)</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.chartData}>
                <defs><linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#6366f1" stopOpacity={0.4}/><stop offset="95%" stopColor="#6366f1" stopOpacity={0}/></linearGradient></defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff05" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#475569', fontSize: 10}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#475569', fontSize: 10}} allowDecimals={false} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)', fontSize: '12px' }} itemStyle={{ color: '#fff', fontWeight: 'bold' }} />
                <Area type="monotone" dataKey="count" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorCount)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white/5 border border-white/10 p-6 md:p-8 rounded-[3rem] shadow-xl">
          <h3 className="text-xl font-bold mb-8 text-white">Weekly Profile</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.weeklyData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fill: '#475569', fontSize: 10}} />
                <Tooltip cursor={{fill: 'rgba(255,255,255,0.02)'}} contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }} />
                <Bar dataKey="count" radius={[6, 6, 6, 6]}>{stats.weeklyData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.count > 0 ? '#6366f1' : '#1e293b'} />)}</Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="bg-white/5 border border-white/10 p-6 md:p-8 rounded-[3rem] shadow-xl">
        <h3 className="text-xl font-bold mb-8 text-white">Habit Breakdown</h3>
        <div className="h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={stats.habitBreakdown} layout="vertical" margin={{ top: 0, right: 20, left: 0, bottom: 0 }}>
              <XAxis type="number" hide />
              <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12, fontWeight: 'bold'}} width={120} />
              <Tooltip cursor={{fill: 'rgba(255,255,255,0.02)'}} contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }} />
              <Bar dataKey="count" fill="#8b5cf6" radius={[0, 6, 6, 0]} barSize={24}>{stats.habitBreakdown.map((entry, index) => <Cell key={`cell-${index}`} fill={['#6366f1', '#8b5cf6', '#ec4899', '#f97316', '#10b981'][index % 5]} />)}</Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </motion.div>
  );
}