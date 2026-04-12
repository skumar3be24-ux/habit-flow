"use client";
import { motion } from "framer-motion";
import { Sparkles, Plus } from "lucide-react";

export default function EmptyState({ onAction }: { onAction: () => void }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-20 px-6 text-center border border-dashed border-white/10 rounded-[3rem] bg-white/[0.02]"
    >
      <div className="w-20 h-20 bg-indigo-500/10 text-indigo-400 rounded-3xl flex items-center justify-center mb-6">
        <Sparkles size={40} />
      </div>
      <h3 className="text-2xl font-bold mb-2">No habits yet</h3>
      <p className="text-slate-500 max-w-xs mb-8">
        Success is the sum of small efforts, repeated day in and day out. Start your first one.
      </p>
      <button 
        onClick={onAction}
        className="flex items-center gap-2 bg-white text-black px-8 py-4 rounded-2xl font-bold hover:scale-105 transition-transform"
      >
        <Plus size={20} /> Create Habit
      </button>
    </motion.div>
  );
}