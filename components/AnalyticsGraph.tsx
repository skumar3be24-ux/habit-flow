"use client";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const data = [
  { name: 'Mon', value: 40 }, { name: 'Tue', value: 30 }, { name: 'Wed', value: 65 },
  { name: 'Thu', value: 45 }, { name: 'Fri', value: 90 }, { name: 'Sat', value: 70 }, { name: 'Sun', value: 85 },
];

export const AnalyticsGraph = () => (
  <div className="h-[300px] w-full mt-4">
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data}>
        <defs>
          <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
            <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff10" />
        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} dy={10} />
        <Tooltip 
          contentStyle={{ backgroundColor: '#1e293b', borderRadius: '12px', border: 'none' }}
          itemStyle={{ color: '#ddd' }}
        />
        <Area type="monotone" dataKey="value" stroke="#a78bfa" strokeWidth={4} fillOpacity={1} fill="url(#colorValue)" />
      </AreaChart>
    </ResponsiveContainer>
  </div>
);