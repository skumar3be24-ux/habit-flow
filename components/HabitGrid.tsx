"use client";

import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Plus, LayoutGrid, BarChart3, X } from 'lucide-react';
import HabitCard from '@/components/HabitCard';
import Analytics from '@/components/Analytics';

export type HabitRecord = { [date: string]: boolean };

export interface Habit {
  id: string;
  name: string;
  startDate: string;
  color: string;
  icon: string;
  records: HabitRecord;
}

export default function HabitTracker() {
  const [activeTab, setActiveTab] = useState<'Dashboard' | 'Analytics'>('Dashboard');
  const [habits, setHabits] = useState<Habit[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    const saved = localStorage.getItem('habit-pro-data');
    if (saved) setHabits(JSON.parse(saved));
  }, []);

  useEffect(() => {
    localStorage.setItem('habit-pro-data', JSON.stringify(habits));
  }, [habits]);

  const addHabit = () => {
    if (!newName.trim()) return;
    const colors = ["#3b82f6", "#a855f7", "#ec4899", "#f97316", "#10b981"];
    const newHabit: Habit = {
      id: crypto.randomUUID(),
      name: newName,
      startDate: startDate,
      color: colors[habits.length % colors.length],
      icon: "⚡",
      records: {},
    };
    setHabits([...habits, newHabit]);
    setNewName("");
    setIsModalOpen(false);
  };

  const deleteHabit = (id: string) => setHabits(habits.filter(h => h.id !== id));

  const toggleDate = (habitId: string, dateStr: string) => {
    setHabits(prev => prev.map(h => {
      if (h.id !== habitId) return h;
      const newRecords = { ...h.records };
      if (newRecords[dateStr]) delete newRecords[dateStr];
      else newRecords[dateStr] = true;
      return { ...h, records: newRecords };
    }));
  };

  return (
    <main className="min-h-screen bg-[#020617] text-slate-200 p-6 md:p-12">
      <div className="max-w-6xl mx-auto">
        <header className="flex flex-col md:flex-row justify-between items-center gap-6 mb-12">
          <h1 className="text-3xl font-black tracking-tighter">HABITFLOW</h1>
          <div className="flex bg-slate-900/50 p-1 rounded-2xl border border-white/5">
            <button onClick={() => setActiveTab('Dashboard')} className={`px-6 py-2 rounded-xl transition-all ${activeTab === 'Dashboard' ? 'bg-white/10 text-white' : 'text-slate-500'}`}>Dashboard</button>
            <button onClick={() => setActiveTab('Analytics')} className={`px-6 py-2 rounded-xl transition-all ${activeTab === 'Analytics' ? 'bg-white/10 text-white' : 'text-slate-500'}`}>Analytics</button>
          </div>
          <button onClick={() => setIsModalOpen(true)} className="bg-white text-black px-6 py-3 rounded-2xl font-bold flex items-center gap-2 hover:scale-105 transition-transform"><Plus size={20} /> New Habit</button>
        </header>

        <AnimatePresence mode="wait">
          {activeTab === 'Dashboard' ? (
            <motion.div key="dash" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">
              {habits.map(h => <HabitCard key={h.id} habit={h} onToggle={toggleDate} onDelete={deleteHabit} />)}
            </motion.div>
          ) : (
            <Analytics key="anlytc" habits={habits} />
          )}
        </AnimatePresence>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm bg-black/60">
          <div className="bg-slate-900 border border-white/10 p-8 rounded-[2.5rem] w-full max-w-md">
            <h2 className="text-2xl font-bold mb-6">Create Habit</h2>
            <input type="text" value={newName} onChange={(e) => setNewName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && e.preventDefault()} placeholder="Habit Name" className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 mb-4 outline-none focus:border-indigo-500" />
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 mb-6 outline-none" />
            <div className="flex gap-4">
              <button onClick={() => setIsModalOpen(false)} className="flex-1 py-4 text-slate-400 font-bold">Cancel</button>
              <button onClick={addHabit} className="flex-1 py-4 rounded-2xl font-bold bg-white text-black">Create</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}