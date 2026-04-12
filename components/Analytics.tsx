"use client";

import React, { useState, useMemo } from 'react';
import { Habit } from '@/app/page';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';
import { motion } from 'framer-motion';
import { Target, Zap, Trophy } from 'lucide-react';

export default function Analytics({ habits }: { habits: Habit[] }) {
  const [range, setRange] = useState<'7' | '30' | 'all'>('30');

  const chartData = useMemo(() => {
    const today = new Date();
    const daysToView = range === '7' ? 7 : range === '30' ? 30 : 90;
    const data = [];
    
    for (let i = daysToView - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      const dateStr = d.toLocaleDateString('en-CA');
      const dailyCount = habits.reduce((acc, h) => (h.records && h.records[dateStr] ? acc + 1 : acc), 0);
      
      data.push({
        date: dateStr.split('-').slice(1).join('/'),
        count: dailyCount,
      });
    }
    return data;
  }, [habits, range]);

  const stats = useMemo(() => {
    const totalImpact = habits.reduce((acc, h) => acc + (h.records ? Object.keys(h.records).length : 0), 0);
    
    // Calculate All-Time Max Streak
    let allTimeMax = 0;
    habits.forEach(habit => {
      const dates = Object.keys(habit.records || {}).sort();
      let currentStreak = 0;
      let maxH = 0;
      let lastDate: Date | null = null;

      dates.forEach(dStr => {
        const d = new Date(dStr);
        if (lastDate && (d.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24) === 1) {
          currentStreak++;
        } else {
          currentStreak = 1;
        }
        if (currentStreak > maxH) maxH = currentStreak;
        lastDate = d;
      });
      if (maxH > allTimeMax) allTimeMax = maxH;
    });

    return { totalImpact, maxStreak: allTimeMax };
  }, [habits]);

  const weeklyData = useMemo(() => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const dist = days.map(day => ({ day, count: 0 }));
    habits.forEach(h => {
      Object.keys(h.records || {}).forEach(dateStr => {
        const dayIndex = new Date(dateStr).getDay();
        dist[dayIndex].count++;
      });
    });
    return dist;
  }, [habits]);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white/5 border border-white/10 p-8 rounded-[2.5rem] flex items-center gap-6">
          <div className="w-14 h-14 rounded-2xl bg-indigo-500/20 flex items-center justify-center text-indigo-400"><Target size={24} /></div>
          <div><p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Total Impact</p><h4 className="text-3xl font-black">{stats.totalImpact}</h4></div>
        </div>
        <div className="bg-white/5 border border-white/10 p-8 rounded-[2.5rem] flex items-center gap-6">
          <div className="w-14 h-14 rounded-2xl bg-orange-500/20 flex items-center justify-center text-orange-400"><Zap size={24} /></div>
          <div><p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Active Goals</p><h4 className="text-3xl font-black">{habits.length}</h4></div>
        </div>
        <div className="bg-white/5 border border-white/10 p-8 rounded-[2.5rem] flex items-center gap-6">
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 flex items-center justify-center text-emerald-400"><Trophy size={24} /></div>
          <div><p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Best Streak</p><h4 className="text-3xl font-black">{stats.maxStreak}</h4></div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white/5 border border-white/10 p-8 rounded-[3rem]">
          <h3 className="text-xl font-bold mb-10">Daily Discipline</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs><linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/><stop offset="95%" stopColor="#6366f1" stopOpacity={0}/></linearGradient></defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff05" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#475569', fontSize: 10}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#475569', fontSize: 10}} allowDecimals={false} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)', fontSize: '12px' }} itemStyle={{ color: '#fff' }} />
                <Area type="monotone" dataKey="count" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorCount)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white/5 border border-white/10 p-8 rounded-[3rem]">
          <h3 className="text-xl font-bold mb-2">Weekly Profile</h3>
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