"use client";
import React, { useMemo } from 'react';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts';
import { motion } from 'framer-motion';
import { Habit } from '@/app/page';
import { format, subDays, eachDayOfInterval } from 'date-fns';

export default function Analytics({ habits }: { habits: Habit[] }) {
  const { chartData, weeklyData } = useMemo(() => {
    const dailyCounts: { [key: string]: number } = {};
    const weeklyCounts: { [key: string]: number } = { 'Sun': 0, 'Mon': 0, 'Tue': 0, 'Wed': 0, 'Thu': 0, 'Fri': 0, 'Sat': 0 };
    
    // Setup last 14 days for AreaChart
    const last14Days = eachDayOfInterval({ start: subDays(new Date(), 13), end: new Date() });
    last14Days.forEach(d => dailyCounts[format(d, 'MMM dd')] = 0);
    
    habits.forEach(h => {
      const records = h.records || {};
      Object.keys(records).forEach(dateStr => {
        const d = new Date(dateStr);
        const formatDaily = format(d, 'MMM dd');
        const formatWeekly = format(d, 'EEE'); // 'Sun', 'Mon', etc.
        
        if (dailyCounts[formatDaily] !== undefined) dailyCounts[formatDaily]++;
        if (weeklyCounts[formatWeekly] !== undefined) weeklyCounts[formatWeekly]++;
      });
    });

    const cData = Object.keys(dailyCounts).map(date => ({ date, count: dailyCounts[date] }));
    const wData = Object.keys(weeklyCounts).map(day => ({ day, count: weeklyCounts[day] }));

    return { chartData: cData, weeklyData: wData };
  }, [habits]);

  if (!habits.length) return <div className="p-10 text-center text-slate-500 mt-10 font-bold uppercase tracking-widest text-xs">Add habits to see analytics</div>;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Daily Discipline AreaChart */}
        <div className="lg:col-span-2 bg-white/5 border border-white/10 p-8 rounded-[3rem]">
          <h3 className="text-xl font-bold mb-10 text-white">Daily Discipline</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff05" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#475569', fontSize: 10}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#475569', fontSize: 10}} allowDecimals={false} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)', fontSize: '12px' }} itemStyle={{ color: '#fff' }} />
                <Area type="monotone" dataKey="count" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorCount)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Weekly Profile BarChart */}
        <div className="bg-white/5 border border-white/10 p-8 rounded-[3rem]">
          <h3 className="text-xl font-bold mb-2 text-white">Weekly Profile</h3>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyData}>
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fill: '#475569', fontSize: 10}} />
                <Bar dataKey="count" radius={[6, 6, 6, 6]}>
                  {weeklyData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.count > 0 ? '#6366f1' : '#1e293b'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </motion.div>
  );
}