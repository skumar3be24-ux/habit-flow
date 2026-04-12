"use client";
import React, { useState } from 'react';
import { Habit } from '@/app/page';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function Heatmap({ habit, onToggle }: { habit: Habit, onToggle: (id: string, date: string) => void }) {
  const [viewDate, setViewDate] = useState(new Date());
  const todayStr = new Date().toLocaleDateString('en-CA');

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthName = viewDate.toLocaleString('default', { month: 'long' });

  const changeMonth = (offset: number) => {
    setViewDate(new Date(year, month + offset, 1));
  };

  const gridCells = [];
  for (let i = 0; i < firstDayOfMonth; i++) gridCells.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    gridCells.push(dateStr);
  }

  return (
    <div className="mt-6">
      <div className="flex items-center justify-between mb-4 px-1">
        <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em]">Consistency Matrix</p>
        
        <div className="flex items-center gap-3 bg-white/5 p-1 px-2 rounded-lg border border-white/5">
          <button onClick={() => changeMonth(-1)} className="text-slate-500 hover:text-white transition-colors">
            <ChevronLeft size={14} />
          </button>
          <span className="text-[10px] font-bold min-w-[80px] text-center uppercase tracking-widest text-slate-300">
            {monthName} {year}
          </span>
          <button onClick={() => changeMonth(1)} className="text-slate-500 hover:text-white transition-colors">
            <ChevronRight size={14} />
          </button>
        </div>
      </div>

      {/* --- FIXED: Added max-w-sm to keep the grid compact --- */}
      <div className="grid grid-cols-7 gap-1.5 max-w-sm">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(day => (
          <div key={day} className="text-[8px] font-black text-slate-700 text-center">{day}</div>
        ))}
        
        {gridCells.map((dateStr, index) => {
          if (!dateStr) return <div key={`empty-${index}`} className="w-8 h-8" />;

          const active = habit.records && habit.records[dateStr];
          const isToday = dateStr === todayStr;
          const isBeforeStart = dateStr < habit.startDate;
          const isAfterEnd = habit.endDate ? dateStr > habit.endDate : false;
          
          const canInteract = isToday && !isBeforeStart && !isAfterEnd;
          const isLocked = !isToday || isBeforeStart || isAfterEnd;

          return (
            <div
              key={dateStr}
              onClick={() => canInteract && onToggle(habit.id, dateStr)}
              className={`
                w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-bold transition-all
                ${isLocked ? 'opacity-20 cursor-not-allowed bg-slate-800/30' : 'hover:scale-110 cursor-pointer shadow-md'}
                ${active ? 'text-white border-none' : 'bg-white/5 text-slate-600 border border-white/5'}
                ${isToday ? 'ring-1 ring-indigo-500 ring-offset-1 ring-offset-[#020617]' : ''}
              `}
              style={{ 
                backgroundColor: active ? habit.color : '', 
                boxShadow: active && isToday ? `0 0 15px ${habit.color}40` : '' 
              }}
            >
              {dateStr.split('-')[2]}
            </div>
          );
        })}
      </div>
    </div>
  );
}