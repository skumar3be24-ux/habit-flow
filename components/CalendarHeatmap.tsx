"use client";
export const CalendarHeatmap = () => {
  // Generate 31 days for a demo month
  const days = Array.from({ length: 31 }, (_, i) => ({
    day: i + 1,
    level: Math.floor(Math.random() * 4), // 0 to 3 intensity
  }));

  return (
    <div className="mt-8">
      <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
        Monthly Consistency <span className="text-xs font-normal text-slate-500">April 2026</span>
      </h3>
      <div className="grid grid-cols-7 sm:grid-cols-10 lg:grid-cols-14 gap-2">
        {days.map((d) => (
          <div
            key={d.day}
            title={`Day ${d.day}`}
            className={`aspect-square rounded-lg transition-all hover:scale-110 cursor-help ${
              d.level === 0 ? 'bg-white/5' :
              d.level === 1 ? 'bg-indigo-900/40' :
              d.level === 2 ? 'bg-indigo-600/60' :
              'bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.3)]'
            }`}
          />
        ))}
      </div>
    </div>
  );
};