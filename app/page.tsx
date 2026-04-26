"use client";
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { AnimatePresence, motion } from 'framer-motion';
import { Plus, LogOut, Loader2, X } from 'lucide-react';
import confetti from 'canvas-confetti';
import HabitCard from '@/components/HabitCard';
import Analytics from '@/components/Analytics';
import { format } from 'date-fns';

export type HabitRecord = { [date: string]: boolean };
export interface Habit {
  id: string;
  name: string;
  type: 'boolean' | 'numeric';
  startDate?: string;
  endDate?: string | null;
  color: string;
  icon: string;
  records: HabitRecord;
  streak?: number;
  best_streak?: number;
  xp?: number;
  level?: number;
}

export default function HabitTracker() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [activeTab, setActiveTab] = useState<'Dashboard' | 'Analytics'>('Dashboard');
  
  // UI States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [motivationMsg, setMotivationMsg] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Login States
  const [email, setEmail] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  // New Habit States
  const [newName, setNewName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isOngoing, setIsOngoing] = useState(false);

  const [habitType, setHabitType] = useState<'boolean' | 'numeric'>('boolean');

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

  const fetchHabits = async () => {
    // Fetch habits and completions securely
    const { data: habitsData } = await supabase.from('habits').select('*').order('created_at', { ascending: true });
    const { data: compData } = await supabase.from('habit_completions').select('*');
    
    if (habitsData) {
      const merged = habitsData.map(h => {
        const records: HabitRecord = {};
        if (compData) {
          compData.filter(c => c.habit_id === h.id).forEach(c => {
            records[c.completed_date] = true;
          });
        }
        return { ...h, records };
      });
      setHabits(merged as Habit[]);
    }
  };

  const handleAddHabit = async () => {
    if (!newName.trim() || !user) return;
    setIsSubmitting(true);
    
    const newHabit = {
      user_id: user.id,
      name: newName,
      type: habitType,
      icon: "⚡",
      color: "#6366f1",
      xp: 0,
      level: 1,
      streak: 0,
      best_streak: 0
    };
    
    const { error } = await supabase.from('habits').insert([newHabit]);
    
    setIsSubmitting(false);
    if (!error) {
      fetchHabits();
      setNewName("");
      setIsModalOpen(false);
    } else {
      alert("Database Error: " + error.message);
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
    if (!habit || !user) return;
    
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    if (dateStr !== todayStr) return; // Strict frontend anti-cheat

    // 1. Determine new state
    const isCurrentlyCompleted = !!habit.records?.[dateStr];
    const willBeCompleted = !isCurrentlyCompleted;

    // 2. Optimistic UI Update
    const optimisticRecords = { ...(habit.records || {}) };
    if (willBeCompleted) optimisticRecords[dateStr] = true;
    else delete optimisticRecords[dateStr];

    setHabits(habits.map(h => h.id === habitId ? { ...h, records: optimisticRecords } : h));

    // 3. Call bulletproof backend API
    try {
      const response = await fetch('/api/habits/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ habit_id: habitId, date: dateStr, is_completed: willBeCompleted })
      });

      const result = await response.json();

      if (response.ok && result.updated_stats) {
        // 4. Sync exact math from the database back to UI
        setHabits(currentHabits => currentHabits.map(h => 
          h.id === habitId ? { 
            ...h, 
            records: optimisticRecords,
            streak: result.updated_stats.streak,
            xp: result.updated_stats.xp,
            level: result.updated_stats.level
          } : h
        ));

        if (willBeCompleted) {
          const msgs = ["🔥 Great job!", "Discipline > Motivation", "Consistency builds success"];
          setMotivationMsg(msgs[Math.floor(Math.random() * msgs.length)]);
          setTimeout(() => setMotivationMsg(""), 4000);
          
          if (result.updated_stats.xp < habit.xp!) {
             confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
          }
        }
      } else {
        fetchHabits(); // Revert on logic failure
      }
    } catch (error) {
      console.error("Failed to toggle habit:", error);
      fetchHabits(); // Revert on network error
    }
  };

  if (loading) return <div className="h-screen flex items-center justify-center bg-[#020617]"><Loader2 className="animate-spin text-indigo-500" size={40} /></div>;

  if (!user) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#020617] p-6">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-white/5 border border-white/10 p-10 rounded-[3rem] w-full max-w-md text-center backdrop-blur-xl">
          <h1 className="text-3xl font-black mb-2 tracking-tighter text-white uppercase italic">HabitFlow</h1>
          <p className="text-slate-500 mb-8">Login to track your habits.</p>
          <form onSubmit={async (e) => {
            e.preventDefault();
            if (!email) return;
            setLoginLoading(true);
            await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: window.location.origin } });
            setEmailSent(true);
            setLoginLoading(false);
          }} className="w-full flex flex-col gap-3">
            <input type="email" autoFocus required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Enter your email" className="w-full p-4 rounded-2xl bg-white/10 text-white outline-none focus:ring-2 focus:ring-indigo-500 transition-all" />
            <button type="submit" disabled={loginLoading || emailSent} className="w-full py-4 bg-white text-black font-bold rounded-2xl flex items-center justify-center gap-2 disabled:opacity-50 transition-all">
              {loginLoading ? "Sending..." : emailSent ? "✅ Link Sent!" : "Continue with Magic Link"}
            </button>
            {emailSent && <p className="text-xs text-indigo-400 mt-2">Check your email. You can safely close this tab.</p>}
          </form>
        </motion.div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#020617] text-slate-200 p-6 md:p-12">
      <div className="max-w-6xl mx-auto">
        <header className="flex flex-col md:flex-row justify-between items-center gap-6 mb-12">
          <div className="text-center md:text-left">
            <h1 className="text-3xl font-black tracking-tighter text-white uppercase italic">HABITFLOW</h1>
            <p className="text-indigo-400 text-xs font-bold uppercase tracking-widest mt-1 min-h-[16px] transition-all">
              {motivationMsg || `Consistency builds success`}
            </p>
          </div>
          <div className="flex gap-3 w-full md:w-auto justify-center">
             <div className="flex bg-slate-900/50 p-1 rounded-2xl border border-white/5 mr-2">
              <button onClick={() => setActiveTab('Dashboard')} className={`px-4 md:px-6 py-2 rounded-xl font-bold text-sm transition-colors ${activeTab === 'Dashboard' ? 'bg-white/10 text-white' : 'text-slate-500 hover:text-white'}`}>Dashboard</button>
              <button onClick={() => setActiveTab('Analytics')} className={`px-4 md:px-6 py-2 rounded-xl font-bold text-sm transition-colors ${activeTab === 'Analytics' ? 'bg-white/10 text-white' : 'text-slate-500 hover:text-white'}`}>Analytics</button>
            </div>
            <button onClick={() => supabase.auth.signOut()} className="p-3 bg-white/5 border border-white/10 rounded-2xl text-slate-400 hover:text-white transition-all"><LogOut size={20}/></button>
            <button onClick={() => setIsModalOpen(true)} className="bg-white text-black px-4 md:px-6 py-3 rounded-2xl font-bold flex items-center gap-2 hover:scale-105 transition-transform"><Plus size={20} className="hidden md:block"/> New</button>
          </div>
        </header>

        <AnimatePresence mode="wait">
          {activeTab === 'Dashboard' ? (
            <motion.div key="dash" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
              {habits.map(h => (
                <HabitCard key={h.id} habit={h} onToggle={toggleDate} onDelete={() => deleteHabit(h.id)} isConfirming={deleteConfirmId === h.id} />
              ))}
              {habits.length === 0 && (
                <div className="text-center py-20 border border-white/5 rounded-[3rem] bg-white/5">
                  <h3 className="text-xl font-bold text-white mb-2">No habits yet</h3>
                  <p className="text-slate-500">Click the New button to create your first habit.</p>
                </div>
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
                <h2 className="text-2xl font-bold text-white">Create New Habit</h2>
                <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white"><X size={24}/></button>
              </div>
              <div className="space-y-5">
                <input 
                  type="text" 
                  value={newName} 
                  onChange={(e) => setNewName(e.target.value)} 
                  onKeyDown={(e) => e.key === 'Enter' && handleAddHabit()}
                  placeholder="Habit Name" 
                  className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 outline-none text-white focus:border-indigo-500 transition-colors" 
                  autoFocus
                />

                {/* HABIT TYPE SELECTOR */}
                <div className="flex gap-3 bg-white/5 p-1.5 rounded-2xl border border-white/10">
                  <button
                    onClick={() => setHabitType('boolean')}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${habitType === 'boolean' ? 'bg-indigo-500 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
                  >
                    Checkmark
                  </button>
                  <button
                    onClick={() => setHabitType('numeric')}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${habitType === 'numeric' ? 'bg-indigo-500 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
                  >
                    Hours / Number
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="bg-white/5 border border-white/10 rounded-2xl p-4 text-white outline-none" />
                  <input type="date" value={endDate} disabled={isOngoing} onChange={(e) => setEndDate(e.target.value)} className={`bg-white/5 border border-white/10 rounded-2xl p-4 text-white outline-none ${isOngoing ? 'opacity-30' : ''}`} />
                </div>
                <button onClick={() => setIsOngoing(!isOngoing)} className="text-indigo-400 text-xs font-bold hover:text-indigo-300 transition-colors">
                  {isOngoing ? "Switch to fixed duration" : "Set as Ongoing"}
                </button>
                <button onClick={handleAddHabit} className="w-full py-4 rounded-2xl font-bold bg-white text-black mt-4 hover:bg-slate-200 transition-colors">
                  Create Habit
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </main>
  );
}