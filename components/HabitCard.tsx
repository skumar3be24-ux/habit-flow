"use client";
import React from 'react';
import { Trash2, X } from 'lucide-react';
import Heatmap from './Heatmap';

interface Props {
  habit: any;
  onToggle: (id: string, date: string) => void;
  onDelete: () => void;
  isConfirming: boolean;
}

export default function HabitCard({ habit, onToggle, onDelete, isConfirming }: Props) {
  return (
    <div className="bg-white/[0.03] border border-white/10 rounded-[2.5rem] p-8 backdrop-blur-md relative overflow-hidden group">
      <div className="flex justify-between items-start mb-6">
        <div className="flex items-center gap-5">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shadow-inner" style={{ backgroundColor: `${habit.color}20`, color: habit.color }}>
            {habit.icon || '⚡'}
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">{habit.name}</h3>
            
            {/* Gamification & Streak Badges */}
            <div className="flex gap-2 mt-2">
              {habit.streak > 0 && (
                <span className="text-[10px] bg-orange-500/20 text-orange-400 px-2 py-1 rounded-md font-black uppercase tracking-wider">
                  🔥 {habit.streak} Day
                </span>
              )}
              <span className="text-[10px] bg-indigo-500/20 text-indigo-400 px-2 py-1 rounded-md font-black uppercase tracking-wider">
                Lvl {habit.level || 1} • {habit.xp || 0}/100 XP
              </span>
            </div>

            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mt-2">
              {habit.end_date ? 'Goal Oriented' : '∞ Ongoing'}
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

      <Heatmap habit={habit} onToggle={onToggle} />
    </div>
  );
}