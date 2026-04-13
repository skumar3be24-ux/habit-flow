"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { AnimatePresence, motion } from 'framer-motion';
import { Plus, LogOut, Loader2 } from 'lucide-react';
import confetti from 'canvas-confetti';
import HabitCard from '@/components/HabitCard';
import Analytics from '@/components/Analytics';
import { format, isToday, isFuture, startOfToday, parseISO, subDays, differenceInDays } from 'date-fns';

export interface Completion { id: string; habit_id: string; completed_date: string; }
export interface Habit { 
  id: string; name: string; color: string; icon: string; 
  xp: number; level: number; current_streak: number; best_streak: number; 
  completions: Completion[]; 
}

export default function HabitTracker() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [activeTab, setActiveTab] = useState<'Dashboard' | 'Analytics'>('Dashboard');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newName, setNewName] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });
    supabase.auth.onAuthStateChange((_e, session) => setUser(session?.user ?? null));
  }, []);

  useEffect(() => {
    if (user) fetchData();
  }, [user]);

  const fetchData = async () => {
    const { data: habitsData } = await supabase.from('habits').select('*').order('created_at', { ascending: true });
    const { data: compData } = await supabase.from('completions').select('*');
    if (habitsData) {
      const merged = habitsData.map(h => ({
        ...h,
        completions: compData?.filter(c => c.habit_id === h.id) || []
      }));
      setHabits(merged as Habit[]);
    }
  };

  const calculateCurrentStreak = (dates: string[]) => {
    const todayStr = format(startOfToday(), 'yyyy-MM-dd');
    if (!dates.includes(todayStr)) return 0; // Rule: Must be completed today to have a streak
    
    let streak = 0;
    let checkDate = startOfToday();
    while (dates.includes(format(checkDate, 'yyyy-MM-dd'))) {
      streak++;
      checkDate = subDays(checkDate, 1);
    }
    return streak;
  };

  const calculateBestStreak = (dates: string[]) => {
    if (dates.length === 0) return 0;
    const sorted = Array.from(new Set(dates)).sort();
    let max = 0, current = 1;
    for (let i = 1; i < sorted.length; i++) {
      const diff = differenceInDays(parseISO(sorted[i]), parseISO(sorted[i-1]));
      if (diff === 1) current++;
      else { max = Math.max(max, current); current = 1; }
    }
    return Math.max(max, current);
  };

  const toggleCompletion = async (habitId: string, dateObj: Date) => {
    const todayStr = format(startOfToday(), 'yyyy-MM-dd');
    const clickedDateStr = format(dateObj, 'yyyy-MM-dd');

    // RULE: Only Today is editable. Future is disabled. Past is Read-Only.
    if (!isToday(dateObj)) return;

    const habit = habits.find(h => h.id === habitId);
    if (!habit || !user) return;

    const existing = habit.completions.find(c => c.completed_date === clickedDateStr);
    let updatedCompletions = [...habit.completions];
    let { xp, level } = habit;

    if (existing) {
      updatedCompletions = updatedCompletions.filter(c => c.completed_date !== clickedDateStr);
      await supabase.from('completions').delete().match({ habit_id: habitId, completed_date: clickedDateStr });
      xp = Math.max(0, xp - 5);
    } else {
      const { data } = await supabase.from('completions').insert([{ habit_id: habitId, user_id: user.id, completed_date: clickedDateStr }]).select();
      if (data) updatedCompletions.push(data[0]);
      
      // RULE: +5 XP only on Today toggle
      xp += 5;
      if (xp >= 100) { xp = 0; level += 1; confetti(); }
    }

    const currentStreak = calculateCurrentStreak(updatedCompletions.map(c => c.completed_date));
    const bestStreak = calculateBestStreak(updatedCompletions.map(c => c.completed_date));
    
    setHabits(habits.map(h => h.id === habitId ? { ...h, completions: updatedCompletions, xp, level, current_streak: currentStreak, best_streak: bestStreak } : h));
    await supabase.from('habits').update({ xp, level, current_streak: currentStreak, best_streak: bestStreak }).eq('id', habitId);
  };

  const handleAddHabit = async () => {
    if (!newName.trim() || !user) return;
    const { data } = await supabase.from('habits').insert([{ user_id: user.id, name: newName, level: 0, xp: 0 }]).select();
    if (data) { fetchData(); setNewName(""); setIsModalOpen(false); }
  };

  const deleteHabit = async (id: string) => {
    setHabits(habits.filter(h => h.id !== id));
    await supabase.from('habits').delete().eq('id', id);
  };

  if (loading) return <div className="h-screen bg-[#0a0f1c] flex items-center justify-center"><Loader2 className="animate-spin text-white"/></div>;

  return (
    <main className="min-h-screen bg-[#0a0f1c] text-slate-200 p-6 md:p-12">
      <div className="max-w-6xl mx-auto space-y-8">
        <header className="flex justify-between items-center">
          <h1 className="text-3xl font-black text-white italic tracking-tighter uppercase">HABITFLOW</h1>
          <div className="flex gap-4">
            <div className="flex bg-[#131b2f] p-1 rounded-xl border border-white/5">
              <button onClick={() => setActiveTab('Dashboard')} className={`px-6 py-2 rounded-lg text-sm font-bold ${activeTab === 'Dashboard' ? 'bg-white/10 text-white' : 'text-slate-500'}`}>Dashboard</button>
              <button onClick={() => setActiveTab('Analytics')} className={`px-6 py-2 rounded-lg text-sm font-bold ${activeTab === 'Analytics' ? 'bg-white/10 text-white' : 'text-slate-500'}`}>Analytics</button>
            </div>
            <button onClick={() => setIsModalOpen(true)} className="bg-white text-black px-6 py-2 rounded-xl font-bold">New</button>
            <button onClick={() => supabase.auth.signOut()} className="p-2 bg-white/5 rounded-xl"><LogOut size={20}/></button>
          </div>
        </header>

        {activeTab === 'Dashboard' ? (
          <div className="grid gap-6">
            {habits.map(h => <HabitCard key={h.id} habit={h} onToggle={toggleCompletion} onDelete={deleteHabit} />)}
          </div>
        ) : <Analytics habits={habits} />}
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-[#131b2f] p-8 rounded-[2rem] w-full max-w-md border border-white/10">
              <h2 className="text-xl font-bold text-white mb-6 uppercase">Create Habit</h2>
              <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Habit Name" className="w-full p-4 rounded-xl bg-black/30 border border-white/10 text-white outline-none mb-6" autoFocus />
              <button onClick={handleAddHabit} className="w-full py-4 bg-white text-black font-bold rounded-xl">Create</button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </main>
  );
}