"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { AnimatePresence, motion } from 'framer-motion';
import { Plus, LayoutGrid, BarChart3, LogOut, Loader2, Mail, X, Calendar as CalendarIcon, Infinity } from 'lucide-react';
import confetti from 'canvas-confetti';
import HabitCard from '@/components/HabitCard';
import Analytics from '@/components/Analytics';
import EmptyState from '@/components/EmptyState';

export type HabitRecord = { [date: string]: boolean };
export interface Habit {
  id: string;
  name: string;
  startDate: string;
  endDate: string | null;
  color: string;
  icon: string;
  records: HabitRecord;
}

export default function HabitTracker() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [activeTab, setActiveTab] = useState<'Dashboard' | 'Analytics'>('Dashboard');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const [newName, setNewName] = useState("");
  const [startDate, setStartDate] = useState(new Date().toLocaleDateString('en-CA'));
  const [endDate, setEndDate] = useState<string>("");
  const [isOngoing, setIsOngoing] = useState(true);

  const today = new Date().toLocaleDateString('en-CA');
  const habitsCompletedToday = habits.filter(h => h.records && h.records[today]).length;
  const completionPercentage = habits.length > 0 ? Math.round((habitsCompletedToday / habits.length) * 100) : 0;

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      setLoading(false);
    };
    checkUser();
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => authListener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (user) fetchHabits();
    else setHabits([]);
  }, [user]);

  useEffect(() => {
    if (completionPercentage === 100 && habits.length > 0) {
      const lastCelebration = localStorage.getItem('last_celebration');
      if (lastCelebration !== today) {
        confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
        localStorage.setItem('last_celebration', today);
      }
    }
  }, [completionPercentage, habits.length, today]);

  const fetchHabits = async () => {
    const { data, error } = await supabase.from('habits').select('*').order('created_at', { ascending: true });
    if (!error) setHabits(data);
  };

  const handleAddHabit = async () => {
    if (!newName.trim() || !user) return;
    const colors = ["#3b82f6", "#a855f7", "#ec4899", "#f97316", "#10b981"];
    const newHabit = {
      user_id: user.id,
      name: newName,
      start_date: startDate,
      end_date: isOngoing ? null : endDate,
      color: colors[habits.length % colors.length],
      icon: "⚡",
      records: {},
    };
    const { data, error } = await supabase.from('habits').insert([newHabit]).select();
    if (!error && data) {
      setHabits([...habits, data[0]]);
      setNewName("");
      setIsModalOpen(false);
    }
  };

  const deleteHabit = async (id: string) => {
    if (deleteConfirmId !== id) {
      setDeleteConfirmId(id);
      setTimeout(() => setDeleteConfirmId(prev => prev === id ? null : prev), 3000);
      return;
    }
    setHabits(habits.filter(h => h.id !== id));
    await supabase.from('habits').delete().eq('id', id);
    setDeleteConfirmId(null);
  };

  const toggleDate = async (habitId: string, dateStr: string) => {
    const habit = habits.find(h => h.id === habitId);
    if (!habit) return;
    const newRecords = { ...habit.records };
    if (newRecords[dateStr]) delete newRecords[dateStr];
    else newRecords[dateStr] = true;
    setHabits(habits.map(h => h.id === habitId ? { ...h, records: newRecords } : h));
    await supabase.from('habits').update({ records: newRecords }).eq('id', habitId);
  };

  if (loading) return <div className="h-screen flex items-center justify-center bg-[#020617]"><Loader2 className="animate-spin text-indigo-500" size={40} /></div>;

  if (!user) return (
    <div className="h-screen flex items-center justify-center bg-[#020617] p-6">
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-white/5 border border-white/10 p-10 rounded-[3rem] w-full max-w-md text-center backdrop-blur-xl">
        <h1 className="text-3xl font-black mb-2 tracking-tighter text-white uppercase italic">HabitFlow</h1>
        <p className="text-slate-500 mb-8">Login to sync habits across devices.</p>
        <button 
          onClick={() => {
            const email = prompt("Enter your email:");
            if (email) supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: window.location.origin } });
          }}
          className="w-full py-4 bg-white text-black font-bold rounded-2xl flex items-center justify-center gap-2"
        >
          <Mail size={20} /> Continue with Magic Link
        </button>
      </motion.div>
    </div>
  );

  return (
    <main className="min-h-screen bg-[#020617] text-slate-200 p-6 md:p-12">
      <div className="max-w-6xl mx-auto">
        <header className="flex flex-col md:flex-row justify-between items-center gap-6 mb-12">
          <div className="text-center md:text-left">
            <h1 className="text-3xl font-black tracking-tighter text-white uppercase italic">HABITFLOW</h1>
            <p className="text-indigo-400 text-xs font-bold uppercase tracking-widest">{user.email}</p>
          </div>
          <div className="flex bg-slate-900/50 p-1 rounded-2xl border border-white/5">
            <button onClick={() => setActiveTab('Dashboard')} className={`px-6 py-2 rounded-xl font-bold text-sm ${activeTab === 'Dashboard' ? 'bg-white/10 text-white' : 'text-slate-500'}`}>Dashboard</button>
            <button onClick={() => setActiveTab('Analytics')} className={`px-6 py-2 rounded-xl font-bold text-sm ${activeTab === 'Analytics' ? 'bg-white/10 text-white' : 'text-slate-500'}`}>Analytics</button>
          </div>
          <div className="flex gap-3">
            <button onClick={() => supabase.auth.signOut()} className="p-3 bg-white/5 border border-white/10 rounded-2xl text-slate-400 hover:text-white transition-all"><LogOut size={20}/></button>
            <button onClick={() => setIsModalOpen(true)} className="bg-white text-black px-6 py-3 rounded-2xl font-bold flex items-center gap-2 hover:scale-105 transition-transform"><Plus size={20} /> New Habit</button>
          </div>
        </header>

        {activeTab === 'Dashboard' && habits.length > 0 && (
          <div className="mb-12 bg-white/[0.03] border border-white/10 rounded-[2.5rem] p-8 flex flex-col md:flex-row items-center justify-between gap-6">
            <div><h2 className="text-2xl font-bold text-white">Today's Focus</h2><p className="text-slate-400 text-sm mt-1">Completed {habitsCompletedToday} of {habits.length} habits.</p></div>
            <div className="relative w-24 h-24 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90">
                <circle cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-white/5" />
                <circle cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="8" fill="transparent" strokeDasharray={251.2} strokeDashoffset={251.2 - (251.2 * completionPercentage) / 100} className="text-indigo-500 transition-all duration-1000" strokeLinecap="round" />
              </svg>
              <span className="absolute text-lg font-black text-white">{completionPercentage}%</span>
            </div>
          </div>
        )}

        <AnimatePresence mode="wait">
          {activeTab === 'Dashboard' ? (
            <motion.div key="dash" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
              {habits.length > 0 ? (
                habits.map(h => <HabitCard key={h.id} habit={h} onToggle={toggleDate} onDelete={() => deleteHabit(h.id)} isConfirming={deleteConfirmId === h.id} />)
              ) : (
                <EmptyState onAction={() => setIsModalOpen(true)} />
              )}
            </motion.div>
          ) : (
            <Analytics habits={habits} />
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsModalOpen(false)} className="absolute inset-0 bg-black/80 backdrop-blur-md" />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative bg-[#0f172a] border border-white/10 p-8 rounded-[2.5rem] w-full max-w-md shadow-2xl">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Create New Habit</h2>
                <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white"><X size={24}/></button>
              </div>
              <div className="space-y-5">
                <input type="text" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Habit Name" className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 outline-none text-white" />
                <div className="grid grid-cols-2 gap-4">
                  <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="bg-white/5 border border-white/10 rounded-2xl p-4 text-white" />
                  <input type="date" value={endDate} disabled={isOngoing} onChange={(e) => setEndDate(e.target.value)} className={`bg-white/5 border border-white/10 rounded-2xl p-4 text-white ${isOngoing ? 'opacity-30' : ''}`} />
                </div>
                <button onClick={() => setIsOngoing(!isOngoing)} className="text-indigo-400 text-xs font-bold">{isOngoing ? "Switch to fixed duration" : "Set as Ongoing"}</button>
                <button onClick={handleAddHabit} className="w-full py-4 rounded-2xl font-bold bg-white text-black mt-4">Create</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </main>
  );
}