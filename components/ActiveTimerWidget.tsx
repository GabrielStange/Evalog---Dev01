import React from 'react';
import { Play, Pause, Square, Clock, Droplet } from 'lucide-react';
import { ThemeColor } from '../types';

interface ActiveTimerWidgetProps {
  themeColor: ThemeColor;
  // Breast State
  activeSide: 'left' | 'right' | null;
  breastElapsed: number;
  onFinishBreast: () => void;
  
  // Bottle State
  bottleStatus: 'idle' | 'running' | 'paused';
  bottleElapsed: number;
  onToggleBottle: () => void;
  onNavigateToTracker: () => void;
}

const ActiveTimerWidget: React.FC<ActiveTimerWidgetProps> = ({
  themeColor,
  activeSide,
  breastElapsed,
  onFinishBreast,
  bottleStatus,
  bottleElapsed,
  onToggleBottle,
  onNavigateToTracker
}) => {
  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Determine what to show. Priority: Breast, then Bottle.
  if (activeSide) {
    return (
      <div className={`bg-${themeColor}-600 text-white px-4 py-3 shadow-md flex items-center justify-between animate-in slide-in-from-top duration-300 transition-colors`}>
        <div className="flex items-center space-x-3" onClick={onNavigateToTracker}>
          <div className="bg-white/20 p-2 rounded-full animate-pulse">
            <Clock size={20} />
          </div>
          <div>
            <p className={`text-xs text-${themeColor}-100 font-bold uppercase tracking-wider`}>
              {activeSide === 'left' ? 'Seio Esquerdo' : 'Seio Direito'}
            </p>
            <p className="text-xl font-mono font-bold leading-none">
              {formatTime(breastElapsed)}
            </p>
          </div>
        </div>
        <button 
          onClick={(e) => { e.stopPropagation(); onFinishBreast(); }}
          className={`bg-white text-${themeColor}-600 px-4 py-2 rounded-lg font-bold text-sm shadow-sm hover:bg-${themeColor}-50 transition-colors flex items-center`}
        >
          <Square size={16} fill="currentColor" className="mr-2" />
          Finalizar
        </button>
      </div>
    );
  }

  if (bottleStatus !== 'idle') {
    return (
      <div className="bg-sky-600 text-white px-4 py-3 shadow-md flex items-center justify-between animate-in slide-in-from-top duration-300">
        <div className="flex items-center space-x-3" onClick={onNavigateToTracker}>
          <div className={`bg-white/20 p-2 rounded-full ${bottleStatus === 'running' ? 'animate-pulse' : ''}`}>
            <Droplet size={20} />
          </div>
          <div>
            <p className="text-xs text-sky-100 font-bold uppercase tracking-wider">
              Mamadeira {bottleStatus === 'paused' ? '(Pausada)' : ''}
            </p>
            <p className="text-xl font-mono font-bold leading-none">
              {formatTime(bottleElapsed)}
            </p>
          </div>
        </div>
        <button 
          onClick={(e) => { e.stopPropagation(); onToggleBottle(); }}
          className="bg-white text-sky-600 px-4 py-2 rounded-lg font-bold text-sm shadow-sm hover:bg-sky-50 transition-colors flex items-center"
        >
          {bottleStatus === 'running' ? (
            <>
              <Pause size={16} fill="currentColor" className="mr-2" />
              Pausar
            </>
          ) : (
            <>
              <Play size={16} fill="currentColor" className="mr-2" />
              Retomar
            </>
          )}
        </button>
      </div>
    );
  }

  return null;
};

export default ActiveTimerWidget;