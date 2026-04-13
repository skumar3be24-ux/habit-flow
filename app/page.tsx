"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { AnimatePresence, motion } from 'framer-motion';
import { Plus, LogOut, Loader2, X } from 'lucide-react';
import confetti from 'canvas-confetti';
import HabitCard from '@/components/HabitCard';
import Analytics from '@/components/Analytics';
import { format } from 'date-fns';

export interface Completion { id: string; habit_id: string; completed_date: string; }
export interface Habit { id: string; name: string; color: string; icon: string; xp: number; level: number; current_streak: number; best_streak: number; completions?: Completion[]; }

export default function HabitTracker() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [activeTab, setActiveTab] = useState<'Dashboard' | 'Analytics'>('Dashboard');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newName, setNewName] = useState("");

  // Auth Fixes
  const [email, setEmail] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

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
    // Fetch habits and their relational completions
    const { data: habitsData } = await supabase.from('habits').select('*').order('created_at', { ascending: true });
    const { data: compData } = await supabase.from('completions').select('*');
    
    if (habitsData) {
      const merged = habitsData.map(h => ({
        ...h,
        completions: compData?.filter(c => c.habit_id === h.id) || []
      }));
      setHabits(merged);
    }
  };

  const handleAddHabit = async () => {
    if (!newName.trim() || !user) return;
    const { data } = await supabase.from('habits').insert([{ user_id: user.id, name: newName }]).select();
    if (data) {
      setHabits([...habits, { ...data[0], completions: [] }]);
      setNewName("");
      setIsModalOpen(false);
    }
  };

  const deleteHabit = async (id: string) => {
    setHabits(habits.filter(h => h.id !== id));
    await supabase.from('habits').delete().eq('id', id);
  };

  const updateHabitName = async (id: string, newName: string) => {
    setHabits(habits.map(h => h.id === id ? { ...h, name: newName } : h));
    await supabase.from('habits').update({ name: newName }).eq('id', id);
  };

  const toggleCompletion = async (habitId: string, dateObj: Date) => {
    const dateStr = format(dateObj, 'yyyy-MM-dd'); // Strict local timezone fix
    const habit = habits.find(h => h.id === habitId);
    if (!habit || !user) return;

    const isCompleted = habit.completions?.some(c => c.completed_date === dateStr);
    let newCompletions = [...(habit.completions || [])];
    let { xp, level, current_streak, best_streak } = habit;

    if (isCompleted) {
      // Remove
      newCompletions = newCompletions.filter(c => c.completed_date !== dateStr);
      await supabase.from('completions').delete().match({ habit_id: habitId, completed_date: dateStr });
    } else {
      // Add
      const newRecord = { habit_id: habitId, user_id: user.id, completed_date: dateStr };
      newCompletions.push({ id: 'temp', ...newRecord });
      await supabase.from('completions').insert([newRecord]);
      
      xp += 10;
      if (xp >= 100) { xp = 0; level += 1; confetti(); }
    }

    // Update Local State for instant UI feedback
    const updatedHabits = habits.map(h => h.id === habitId ? { ...h, completions: newCompletions, xp, level, current_streak, best_streak } : h);
    setHabits(updatedHabits);
    await supabase.from('habits').update({ xp, level, current_streak, best_streak }).eq('id', habitId);
  };

  if (loading) return <div className="h-screen flex items-center justify-center bg-[#0a0f1c]"><Loader2 className="animate-spin text-indigo-500" /></div>;

  if (!user) return (
    <div className="h-screen flex items-center justify-center bg-[#0a0f1c] p-6">
      <div className="bg-[#131b2f] border border-white/5 p-10 rounded-[2rem] w-full max-w-md text-center shadow-2xl">
        <h1 className="text-3xl font-black tracking-tighter text-white uppercase italic mb-2">HabitFlow</h1>
        <p className="text-slate-400 mb-8">Login to track your habits.</p> {/* UI TEXT FIX */}
        <form onSubmit={async (e) => {
            e.preventDefault();
            setLoginLoading(true);
            await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: window.location.origin } });
            setEmailSent(true);
            setLoginLoading(false);
          }} className="flex flex-col gap-4">
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Enter your email" className="w-full p-4 rounded-xl bg-black/20 border border-white/10 text-white outline-none focus:border-indigo-500" />
          <button type="submit" disabled={loginLoading || emailSent} className="w-full py-4 bg-white text-black font-bold rounded-xl disabled:opacity-50">
            {loginLoading ? "Sending..." : emailSent ? "✅ Link sent!" : "Continue with Magic Link"} {/* UI TEXT FIX */}
          </button>
        </form>
      </div>
    </div>
  );

  return (
    <main className="min-h-screen bg-[#0a0f1c] text-slate-200 p-6 md:p-12">
      <div className="max-w-6xl mx-auto space-y-8">
        <header className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-black text-white uppercase italic tracking-tighter">HABITFLOW</h1>
            <p className="text-indigo-400 text-xs font-bold uppercase tracking-widest mt-1">Consistency builds success</p>
          </div>
          <div className="flex gap-4">
             <div className="flex bg-[#131b2f] p-1 rounded-xl border border-white/5">
              <button onClick={() => setActiveTab('Dashboard')} className={`px-6 py-2 rounded-lg font-bold text-sm ${activeTab === 'Dashboard' ? 'bg-white/10 text-white' : 'text-slate-500'}`}>Dashboard</button>
              <button onClick={() => setActiveTab('Analytics')} className={`px-6 py-2 rounded-lg font-bold text-sm ${activeTab === 'Analytics' ? 'bg-white/10 text-white' : 'text-slate-500'}`}>Analytics</button>
            </div>
            <button onClick={() => setIsModalOpen(true)} className="bg-white text-black px-6 py-2 rounded-xl font-bold flex items-center gap-2"><Plus size={18}/> New</button>
            <button onClick={() => supabase.auth.signOut()} className="p-3 bg-white/5 rounded-xl"><LogOut size={18}/></button>
          </div>
        </header>

        {activeTab === 'Dashboard' ? (
          <div className="space-y-6">
            {habits.map(h => (
              <HabitCard key={h.id} habit={h} onToggle={toggleCompletion} onDelete={deleteHabit} onEdit={updateHabitName} />
            ))}
          </div>
        ) : (
          <Analytics habits={habits} />
        )}
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-[#131b2f] p-8 rounded-[2rem] w-full max-w-md">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-white">New Habit</h2>
                <button onClick={() => setIsModalOpen(false)}><X className="text-slate-500"/></button>
              </div>
              <input type="text" value={newName} onChange={e => setNewName(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAddHabit()} placeholder="Habit Name" className="w-full p-4 rounded-xl bg-black/20 border border-white/10 text-white mb-4 outline-none" autoFocus/>
              <button onClick={handleAddHabit} className="w-full py-4 bg-white text-black font-bold rounded-xl">Create Habit</button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </main>
  );
}