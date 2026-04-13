"use client";
import React, { useState } from 'react';
import { MoreVertical, Check, X, Edit2, Trash2 } from 'lucide-react';
import { format, subDays } from 'date-fns';
import { Habit } from '@/app/page';

interface Props {
  habit: Habit;
  onToggle: (id: string, date: Date) => void;
  onDelete: (id: string) => void;
  onEdit: (id: string, name: string) => void;
}

export default function HabitCard({ habit, onToggle, onDelete, onEdit }: Props) {
  const [showMenu, setShowMenu] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(habit.name);

  // Generate last 30 days for the matrix
  const days = Array.from({ length: 30 }).map((_, i) => subDays(new Date(), 29 - i));
  
  // Create a set of strings from completion dates for fast lookup
  const completionDates = new Set(
    habit.completions?.map(c => c.completed_date) || []
  );

  const handleSaveEdit = () => {
    if (editName.trim() && editName !== habit.name) {
      onEdit(habit.id, editName);
    }
    setIsEditing(false);
    setShowMenu(false);
  };

  return (
    <div className="bg-[#131b2f] border border-white/5 rounded-[2rem] p-8 relative overflow-visible">
      <div className="flex justify-between items-start mb-6">
        <div className="flex gap-4 items-center">
          <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center text-xl shadow-inner">
            {habit.icon || '⚡'}
          </div>
          <div>
            {isEditing ? (
              <div className="flex items-center gap-2">
                <input 
                  value={editName} 
                  onChange={(e) => setEditName(e.target.value)} 
                  onKeyDown={(e) => e.key === 'Enter' && handleSaveEdit()}
                  className="bg-black/40 border border-indigo-500 p-1 rounded text-white outline-none"
                  autoFocus
                />
                <button onClick={handleSaveEdit} className="text-green-400 p-1"><Check size={18}/></button>
                <button onClick={() => setIsEditing(false)} className="text-slate-400 p-1"><X size={18}/></button>
              </div>
            ) : (
              <h3 className="text-xl font-bold text-white">{habit.name}</h3>
            )}
            <div className="flex gap-2 mt-1">
              <span className="text-[10px] bg-indigo-500/20 text-indigo-400 px-2 py-1 rounded font-black uppercase tracking-wider">
                LVL {habit.level || 1} • {habit.xp || 0}/100 XP
              </span>
              <span className="text-[10px] bg-orange-500/20 text-orange-400 px-2 py-1 rounded font-black uppercase tracking-wider">
                🔥 {habit.current_streak || 0} DAY STREAK
              </span>
            </div>
          </div>
        </div>

        {/* 3-Dot Dropdown Menu */}
        <div className="relative">
          <button 
            onClick={() => setShowMenu(!showMenu)} 
            className="p-2 text-slate-500 hover:text-white transition-colors"
          >
            <MoreVertical size={20}/>
          </button>
          
          {showMenu && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
              <div className="absolute right-0 mt-2 w-36 bg-[#1a233a] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-20">
                <button 
                  onClick={() => { setIsEditing(true); setShowMenu(false); }} 
                  className="w-full px-4 py-3 text-left text-sm text-white hover:bg-white/5 flex items-center gap-2 transition-colors"
                >
                  <Edit2 size={14}/> Edit Name
                </button>
                <button 
                  onClick={() => { onDelete(habit.id); setShowMenu(false); }} 
                  className="w-full px-4 py-3 text-left text-sm text-red-400 hover:bg-white/5 flex items-center gap-2 transition-colors"
                >
                  <Trash2 size={14}/> Delete
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Consistency Matrix Grid */}
      <div className="flex flex-wrap gap-2">
        {days.map((d, i) => {
          const dateStr = format(d, 'yyyy-MM-dd');
          const isDone = completionDates.has(dateStr);
          
          return (
            <button 
              key={i} 
              onClick={() => onToggle(habit.id, d)} 
              title={dateStr}
              className={`w-8 h-8 rounded-lg text-[10px] font-bold transition-all duration-200 flex items-center justify-center
                ${isDone 
                  ? 'bg-indigo-500 text-white shadow-[0_0_10px_rgba(99,102,241,0.4)]' 
                  : 'bg-white/5 text-slate-600 hover:bg-white/10'
                }`}
            >
              {format(d, 'd')}
            </button>
          );
        })}
      </div>
    </div>
  );
}