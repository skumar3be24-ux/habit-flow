"use client";
import React, { useState } from 'react';
import { Trash2, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { 
  format, startOfMonth, endOfMonth, eachDayOfInterval, 
  isFuture, isToday, getDay, addMonths, subMonths, isSameDay
} from 'date-fns';
import { Habit } from '@/app/page';

interface Props {
  habit: Habit;
  onToggle: (id: string, dateStr: string) => void;
  onDelete: () => void;
  isConfirming?: boolean;
}

export default function HabitCard({ habit, onToggle, onDelete, isConfirming }: Props) {
  const [viewDate, setViewDate] = useState(new Date());

  // --- CALENDAR MATH ---
  const monthStart = startOfMonth(viewDate);
  const monthEnd = endOfMonth(viewDate);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  
  // Calculate padding so the 1st of the month aligns with the correct day of the week
  const startDayIndex = getDay(monthStart); // 0 (Sun) to 6 (Sat)
  const blanks = Array.from({ length: startDayIndex });

  // Use the records directly for O(1) fast lookup
  const records = habit.records || {};

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
              <span className="text-[10px] bg-indigo-500/10 text-indigo-400 px-3 py-1 rounded-full font-black border border-indigo-500/20">
                LVL {habit.level || 1} • {habit.xp || 0}/100 XP
              </span>
              <span className="text-[10px] bg-orange-500/10 text-orange-400 px-3 py-1 rounded-full font-black border border-orange-500/20">
                🔥 {habit.streak || 0} STREAK
              </span>
            </div>
            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mt-2">
              {habit.endDate ? 'Goal Oriented' : '∞ Ongoing'}
            </p>
          </div>
        </div>
        
        <button 
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className={`p-3 rounded-2xl transition-all duration-300 flex items-center gap-2 ${
            isConfirming 
              ? 'bg-red-500 text-white px-5 scale-105 shadow-lg shadow-red-500/20' 
              : 'bg-white/5 text-slate-500 hover:text-red-400 hover:bg-red-400/10'
          }`}
        >
          {isConfirming ? (
            <>
              <span className="text-[10px] font-black uppercase tracking-tighter">Confirm?</span>
              <X size={16} strokeWidth={3} />
            </>
          ) : (
            <Trash2 size={20} />
          )}
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
              disabled={isSameDay(startOfMonth(viewDate), startOfMonth(new Date()))} 
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
          {blanks.map((_, i) => <div key={`blank-${i}`} className="aspect-square" />)}
          
          {daysInMonth.map((date) => {
            const dateStr = format(date, 'yyyy-MM-dd');
            const done = records[dateStr];
            const future = isFuture(date);
            const today = isToday(date);
            const past = !today && !future;

            return (
              <button
                key={dateStr}
                disabled={!today} // STRICT ANTI-CHEAT: Disable if not today
                onClick={() => onToggle(habit.id, dateStr)}
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