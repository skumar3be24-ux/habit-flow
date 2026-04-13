"use client";
import React, { useState } from 'react';
import { Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { 
  format, startOfMonth, endOfMonth, eachDayOfInterval, 
  isSameDay, isFuture, isToday, getDay, addMonths, subMonths 
} from 'date-fns';
import { Habit } from '@/app/page';

interface Props {
  habit: Habit;
  onToggle: (id: string, date: Date) => void;
  onDelete: (id: string) => void;
}

export default function HabitCard({ habit, onToggle, onDelete }: Props) {
  const [viewDate, setViewDate] = useState(new Date());

  // Calendar Logic
  const monthStart = startOfMonth(viewDate);
  const monthEnd = endOfMonth(viewDate);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  
  // Calculate empty leading cells (Sun = 0)
  const startDayIndex = getDay(monthStart);
  const blanks = Array.from({ length: startDayIndex });

  const completionDates = new Set(habit.completions?.map(c => c.completed_date) || []);

  return (
    <div className="bg-[#131b2f] border border-white/5 rounded-[2.5rem] p-8 relative shadow-xl">
      <div className="flex justify-between items-start mb-8">
        <div className="flex gap-4 items-center">
          <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center text-xl border border-white/10">
            {habit.icon || '⚡'}
          </div>
          <div>
            <h3 className="text-xl font-black text-white italic uppercase tracking-tight">{habit.name}</h3>
            <div className="flex gap-2 mt-1">
              <span className="text-[9px] bg-indigo-500/20 text-indigo-400 px-2 py-0.5 rounded-full font-black border border-indigo-500/30">LVL {habit.level}</span>
              <span className="text-[9px] bg-orange-500/20 text-orange-400 px-2 py-0.5 rounded-full font-black border border-orange-500/30">🔥 {habit.current_streak} DAY STREAK</span>
            </div>
          </div>
        </div>
        <button onClick={() => onDelete(habit.id)} className="p-2 text-slate-600 hover:text-red-400 transition-colors">
          <Trash2 size={18}/>
        </button>
      </div>

      <div className="space-y-4">
        {/* Month Navigation */}
        <div className="flex justify-between items-center px-1">
          <p className="text-[11px] font-black text-white uppercase tracking-widest">{format(viewDate, 'MMMM yyyy')}</p>
          <div className="flex gap-1">
            <button onClick={() => setViewDate(subMonths(viewDate, 1))} className="p-1 hover:bg-white/5 rounded-lg text-slate-400"><ChevronLeft size={16}/></button>
            <button onClick={() => setViewDate(addMonths(viewDate, 1))} className="p-1 hover:bg-white/5 rounded-lg text-slate-400"><ChevronRight size={16}/></button>
          </div>
        </div>

        {/* Compact Grid Header */}
        <div className="grid grid-cols-7 gap-1 text-center mb-1">
          {['S','M','T','W','T','F','S'].map(d => (
            <span key={d} className="text-[9px] font-black text-slate-600">{d}</span>
          ))}
        </div>

        {/* Calendar Cells */}
        <div className="grid grid-cols-7 gap-1.5">
          {blanks.map((_, i) => <div key={`blank-${i}`} />)}
          
          {daysInMonth.map((date) => {
            const dateStr = format(date, 'yyyy-MM-dd');
            const done = completionDates.has(dateStr);
            const future = isFuture(date);
            const today = isToday(date);

            return (
              <button
                key={dateStr}
                disabled={future || (!today && !done)} // Strict rule: Can't edit past if not done, can't edit future
                onClick={() => onToggle(habit.id, date)}
                className={`
                  aspect-square rounded-md text-[10px] font-bold transition-all flex items-center justify-center
                  ${done ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20' : 'bg-white/5 text-slate-600'}
                  ${today && !done ? 'ring-1 ring-indigo-500/50 text-indigo-400' : ''}
                  ${future ? 'opacity-20 cursor-not-allowed' : 'hover:scale-105'}
                  ${!today && !future && !done ? 'opacity-40 cursor-default' : ''}
                `}
              >
                {format(date, 'd')}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}