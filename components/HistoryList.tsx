import React from 'react';
import { FeedingRecord, ThemeColor } from '../types';
import { Trash2, Droplet, Clock, PauseCircle, ArrowRight, Download } from 'lucide-react';

interface HistoryListProps {
  records: FeedingRecord[];
  onDelete: (id: string) => void;
  themeColor: ThemeColor;
  babyName?: string;
}

const HistoryList: React.FC<HistoryListProps> = ({ records, onDelete, themeColor, babyName }) => {
  
  const handleExport = () => {
    const dataStr = JSON.stringify(records, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `evalog_historico_${babyName || 'bebe'}_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (records.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-slate-400">
        <Clock size={48} className="mb-4 opacity-50" />
        <p>Nenhum registro encontrado ainda.</p>
      </div>
    );
  }

  // Helper to format time HH:mm
  const formatTime = (timestamp: number) => {
      return new Date(timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  const grouped = records.reduce((acc, record) => {
    const date = new Date(record.startTime).toLocaleDateString('pt-BR', {
        weekday: 'long', 
        day: 'numeric', 
        month: 'long'
    });
    if (!acc[date]) acc[date] = [];
    acc[date].push(record);
    return acc;
  }, {} as Record<string, FeedingRecord[]>);

  return (
    <div className="px-4 w-full max-w-md mx-auto">
      
      {/* Export Header */}
      <div className="flex justify-end mb-4">
         <button 
           onClick={handleExport}
           className={`flex items-center text-xs font-bold text-${themeColor}-600 dark:text-${themeColor}-400 bg-white dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-${themeColor}-100 dark:border-slate-700 shadow-sm hover:bg-${themeColor}-50 dark:hover:bg-slate-700 transition-colors`}
         >
            <Download size={14} className="mr-1.5" />
            Exportar Histórico (JSON)
         </button>
      </div>

      {(Object.entries(grouped) as [string, FeedingRecord[]][]).map(([date, items]) => (
        <div key={date} className="mb-6">
          <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-3 ml-1">{date}</h3>
          <div className="space-y-3">
            {items.map(record => (
              <div key={record.id} className="bg-white dark:bg-slate-900 p-4 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800 relative group transition-colors">
                <div className="flex justify-between items-start">
                    <div className="flex items-start space-x-4">
                        <div className={`p-3 rounded-full mt-1 ${record.type === 'bottle' ? 'bg-sky-50 dark:bg-sky-900/30 text-sky-500 dark:text-sky-400' : `bg-${themeColor}-50 dark:bg-${themeColor}-900/30 text-${themeColor}-500 dark:text-${themeColor}-400`}`}>
                            {record.type === 'bottle' ? <Droplet size={20} /> : <Clock size={20} />}
                        </div>
                        
                        <div className="flex-1">
                            {/* Title Row */}
                            <div className="font-bold text-slate-700 dark:text-slate-200 capitalize text-lg">
                                {record.type === 'bottle' 
                                    ? 'Mamadeira' 
                                    : record.type === 'breast_left' ? 'Seio Esquerdo' : 'Seio Direito'}
                            </div>

                            {/* Time & Volume/Duration Row */}
                            <div className="text-sm text-slate-600 dark:text-slate-400 mt-1 flex items-center flex-wrap gap-x-2">
                                <span className="flex items-center bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-slate-600 dark:text-slate-300 font-mono text-xs">
                                    {formatTime(record.startTime)}
                                    {record.endTime && (
                                        <>
                                            <ArrowRight size={10} className="mx-1 text-slate-400" />
                                            {formatTime(record.endTime)}
                                        </>
                                    )}
                                </span>
                                <span className="text-slate-300">•</span>
                                <span className="font-bold text-slate-700 dark:text-slate-200">
                                    {record.type === 'bottle' 
                                        ? `${record.volumeMl}ml` 
                                        : `${Math.floor((record.durationSeconds || 0) / 60)} min`}
                                </span>
                            </div>

                            {/* Pauses Section (Only for Bottle if exists) */}
                            {record.type === 'bottle' && record.pauses && record.pauses.length > 0 && (
                                <div className="mt-3 pt-2 border-t border-slate-50 dark:border-slate-800">
                                    <div className="flex items-center text-xs text-slate-400 mb-1">
                                        <PauseCircle size={12} className="mr-1" />
                                        <span>Pausas registradas:</span>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {record.pauses.map((pause, idx) => (
                                            <span key={idx} className="text-xs bg-orange-50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 px-2 py-1 rounded border border-orange-100 dark:border-orange-900/50">
                                                {formatTime(pause.startTime)} - {formatTime(pause.endTime)}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <button 
                        onClick={() => onDelete(record.id)}
                        className="p-2 text-slate-300 hover:text-red-500 transition-colors -mr-2 -mt-2"
                    >
                        <Trash2 size={18} />
                    </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default HistoryList;