"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { AnimatePresence, motion } from 'framer-motion';
import { LogOut, Loader2, X } from 'lucide-react';
import confetti from 'canvas-confetti';
import HabitCard from '@/components/HabitCard';
import Analytics from '@/components/Analytics';
import { format, isToday, startOfToday, parseISO, subDays, differenceInDays } from 'date-fns';

export interface Completion { id: string; habit_id: string; completed_date: string; }
export interface Habit {
  id: string; name: string; color: string; icon: string;
  xp: number; level: number; current_streak: number; best_streak: number;
  completions: Completion[];
}

// --- STREAK HELPERS ---
const calculateStreaks = (datesStr: string[]) => {
  if (!datesStr.length) return { current: 0, best: 0 };

  const sorted = Array.from(new Set(datesStr)).sort().reverse();
  const today = format(startOfToday(), 'yyyy-MM-dd');
  const yesterday = format(subDays(startOfToday(), 1), 'yyyy-MM-dd');

  // Current streak: must end on today or yesterday
  let current = 0;
  const startDate = sorted.includes(today)
    ? today
    : sorted.includes(yesterday)
    ? yesterday
    : null;

  if (startDate) {
    let d = parseISO(startDate);
    while (sorted.includes(format(d, 'yyyy-MM-dd'))) {
      current++;
      d = subDays(d, 1);
    }
  }

  // Best streak: scan ascending
  let best = 0;
  let tempBest = 0;
  const ascSorted = [...sorted].reverse();
  for (let i = 0; i < ascSorted.length; i++) {
    if (i === 0) {
      tempBest = 1;
    } else {
      const diff = differenceInDays(parseISO(ascSorted[i]), parseISO(ascSorted[i - 1]));
      tempBest = diff === 1 ? tempBest + 1 : 1;
    }
    if (tempBest > best) best = tempBest;
  }

  return { current, best };
};

export default function HabitTracker() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [activeTab, setActiveTab] = useState<'Dashboard' | 'Analytics'>('Dashboard');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newName, setNewName] = useState("");

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Subscribe to auth changes and clean up on unmount
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (user) fetchData();
  }, [user]);

  const fetchData = async () => {
    const { data: habitsData } = await supabase
      .from('habits')
      .select('*')
      .order('created_at', { ascending: true });

    const { data: compData } = await supabase.from('completions').select('*');

    if (habitsData) {
      const merged = habitsData.map(h => ({
        ...h,
        completions: compData?.filter(c => c.habit_id === h.id) || []
      }));
      setHabits(merged as Habit[]);
    }
  };

  const toggleCompletion = async (habitId: string, dateObj: Date) => {
    // ANTI-CHEAT: Only today is allowed
    if (!isToday(dateObj)) return;

    const clickedDateStr = format(dateObj, 'yyyy-MM-dd');

    // Read current habit state directly (avoid stale closure)
    setHabits(prev => {
      const habit = prev.find(h => h.id === habitId);
      if (!habit || !user) return prev;
      // We'll handle async below; return prev unchanged for now
      return prev;
    });

    const habit = habits.find(h => h.id === habitId);
    if (!habit || !user) return;

    const existing = habit.completions.find(c => c.completed_date === clickedDateStr);
    let updatedCompletions = [...habit.completions];
    let { xp, level } = habit;

    if (existing) {
      // Un-complete: remove and deduct XP
      updatedCompletions = updatedCompletions.filter(c => c.completed_date !== clickedDateStr);
      await supabase
        .from('completions')
        .delete()
        .match({ habit_id: habitId, completed_date: clickedDateStr });
      xp = Math.max(0, xp - 5);
    } else {
      // Complete: add and award XP
      const { data } = await supabase
        .from('completions')
        .insert([{ habit_id: habitId, user_id: user.id, completed_date: clickedDateStr }])
        .select();
      if (data) updatedCompletions.push(data[0]);

      xp += 5;
      if (xp >= 100) {
        xp = 0;
        level += 1;
        confetti();
      }
    }

    const { current, best } = calculateStreaks(updatedCompletions.map(c => c.completed_date));

    // FIX: Use functional updater to avoid stale closure
    setHabits(prev =>
      prev.map(h =>
        h.id === habitId
          ? { ...h, completions: updatedCompletions, xp, level, current_streak: current, best_streak: best }
          : h
      )
    );

    // Sync to DB
    await supabase
      .from('habits')
      .update({ xp, level, current_streak: current, best_streak: best })
      .eq('id', habitId);
  };

  const handleAddHabit = async () => {
    if (!newName.trim()) return;
    if (!user?.id) return;

    const { data } = await supabase
      .from('habits')
      .insert([{
        user_id: user.id,
        name: newName.trim(),
        level: 0,
        xp: 0,
        current_streak: 0,
        best_streak: 0
      }])
      .select();

    if (data) {
      setNewName("");
      setIsModalOpen(false);
      fetchData();
    }
  };

  const deleteHabit = async (id: string) => {
    setHabits(prev => prev.filter(h => h.id !== id));
    await supabase.from('habits').delete().eq('id', id);
  };

  // ---- RENDER ----

  if (loading) {
    return (
      <div className="h-screen bg-[#0a0f1c] flex items-center justify-center">
        <Loader2 className="animate-spin text-white" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="h-screen bg-[#0a0f1c] flex items-center justify-center p-6">
        <div className="bg-[#131b2f] p-10 rounded-[2rem] w-full max-w-md text-center border border-white/5 shadow-2xl">
          <h1 className="text-3xl font-black text-white italic tracking-tighter uppercase mb-2">HABITFLOW</h1>
          <p className="text-slate-400 mb-8 uppercase font-bold text-[10px] tracking-widest">
            Login to track your habits
          </p>
          <button
            onClick={() => {
              const email = prompt("Enter your email");
              if (email) {
                supabase.auth.signInWithOtp({
                  email,
                  options: { emailRedirectTo: window.location.origin }
                });
              }
            }}
            className="w-full py-4 bg-white text-black font-bold rounded-xl hover:bg-slate-200 transition-colors"
          >
            Continue with Magic Link
          </button>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#0a0f1c] text-slate-200 p-6 md:p-12 relative">
      <div className="max-w-6xl mx-auto space-y-8">

        {/* Header */}
        <header className="flex flex-col md:flex-row justify-between items-center gap-6">
          <h1 className="text-3xl font-black text-white italic tracking-tighter uppercase">HABITFLOW</h1>
          <div className="flex gap-4">
            <div className="flex bg-[#131b2f] p-1 rounded-xl border border-white/5">
              <button
                onClick={() => setActiveTab('Dashboard')}
                className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${
                  activeTab === 'Dashboard' ? 'bg-white/10 text-white' : 'text-slate-500 hover:text-white'
                }`}
              >
                Dashboard
              </button>
              <button
                onClick={() => setActiveTab('Analytics')}
                className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${
                  activeTab === 'Analytics' ? 'bg-white/10 text-white' : 'text-slate-500 hover:text-white'
                }`}
              >
                Analytics
              </button>
            </div>
            <button
              onClick={() => setIsModalOpen(true)}
              className="bg-white text-black px-6 py-2 rounded-xl font-bold hover:scale-105 transition-all"
            >
              New
            </button>
            <button
              onClick={() => supabase.auth.signOut()}
              className="p-3 bg-[#131b2f] border border-white/5 rounded-xl hover:bg-white/10 transition-all"
            >
              <LogOut size={18} />
            </button>
          </div>
        </header>

        {/* Content */}
        {activeTab === 'Dashboard' ? (
          <div className="grid gap-6">
            {habits.map(h => (
              <HabitCard key={h.id} habit={h} onToggle={toggleCompletion} onDelete={deleteHabit} />
            ))}
            {habits.length === 0 && (
              <p className="text-center text-slate-500 mt-10">No habits yet. Click "New" to start.</p>
            )}
          </div>
        ) : (
          <Analytics habits={habits} />
        )}
      </div>

      {/* Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop — clicking this closes the modal */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            {/* Modal panel — FIX: stopPropagation prevents backdrop click from firing */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="relative bg-[#131b2f] p-8 rounded-[2rem] w-full max-w-md border border-white/10 shadow-2xl"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-white uppercase tracking-tight">Create Habit</h2>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-slate-500 hover:text-white"
                >
                  <X size={20} />
                </button>
              </div>

              <input
                value={newName}
                onChange={e => setNewName(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddHabit();
                  }
                }}
                placeholder="e.g. Read 10 pages"
                className="w-full p-4 rounded-xl bg-black/30 border border-white/10 text-white outline-none focus:border-indigo-500 transition-colors mb-6"
                autoFocus
              />

              <button
                onClick={handleAddHabit}
                disabled={!newName.trim()}
                className="w-full py-4 bg-white text-black font-bold rounded-xl shadow-lg hover:bg-slate-200 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Create Habit
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </main>
  );
}