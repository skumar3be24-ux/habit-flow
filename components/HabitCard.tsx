"use client";
import React, { useState } from 'react';
import { Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { 
  format, startOfMonth, endOfMonth, eachDayOfInterval, 
  isFuture, isToday, getDay, addMonths, subMonths, isSameDay
} from 'date-fns';
import { Habit } from '@/app/page';

interface Props {
  habit: Habit;
  onToggle: (id: string, date: Date) => void;
  onDelete: (id: string) => void;
}

export default function HabitCard({ habit, onToggle, onDelete }: Props) {
  const [viewDate, setViewDate] = useState(new Date());

  // --- CALENDAR MATH ---
  const monthStart = startOfMonth(viewDate);
  const monthEnd = endOfMonth(viewDate);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  
  // Calculate padding so the 1st of the month aligns with the correct day of the week
  const startDayIndex = getDay(monthStart); // 0 (Sun) to 6 (Sat)
  const blanks = Array.from({ length: startDayIndex });

  const completionDates = new Set(habit.completions?.map(c => c.completed_date) || []);

  return (
    <div className="bg-[#131b2f] border border-white/5 rounded-[2.5rem] p-6 md:p-8 relative shadow-xl overflow-hidden group">
      
      {/* Header Info */}
      <div className="flex justify-between items-start mb-8">
        <div className="flex gap-4 items-center">
          <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center text-xl border border-white/10 shadow-inner">
            {habit.icon || '⚡'}
          </div>
          <div>
            <h3 className="text-xl font-black text-white italic uppercase tracking-tight">{habit.name}</h3>
            <div className="flex gap-2 mt-2 flex-wrap">
              <span className="text-[10px] bg-indigo-500/10 text-indigo-400 px-3 py-1 rounded-full font-black border border-indigo-500/20">LVL {habit.level}</span>
              <span className="text-[10px] bg-orange-500/10 text-orange-400 px-3 py-1 rounded-full font-black border border-orange-500/20">🔥 {habit.current_streak} STREAK</span>
              <span className="text-[10px] bg-green-500/10 text-green-500/60 px-3 py-1 rounded-full font-black border border-green-500/10">🏆 BEST {habit.best_streak}</span>
            </div>
          </div>
        </div>
        
        <button 
          onClick={(e) => { e.stopPropagation(); onDelete(habit.id); }} 
          className="p-3 text-slate-600 hover:text-red-400 hover:bg-red-400/10 rounded-2xl transition-colors"
        >
          <Trash2 size={18}/>
        </button>
      </div>

      {/* Calendar Section */}
      <div className="max-w-[400px]">
        {/* Navigation */}
        <div className="flex justify-between items-center mb-3 px-1">
          <p className="text-xs font-black text-white uppercase tracking-widest">{format(viewDate, 'MMMM yyyy')}</p>
          <div className="flex gap-1">
            <button onClick={() => setViewDate(subMonths(viewDate, 1))} className="p-1.5 hover:bg-white/10 rounded-lg text-slate-400 transition-colors"><ChevronLeft size={16}/></button>
            <button 
              onClick={() => setViewDate(addMonths(viewDate, 1))} 
              className="p-1.5 hover:bg-white/10 rounded-lg text-slate-400 transition-colors"
              disabled={isSameDay(startOfMonth(viewDate), startOfMonth(new Date()))} // Optional UX: Prevent navigating past current month
            >
              <ChevronRight size={16}/>
            </button>
          </div>
        </div>

        {/* Grid Header */}
        <div className="grid grid-cols-7 gap-1.5 text-center mb-2">
          {['S','M','T','W','T','F','S'].map((d, i) => (
            <span key={i} className="text-[10px] font-black text-slate-500">{d}</span>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1.5">
          {blanks.map((_, i) => <div key={`blank-${i}`} />)}
          
          {daysInMonth.map((date) => {
            const dateStr = format(date, 'yyyy-MM-dd');
            const done = completionDates.has(dateStr);
            const future = isFuture(date);
            const today = isToday(date);
            const past = !today && !future;

            return (
              <button
                key={dateStr}
                disabled={!today} // STRICT ANTI-CHEAT: Disable if not today
                onClick={() => onToggle(habit.id, date)}
                className={`
                  aspect-square rounded-lg text-[11px] font-black transition-all flex items-center justify-center relative
                  ${done ? 'bg-indigo-500 text-white shadow-[0_0_12px_rgba(99,102,241,0.3)] border border-indigo-400/50' : 'bg-white/5 text-slate-500 border border-transparent'}
                  ${today ? 'ring-2 ring-indigo-500/50 ring-offset-2 ring-offset-[#131b2f] hover:scale-105 cursor-pointer text-indigo-300' : ''}
                  ${past && !done ? 'opacity-40 cursor-default' : ''}
                  ${future ? 'opacity-10 cursor-not-allowed grayscale' : ''}
                `}
              >
                {format(date, 'd')}
                {/* Visual indicator for today's cell */}
                {today && !done && <div className="absolute top-1 right-1 w-1 h-1 rounded-full bg-indigo-500 animate-pulse" />}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}