"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { AnimatePresence, motion } from 'framer-motion';
import { Plus, LogOut, Loader2, X } from 'lucide-react';
import confetti from 'canvas-confetti';
import HabitCard from '@/components/HabitCard';
import Analytics from '@/components/Analytics';
import { format, subDays } from 'date-fns';

export type HabitRecord = { [date: string]: boolean };
export interface Habit {
  id: string;
  name: string;
  startDate: string;
  endDate: string | null;
  color: string;
  icon: string;
  records: HabitRecord;
  streak?: number;
  last_completed?: string | null;
  xp?: number;
  level?: number;
}

// ----------------------------------------------------------------------
// 🔥 THE FIX: Pure function to calculate streaks from absolute truth
// ----------------------------------------------------------------------
const calculateExactStreak = (records: HabitRecord): number => {
  if (!records) return 0;

  const today = new Date();
  const todayStr = format(today, 'yyyy-MM-dd');
  const yesterdayStr = format(subDays(today, 1), 'yyyy-MM-dd');

  let currentStreak = 0;
  let checkDate = today;

  // Start counting from today (if completed) or yesterday (if today isn't done yet)
  if (records[todayStr]) {
    checkDate = today;
  } else if (records[yesterdayStr]) {
    checkDate = subDays(today, 1);
  } else {
    // If neither today nor yesterday is done, the streak is officially 0
    return 0; 
  }

  // Count unbroken consecutive days backwards
  while (true) {
    const checkStr = format(checkDate, 'yyyy-MM-dd');
    if (records[checkStr]) {
      currentStreak++;
      checkDate = subDays(checkDate, 1);
    } else {
      break; // The chain is broken, stop counting
    }
  }

  return currentStreak;
};

export default function HabitTracker() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [activeTab, setActiveTab] = useState<'Dashboard' | 'Analytics'>('Dashboard');
  
  // UI States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [motivationMsg, setMotivationMsg] = useState("");

  // Login States
  const [email, setEmail] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  // New Habit States
  const [newName, setNewName] = useState("");
  const [startDate, setStartDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState<string>("");
  const [isOngoing, setIsOngoing] = useState(true);

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
    if (user) {
      fetchHabits();
    } else {
      setHabits([]);
    }
  }, [user]);

  const fetchHabits = async () => {
    const { data, error } = await supabase
      .from('habits')
      .select('*')
      .order('created_at', { ascending: true });
      
    if (!error && data) {
      setHabits(data);
    }
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
      streak: 0,
      xp: 0,
      level: 1
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

  // ----------------------------------------------------------------------
  // 🔥 THE FIX: Bulletproof Toggle Logic
  // ----------------------------------------------------------------------
  const toggleDate = async (habitId: string, dateStr: string) => {
    const habit = habits.find(h => h.id === habitId);
    if (!habit || !user) return;
    
    // 1. Create a fresh copy of records to avoid React mutation bugs
    const newRecords = { ...(habit.records || {}) };
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    
    let { xp = 0, level = 1 } = habit;

    // 2. Toggle the specific date record securely
    if (newRecords[dateStr]) {
      delete newRecords[dateStr];
      if (dateStr === todayStr) {
        xp = Math.max(0, xp - 10);
      }
    } else {
      newRecords[dateStr] = true;
      if (dateStr === todayStr) {
        xp += 10;
        if (xp >= 100) { 
          xp = 0; 
          level += 1; 
          confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
        }
        
        const msgs = ["🔥 Great job!", "Discipline > Motivation", "Consistency builds success"];
        setMotivationMsg(msgs[Math.floor(Math.random() * msgs.length)]);
        setTimeout(() => setMotivationMsg(""), 4000);
      }
    }

    // 3. Recalculate the exact streak strictly from the newly constructed records
    const freshStreak = calculateExactStreak(newRecords);

    // 4. Update the UI state with absolute truth values
    const updatedHabits = habits.map(h => 
      h.id === habitId 
        ? { ...h, records: newRecords, streak: freshStreak, xp, level } 
        : h
    );
    setHabits(updatedHabits);

    // 5. Sync pure data securely to Supabase
    await supabase
      .from('habits')
      .update({ records: newRecords, streak: freshStreak, xp, level })
      .eq('id', habitId);
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#020617]">
        <Loader2 className="animate-spin text-indigo-500" size={40} />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#020617] p-6">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-white/5 border border-white/10 p-10 rounded-[3rem] w-full max-w-md text-center backdrop-blur-xl">
          <h1 className="text-3xl font-black mb-2 tracking-tighter text-white uppercase italic">HabitFlow</h1>
          <p className="text-slate-500 mb-8">Login to track your habits.</p>
          
          <form 
            onSubmit={async (e) => {
              e.preventDefault();
              if (!email) return;
              setLoginLoading(true);
              await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: window.location.origin } });
              setEmailSent(true);
              setLoginLoading(false);
            }} 
            className="w-full flex flex-col gap-3"
          >
            <input 
              type="email" 
              autoFocus 
              required
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              placeholder="Enter your email" 
              className="w-full p-4 rounded-2xl bg-white/10 text-white outline-none focus:ring-2 focus:ring-indigo-500 transition-all" 
            />
            <button 
              type="submit" 
              disabled={loginLoading || emailSent}
              className="w-full py-4 bg-white text-black font-bold rounded-2xl flex items-center justify-center gap-2 disabled:opacity-50 transition-all"
            >
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
              <button onClick={() => setActiveTab('Dashboard')} className={`px-4 md:px-6 py-2 rounded-xl font-bold text-sm ${activeTab === 'Dashboard' ? 'bg-white/10 text-white' : 'text-slate-500'}`}>Dashboard</button>
              <button onClick={() => setActiveTab('Analytics')} className={`px-4 md:px-6 py-2 rounded-xl font-bold text-sm ${activeTab === 'Analytics' ? 'bg-white/10 text-white' : 'text-slate-500'}`}>Analytics</button>
            </div>
            <button onClick={() => supabase.auth.signOut()} className="p-3 bg-white/5 border border-white/10 rounded-2xl text-slate-400 hover:text-white transition-all"><LogOut size={20}/></button>
            <button onClick={() => setIsModalOpen(true)} className="bg-white text-black px-4 md:px-6 py-3 rounded-2xl font-bold flex items-center gap-2 hover:scale-105 transition-transform"><Plus size={20} className="hidden md:block"/> New</button>
          </div>
        </header>

        <AnimatePresence mode="wait">
          {activeTab === 'Dashboard' ? (
            <motion.div key="dash" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
              {habits.map(h => (
                <HabitCard 
                  key={h.id} 
                  habit={h} 
                  onToggle={toggleDate} 
                  onDelete={() => deleteHabit(h.id)} 
                  isConfirming={deleteConfirmId === h.id} 
                />
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