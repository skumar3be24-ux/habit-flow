"use client";
import React from 'react';
import { Trash2 } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isAfter, startOfToday, getDay } from 'date-fns';
import { Habit } from '@/app/page';

interface Props {
  habit: Habit;
  onToggle: (id: string, date: Date) => void;
  onDelete: (id: string) => void;
  onEdit: (id: string, name: string) => void;
}

export default function HabitCard({ habit, onToggle, onDelete, onEdit }: Props) {
  const today = startOfToday();
  const monthStart = startOfMonth(new Date());
  const monthEnd = endOfMonth(new Date());
  const dateRange = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startDay = getDay(monthStart); // 0 (Sun) to 6 (Sat)
  const emptyDays = Array.from({ length: startDay });
  const completionDates = new Set(habit.completions?.map(c => c.completed_date) || []);

  return (
    <div className="bg-[#131b2f] border border-white/5 rounded-[2.5rem] p-8 relative shadow-xl">
      <div className="flex justify-between items-start mb-8">
        <div className="flex gap-5 items-center">
          <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center text-2xl border border-white/10">
            {habit.icon || '⚡'}
          </div>
          <div>
            <h3 className="text-2xl font-black text-white tracking-tight italic uppercase">{habit.name}</h3>
            <div className="flex gap-3 mt-2">
              <span className="text-[10px] bg-indigo-500/20 text-indigo-400 px-3 py-1 rounded-full font-black uppercase tracking-widest border border-indigo-500/30">
                LVL {habit.level}
              </span>
              <span className="text-[10px] bg-orange-500/20 text-orange-400 px-3 py-1 rounded-full font-black uppercase tracking-widest border border-orange-500/30">
                🔥 {habit.current_streak} DAY STREAK
              </span>
              <span className="text-[10px] bg-green-500/10 text-green-500/60 px-3 py-1 rounded-full font-black uppercase tracking-widest">
                🏆 Best: {habit.best_streak}
              </span>
            </div>
          </div>
        </div>
        <button onClick={() => onDelete(habit.id)} className="p-3 bg-white/5 text-slate-500 hover:text-red-400 rounded-2xl transition-all">
          <Trash2 size={20}/>
        </button>
      </div>
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">{format(new Date(), 'MMMM yyyy')}</p>
          <div className="flex gap-[1.1rem] text-[9px] font-black text-slate-600 uppercase pr-1">
             <span>S</span><span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span>
          </div>
        </div>
        <div className="grid grid-cols-7 gap-3">
          {emptyDays.map((_, i) => <div key={`empty-${i}`} />)}
          {dateRange.map((date) => {
            const dateStr = format(date, 'yyyy-MM-dd');
            const isDone = completionDates.has(dateStr);
            const isFuture = isAfter(date, today);
            const isToday = isSameDay(date, today);
            return (
              <button
                key={dateStr}
                disabled={isFuture}
                onClick={() => onToggle(habit.id, date)}
                className={`aspect-square rounded-xl text-xs font-black transition-all relative flex items-center justify-center
                  ${isDone ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/30' : 'bg-white/5 text-slate-500'}
                  ${isFuture ? 'opacity-10 cursor-not-allowed' : 'hover:scale-110 active:scale-95'}
                  ${isToday && !isDone ? 'ring-2 ring-indigo-500/40 text-indigo-400' : ''}`}
              >
                {format(date, 'd')}
                {isToday && <div className="absolute -bottom-1 w-1 h-1 bg-indigo-400 rounded-full" />}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}