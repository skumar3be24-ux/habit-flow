"use client";
import React, { useState } from 'react';
import { MoreVertical, Edit2, Trash2, Check, X } from 'lucide-react';
import { format, subDays, isSameDay } from 'date-fns';
import { Habit } from '@/app/page';

interface Props {
  habit: Habit;
  onToggle: (id: string, date: Date) => void;
  onDelete: (id: string) => void;
  onEdit: (id: string, newName: string) => void;
}

export default function HabitCard({ habit, onToggle, onDelete, onEdit }: Props) {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(habit.name);
  const [showMenu, setShowMenu] = useState(false);

  // Generate last 30 days for the matrix
  const days = Array.from({ length: 30 }).map((_, i) => subDays(new Date(), 29 - i));
  const completionSet = new Set(habit.completions?.map(c => c.completed_date));

  const handleSaveEdit = () => {
    if (editName.trim()) onEdit(habit.id, editName);
    setIsEditing(false);
  };

  return (
    <div className="bg-[#131b2f] border border-white/5 rounded-[2rem] p-8 relative">
      <div className="flex justify-between items-start mb-8">
        <div className="flex gap-4 items-center">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center text-xl bg-white/5 border border-white/10">{habit.icon}</div>
          <div>
            {isEditing ? (
              <div className="flex items-center gap-2">
                <input value={editName} onChange={e => setEditName(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSaveEdit()} autoFocus className="bg-black/20 text-white font-bold text-xl px-2 py-1 rounded outline-none border border-indigo-500" />
                <button onClick={handleSaveEdit} className="text-green-400 p-1"><Check size={18}/></button>
                <button onClick={() => setIsEditing(false)} className="text-slate-400 p-1"><X size={18}/></button>
              </div>
            ) : (
              <h3 className="text-xl font-bold text-white">{habit.name}</h3>
            )}
            <div className="flex gap-2 mt-1">
              <span className="text-[10px] bg-indigo-500/20 text-indigo-400 px-2 py-1 rounded font-black uppercase tracking-wider">LVL {habit.level} • {habit.xp}/100 XP</span>
              <span className="text-[10px] bg-orange-500/20 text-orange-400 px-2 py-1 rounded font-black uppercase tracking-wider">🔥 {habit.current_streak} DAY STREAK</span>
            </div>
          </div>
        </div>

        {/* 3-Dot Edit/Delete Menu */}
        <div className="relative">
          <button onClick={() => setShowMenu(!showMenu)} className="p-2 bg-white/5 rounded-lg text-slate-400 hover:text-white"><MoreVertical size={18}/></button>
          {showMenu && (
            <div className="absolute right-0 mt-2 w-36 bg-[#1a233a] border border-white/10 rounded-xl shadow-xl overflow-hidden z-10">
              <button onClick={() => { setIsEditing(true); setShowMenu(false); }} className="w-full text-left px-4 py-3 text-sm text-white hover:bg-white/5 flex items-center gap-2"><Edit2 size={14}/> Edit Name</button>
              <button onClick={() => { onDelete(habit.id); setShowMenu(false); }} className="w-full text-left px-4 py-3 text-sm text-red-400 hover:bg-white/5 flex items-center gap-2"><Trash2 size={14}/> Delete</button>
            </div>
          )}
        </div>
      </div>

      {/* FIXED: Consistency Matrix */}
      <div>
        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Consistency Matrix (30 Days)</p>
        <div className="flex flex-wrap gap-2">
          {days.map((date, i) => {
            const dateStr = format(date, 'yyyy-MM-dd');
            const isDone = completionSet.has(dateStr);
            const isToday = isSameDay(date, new Date());
            
            return (
              <button 
                key={i} 
                onClick={() => onToggle(habit.id, date)}
                title={dateStr}
                className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${isDone ? 'bg-indigo-500 text-white shadow-[0_0_10px_rgba(99,102,241,0.5)]' : 'bg-white/5 text-slate-600 hover:bg-white/10'} ${isToday && !isDone ? 'ring-2 ring-indigo-500/50' : ''}`}
              >
                {format(date, 'dd')}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}