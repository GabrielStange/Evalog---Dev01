import React from 'react';
import { Play, Square, Droplets, Pause, RotateCcw } from 'lucide-react';
import { ThemeColor } from '../types';

interface FeedingTimerProps {
  currentBabyId: string | null;
  themeColor: ThemeColor;
  
  // Breast Props
  activeSide: 'left' | 'right' | null;
  breastElapsed: number;
  onToggleBreastTimer: (side: 'left' | 'right') => void;

  // Bottle Props
  mode: 'timer' | 'bottle';
  setMode: (mode: 'timer' | 'bottle') => void;
  bottleStatus: 'idle' | 'running' | 'paused';
  bottleElapsed: number;
  bottleVolume: string;
  setBottleVolume: (vol: string) => void;
  onToggleBottleTimer: () => void;
  onResetBottleTimer: () => void;
  onSaveBottle: () => void;
}

const FeedingTimer: React.FC<FeedingTimerProps> = ({ 
  currentBabyId,
  themeColor,
  activeSide,
  breastElapsed,
  onToggleBreastTimer,
  mode,
  setMode,
  bottleStatus,
  bottleElapsed,
  bottleVolume,
  setBottleVolume,
  onToggleBottleTimer,
  onResetBottleTimer,
  onSaveBottle
}) => {

  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (!currentBabyId) {
    return (
        <div className="flex flex-col items-center justify-center p-8 text-center h-64">
            <p className="text-slate-400">Por favor, selecione ou cadastre um bebê no menu acima para começar.</p>
        </div>
    )
  }

  return (
    <div className="flex flex-col space-y-6 w-full max-w-md mx-auto p-4">
      
      {/* Mode Switcher */}
      <div className={`bg-${themeColor}-100 dark:bg-slate-800 p-1 rounded-xl flex transition-colors`}>
        <button 
          onClick={() => { if(!activeSide) setMode('timer'); }}
          className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${mode === 'timer' ? `bg-white dark:bg-slate-700 text-${themeColor}-600 dark:text-${themeColor}-400 shadow-sm` : `text-${themeColor}-400 dark:text-slate-500`}`}
        >
          Amamentação
        </button>
        <button 
          onClick={() => { if(!activeSide) setMode('bottle'); }}
          className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${mode === 'bottle' ? `bg-white dark:bg-slate-700 text-${themeColor}-600 dark:text-${themeColor}-400 shadow-sm` : `text-${themeColor}-400 dark:text-slate-500`}`}
        >
          Mamadeira
        </button>
      </div>

      {mode === 'timer' ? (
        <div className="flex flex-col items-center space-y-8 mt-4">
          
          {/* Timer Display */}
          <div className={`relative w-64 h-64 rounded-full flex items-center justify-center border-8 transition-colors duration-500 ${activeSide ? `border-${themeColor}-400 bg-white dark:bg-slate-800` : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800'}`}>
            <div className="flex flex-col items-center">
              <span className="text-6xl font-mono font-bold text-slate-700 dark:text-slate-200 tabular-nums">
                {formatTime(breastElapsed)}
              </span>
              <span className={`text-${themeColor}-500 dark:text-${themeColor}-400 font-semibold mt-2 uppercase tracking-widest`}>
                {activeSide === 'left' ? 'Esquerdo' : activeSide === 'right' ? 'Direito' : 'Pronto'}
              </span>
            </div>
          </div>

          {/* Controls */}
          <div className="grid grid-cols-2 gap-4 w-full">
            <button
              onClick={() => onToggleBreastTimer('left')}
              disabled={activeSide === 'right'}
              className={`h-32 rounded-2xl flex flex-col items-center justify-center space-y-2 transition-all ${
                activeSide === 'left' 
                  ? `bg-${themeColor}-500 text-white shadow-${themeColor}-300 shadow-lg scale-105` 
                  : activeSide === 'right'
                    ? 'bg-slate-100 dark:bg-slate-800 text-slate-300 dark:text-slate-600 cursor-not-allowed'
                    : `bg-white dark:bg-slate-800 text-${themeColor}-500 dark:text-${themeColor}-400 shadow-md hover:bg-${themeColor}-50 dark:hover:bg-slate-700`
              }`}
            >
              {activeSide === 'left' ? <Square size={32} fill="currentColor" /> : <Play size={32} fill="currentColor" />}
              <span className="font-bold text-lg">Esquerdo</span>
            </button>

            <button
              onClick={() => onToggleBreastTimer('right')}
              disabled={activeSide === 'left'}
              className={`h-32 rounded-2xl flex flex-col items-center justify-center space-y-2 transition-all ${
                activeSide === 'right' 
                  ? `bg-${themeColor}-500 text-white shadow-${themeColor}-300 shadow-lg scale-105` 
                  : activeSide === 'left'
                    ? 'bg-slate-100 dark:bg-slate-800 text-slate-300 dark:text-slate-600 cursor-not-allowed'
                    : `bg-white dark:bg-slate-800 text-${themeColor}-500 dark:text-${themeColor}-400 shadow-md hover:bg-${themeColor}-50 dark:hover:bg-slate-700`
              }`}
            >
              {activeSide === 'right' ? <Square size={32} fill="currentColor" /> : <Play size={32} fill="currentColor" />}
              <span className="font-bold text-lg">Direito</span>
            </button>
          </div>
          
          {activeSide && (
             <p className="text-slate-400 text-sm animate-pulse">Registrando amamentação...</p>
          )}

        </div>
      ) : (
        <div className="flex flex-col items-center justify-center bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-md space-y-6 transition-colors">
          <div className={`bg-${themeColor}-100 dark:bg-${themeColor}-900/30 p-4 rounded-full transition-colors`}>
            <Droplets size={48} className={`text-${themeColor}-500 dark:text-${themeColor}-400 transition-colors`} />
          </div>
          <h3 className="text-xl font-bold text-slate-700 dark:text-slate-200">Registrar Mamadeira</h3>
          
          {/* Bottle Timer */}
          <div className="flex flex-col items-center w-full bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl transition-colors">
            <span className="text-4xl font-mono font-bold text-slate-700 dark:text-slate-200 tabular-nums mb-4">
               {formatTime(bottleElapsed)}
            </span>
            <div className="flex space-x-4">
              <button 
                onClick={onToggleBottleTimer}
                className={`p-4 rounded-full text-white shadow-lg transition-all ${bottleStatus === 'running' ? 'bg-amber-500 hover:bg-amber-600' : `bg-${themeColor}-500 hover:bg-${themeColor}-600`}`}
              >
                {bottleStatus === 'running' ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" />}
              </button>
              {(bottleStatus !== 'idle') && (
                <button 
                  onClick={onResetBottleTimer}
                  className="p-4 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
                >
                  <RotateCcw size={24} />
                </button>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-2 font-semibold">
               {bottleStatus === 'running' ? 'Cronometrando...' : bottleStatus === 'paused' ? 'Pausado' : 'Iniciar Tempo'}
            </p>
          </div>

          <div className="w-full">
            <label className="text-sm font-semibold text-slate-500 dark:text-slate-400 ml-1">Quantidade (ml)</label>
            <input 
              type="number" 
              value={bottleVolume}
              onChange={(e) => setBottleVolume(e.target.value)}
              placeholder="Ex: 120"
              className={`w-full text-center text-3xl font-bold p-4 border-2 border-slate-700 dark:border-slate-600 rounded-xl focus:border-${themeColor}-400 focus:outline-none bg-slate-800 dark:bg-slate-700 text-white mt-1 placeholder-slate-500 transition-colors`}
            />
          </div>

          <button
            onClick={onSaveBottle}
            disabled={!bottleVolume}
            className={`w-full bg-${themeColor}-500 text-white font-bold py-4 rounded-xl shadow-lg hover:bg-${themeColor}-600 active:scale-95 transition-all disabled:opacity-50 disabled:active:scale-100`}
          >
            Salvar Registro
          </button>
        </div>
      )}
    </div>
  );
};

export default FeedingTimer;