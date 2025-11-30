import React, { useMemo } from 'react';
import { FeedingRecord, ThemeColor } from '../types';
import { 
  BarChart, 
  Bar, 
  AreaChart, 
  Area,
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  CartesianGrid,
  Legend
} from 'recharts';

interface StatsViewProps {
  records: FeedingRecord[];
  themeColor: ThemeColor;
  isDarkMode?: boolean;
}

// Map tailwind theme names to Hex codes for Recharts
const THEME_HEX: Record<ThemeColor, string> = {
    rose: '#f43f5e',
    blue: '#3b82f6',
    emerald: '#10b981',
    violet: '#8b5cf6',
    amber: '#f59e0b',
    red: '#ef4444',
};

const BOTTLE_COLOR = '#0ea5e9'; // Sky-500

const StatsView: React.FC<StatsViewProps> = ({ records, themeColor, isDarkMode = false }) => {
  const primaryColor = THEME_HEX[themeColor];
  const axisColor = isDarkMode ? '#94a3b8' : '#64748b'; // slate-400 vs slate-500
  const gridColor = isDarkMode ? '#334155' : '#f1f5f9'; // slate-700 vs slate-100

  // Logic: Get last 7 days of activity with separate counters
  const chartData = useMemo(() => {
    const data: Record<string, { 
        date: string, 
        breastCount: number, 
        bottleCount: number, 
        bottleVolume: number, 
        breastDuration: number,
        timestamp: number 
    }> = {};
    
    // Initialize last 7 days to ensure x-axis continuity
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      d.setHours(0,0,0,0);
      const key = d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
      
      data[key] = { 
          date: key, 
          breastCount: 0, 
          bottleCount: 0, 
          bottleVolume: 0, 
          breastDuration: 0,
          timestamp: d.getTime()
      };
    }

    records.forEach(r => {
      const d = new Date(r.startTime);
      const key = d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
      
      // Only process if within the generated keys (last 7 days)
      if (data[key]) {
        if (r.type === 'bottle') {
          data[key].bottleCount += 1;
          if (r.volumeMl) data[key].bottleVolume += r.volumeMl;
        } else {
          data[key].breastCount += 1;
          if (r.durationSeconds) data[key].breastDuration += (r.durationSeconds / 60); // convert to minutes
        }
      }
    });

    return Object.values(data).sort((a,b) => a.timestamp - b.timestamp);
  }, [records]);

  // Calculate Averages (Last 7 Days)
  const totalDays = 7;
  const totals = chartData.reduce((acc, curr) => ({
      breast: acc.breast + curr.breastCount,
      bottle: acc.bottle + curr.bottleCount,
      volume: acc.volume + curr.bottleVolume,
      duration: acc.duration + curr.breastDuration
  }), { breast: 0, bottle: 0, volume: 0, duration: 0 });

  const avgBreast = (totals.breast / totalDays).toFixed(1);
  const avgBottle = (totals.bottle / totalDays).toFixed(1);
  const avgDuration = Math.round(totals.duration / totalDays);
  const avgVolume = Math.round(totals.volume / totalDays);

  // Custom tooltip style
  const tooltipStyle = {
    borderRadius: '12px', 
    border: isDarkMode ? '1px solid #334155' : 'none', 
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    backgroundColor: isDarkMode ? '#1e293b' : '#fff', // slate-800 vs white
    padding: '10px',
    fontSize: '12px',
    zIndex: 100,
    color: isDarkMode ? '#fff' : '#000'
  };

  return (
    <div className="w-full max-w-md mx-auto p-4 space-y-6">
      
      {/* Summary Cards (Weekly Averages) */}
      <div>
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wide mb-3 ml-1">Média Diária (7 dias)</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className={`bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm border border-${themeColor}-100 dark:border-slate-800 transition-colors`}>
                <p className="text-xs text-slate-400 font-bold mb-1">Amamentações</p>
                <div className="flex items-baseline space-x-1">
                    <p className={`text-2xl font-bold text-${themeColor}-500 dark:text-${themeColor}-400`}>{avgBreast}</p>
                    <span className="text-xs text-slate-400">vezes/dia</span>
                </div>
                <p className="text-xs text-slate-400 mt-1">Tempo: {avgDuration} min/dia</p>
            </div>
            
            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm border border-sky-100 dark:border-slate-800 transition-colors">
                <p className="text-xs text-slate-400 font-bold mb-1">Mamadeiras</p>
                <div className="flex items-baseline space-x-1">
                    <p className="text-2xl font-bold text-sky-500 dark:text-sky-400">{avgBottle}</p>
                    <span className="text-xs text-slate-400">vezes/dia</span>
                </div>
                <p className="text-xs text-slate-400 mt-1">Vol: {avgVolume} ml/dia</p>
            </div>
          </div>
      </div>

      {/* Chart 1: Daily Frequency (Stacked) */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl shadow-md transition-colors">
        <h3 className="text-md font-bold text-slate-700 dark:text-slate-200 mb-4">Frequência Diária</h3>
        {/* Explicit height container to fix Recharts warning */}
        <div className="w-full h-64 min-w-0">
            <ResponsiveContainer width="99%" height="100%">
                <BarChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
                    <XAxis dataKey="date" tick={{fontSize: 10, fill: axisColor}} axisLine={false} tickLine={false} dy={10} />
                    <YAxis tick={{fontSize: 10, fill: axisColor}} axisLine={false} tickLine={false} allowDecimals={false} />
                    <Tooltip cursor={{fill: isDarkMode ? '#334155' : '#f8fafc'}} contentStyle={tooltipStyle} />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', paddingTop: '10px', color: axisColor }} />
                    <Bar dataKey="breastCount" name="Seio" stackId="a" fill={primaryColor} radius={[0, 0, 4, 4]} />
                    <Bar dataKey="bottleCount" name="Mamadeira" stackId="a" fill={BOTTLE_COLOR} radius={[4, 4, 0, 0]} />
                </BarChart>
            </ResponsiveContainer>
        </div>
      </div>

      {/* Chart 2: Breastfeeding Duration */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl shadow-md border-l-4 transition-colors" style={{ borderColor: primaryColor }}>
        <h3 className="text-md font-bold text-slate-700 dark:text-slate-200 mb-4">Tempo no Seio (minutos)</h3>
        <div className="w-full h-64 min-w-0">
            <ResponsiveContainer width="99%" height="100%">
                <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                    <defs>
                        <linearGradient id="colorBreast" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={primaryColor} stopOpacity={0.3}/>
                            <stop offset="95%" stopColor={primaryColor} stopOpacity={0}/>
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
                    <XAxis dataKey="date" tick={{fontSize: 10, fill: axisColor}} axisLine={false} tickLine={false} dy={10} />
                    <YAxis tick={{fontSize: 10, fill: axisColor}} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Area type="monotone" dataKey="breastDuration" name="Duração (min)" stroke={primaryColor} fillOpacity={1} fill="url(#colorBreast)" />
                </AreaChart>
            </ResponsiveContainer>
        </div>
      </div>

      {/* Chart 3: Bottle Volume */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl shadow-md border-l-4 border-sky-400 transition-colors">
        <h3 className="text-md font-bold text-slate-700 dark:text-slate-200 mb-4">Volume de Mamadeira (ml)</h3>
        <div className="w-full h-64 min-w-0">
            <ResponsiveContainer width="99%" height="100%">
                <BarChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
                    <XAxis dataKey="date" tick={{fontSize: 10, fill: axisColor}} axisLine={false} tickLine={false} dy={10} />
                    <YAxis tick={{fontSize: 10, fill: axisColor}} axisLine={false} tickLine={false} />
                    <Tooltip cursor={{fill: isDarkMode ? '#334155' : '#eff6ff'}} contentStyle={tooltipStyle} />
                    <Bar dataKey="bottleVolume" name="Volume (ml)" fill={BOTTLE_COLOR} radius={[4, 4, 0, 0]} />
                </BarChart>
            </ResponsiveContainer>
        </div>
      </div>

    </div>
  );
};

export default StatsView;