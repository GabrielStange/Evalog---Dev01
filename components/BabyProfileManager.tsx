import React, { useState } from 'react';
import { BabyProfile, ThemeColor } from '../types';
import { User, Plus, X, Check, Baby, Ruler, Weight, Palette, LogOut } from 'lucide-react';
import { supabase } from '../services/supabaseClient';

interface BabyProfileManagerProps {
  babies: BabyProfile[];
  currentBabyId: string | null;
  onSelectBaby: (id: string) => void;
  onSaveBaby: (baby: BabyProfile) => void;
  onClose: () => void;
  themeColor: ThemeColor;
}

const THEME_OPTIONS: { id: ThemeColor; label: string; colorClass: string }[] = [
  { id: 'rose', label: 'Rosa', colorClass: 'bg-rose-500' },
  { id: 'blue', label: 'Azul', colorClass: 'bg-blue-500' },
  { id: 'amber', label: 'Amarelo', colorClass: 'bg-amber-500' },
  { id: 'violet', label: 'Roxo', colorClass: 'bg-violet-500' },
  { id: 'emerald', label: 'Verde', colorClass: 'bg-emerald-500' },
  { id: 'red', label: 'Vermelho', colorClass: 'bg-red-500' },
];

const BabyProfileManager: React.FC<BabyProfileManagerProps> = ({
  babies,
  currentBabyId,
  onSelectBaby,
  onSaveBaby,
  onClose,
  themeColor
}) => {
  const [view, setView] = useState<'list' | 'form'>('list');
  const [editingBaby, setEditingBaby] = useState<Partial<BabyProfile>>({});

  const handleCreateNew = () => {
    setEditingBaby({
      gender: 'girl',
      birthDate: Date.now(),
      themeColor: 'rose',
    });
    setView('form');
  };

  const handleEdit = (baby: BabyProfile) => {
    setEditingBaby({ ...baby });
    setView('form');
  };

  const handleSave = () => {
    if (!editingBaby.name) return alert("Por favor, informe o nome.");
    
    const newProfile: BabyProfile = {
      id: editingBaby.id || crypto.randomUUID(),
      name: editingBaby.name,
      birthDate: editingBaby.birthDate || Date.now(),
      gender: editingBaby.gender || 'girl',
      themeColor: editingBaby.themeColor || 'rose',
      weightKg: editingBaby.weightKg,
      heightCm: editingBaby.heightCm,
      createdAt: editingBaby.createdAt || Date.now(),
    };

    onSaveBaby(newProfile);
    setView('list');
  };

  const handleLogout = async () => {
      if(confirm('Tem certeza que deseja sair da conta?')) {
          await supabase.auth.signOut();
          onClose();
      }
  };

  // Determine current form theme color for UI
  const formTheme = editingBaby.themeColor || themeColor;

  if (view === 'form') {
    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
        <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
          <div className={`bg-${formTheme}-500 p-4 flex justify-between items-center text-white transition-colors`}>
            <h3 className="font-bold text-lg">{editingBaby.id ? 'Editar Perfil' : 'Novo Bebê'}</h3>
            <button onClick={() => setView('list')}><X size={24} /></button>
          </div>
          
          <div className="p-6 space-y-4 max-h-[80vh] overflow-y-auto no-scrollbar">
            <div>
              <label className="block text-sm font-bold text-slate-600 dark:text-slate-400 mb-1">Nome</label>
              <input 
                type="text" 
                value={editingBaby.name || ''}
                onChange={e => setEditingBaby({...editingBaby, name: e.target.value})}
                className={`w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:border-${formTheme}-500 focus:outline-none transition-colors`}
                placeholder="Ex: Maria"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-600 dark:text-slate-400 mb-1">Data de Nascimento</label>
              <input 
                type="date" 
                value={editingBaby.birthDate ? new Date(editingBaby.birthDate).toISOString().split('T')[0] : ''}
                onChange={e => setEditingBaby({...editingBaby, birthDate: new Date(e.target.value).getTime()})}
                className={`w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:border-${formTheme}-500 focus:outline-none transition-colors`}
              />
            </div>

            <div className="flex space-x-4">
              <div className="flex-1">
                 <label className="block text-sm font-bold text-slate-600 dark:text-slate-400 mb-1 flex items-center"><Weight size={14} className="mr-1"/> Peso (kg)</label>
                 <input 
                    type="number" 
                    step="0.01"
                    value={editingBaby.weightKg || ''}
                    onChange={e => setEditingBaby({...editingBaby, weightKg: parseFloat(e.target.value)})}
                    className={`w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:border-${formTheme}-500 focus:outline-none transition-colors`}
                    placeholder="Ex: 6.5"
                 />
              </div>
              <div className="flex-1">
                 <label className="block text-sm font-bold text-slate-600 dark:text-slate-400 mb-1 flex items-center"><Ruler size={14} className="mr-1"/> Altura (cm)</label>
                 <input 
                    type="number" 
                    step="0.1"
                    value={editingBaby.heightCm || ''}
                    onChange={e => setEditingBaby({...editingBaby, heightCm: parseFloat(e.target.value)})}
                    className={`w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:border-${formTheme}-500 focus:outline-none transition-colors`}
                    placeholder="Ex: 62"
                 />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-600 dark:text-slate-400 mb-2">Sexo</label>
              <div className="flex space-x-2">
                <button 
                  onClick={() => setEditingBaby({...editingBaby, gender: 'girl'})}
                  className={`flex-1 py-2 rounded-xl border-2 font-bold transition-colors ${editingBaby.gender === 'girl' ? `border-rose-400 bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400` : 'border-slate-100 dark:border-slate-700 text-slate-400'}`}
                >
                  Menina
                </button>
                <button 
                  onClick={() => setEditingBaby({...editingBaby, gender: 'boy'})}
                  className={`flex-1 py-2 rounded-xl border-2 font-bold transition-colors ${editingBaby.gender === 'boy' ? `border-blue-400 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400` : 'border-slate-100 dark:border-slate-700 text-slate-400'}`}
                >
                  Menino
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-600 dark:text-slate-400 mb-2 flex items-center">
                  <Palette size={16} className="mr-1"/> Tema de Cor
              </label>
              <div className="grid grid-cols-6 gap-2">
                {THEME_OPTIONS.map((theme) => (
                    <button
                        key={theme.id}
                        onClick={() => setEditingBaby({...editingBaby, themeColor: theme.id})}
                        className={`w-full aspect-square rounded-full ${theme.colorClass} border-4 transition-all ${editingBaby.themeColor === theme.id ? 'border-slate-800 dark:border-white scale-110' : 'border-transparent opacity-70 hover:opacity-100'}`}
                        title={theme.label}
                    />
                ))}
              </div>
            </div>

            <button 
              onClick={handleSave}
              className={`w-full bg-${formTheme}-500 text-white font-bold py-3 rounded-xl shadow-md mt-4 hover:bg-${formTheme}-600 transition-colors`}
            >
              Salvar Perfil
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-end p-4 backdrop-blur-sm" onClick={onClose}>
      <div 
        className="bg-white dark:bg-slate-900 w-full max-w-xs mt-16 rounded-3xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-10 duration-200 flex flex-col max-h-[80vh]"
        onClick={e => e.stopPropagation()} 
      >
        <div className={`p-4 border-b border-${themeColor}-100 dark:border-slate-800 flex justify-between items-center bg-${themeColor}-50 dark:bg-slate-800 flex-none`}>
          <h3 className={`font-bold text-${themeColor}-700 dark:text-${themeColor}-400`}>Meus Bebês</h3>
          <button onClick={handleCreateNew} className={`p-2 bg-white dark:bg-slate-700 rounded-full text-${themeColor}-500 dark:text-${themeColor}-400 shadow-sm hover:bg-${themeColor}-100 dark:hover:bg-slate-600`}>
            <Plus size={20} />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          {babies.map(baby => (
            <div 
              key={baby.id}
              className={`p-4 border-b border-slate-50 dark:border-slate-800 flex items-center justify-between cursor-pointer transition-colors ${currentBabyId === baby.id ? `bg-${themeColor}-50 dark:bg-slate-800/50` : 'hover:bg-slate-50 dark:hover:bg-slate-800'}`}
              onClick={() => onSelectBaby(baby.id)}
            >
              <div className="flex items-center space-x-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold bg-${baby.themeColor || 'rose'}-400`}>
                   {baby.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className={`font-bold ${currentBabyId === baby.id ? `text-${themeColor}-700 dark:text-${themeColor}-400` : 'text-slate-700 dark:text-slate-200'}`}>{baby.name}</p>
                  <p className="text-xs text-slate-400">
                    {new Date(baby.birthDate).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                {currentBabyId === baby.id && <Check size={18} className={`text-${themeColor}-500 dark:text-${themeColor}-400`} />}
                <button 
                  onClick={(e) => { e.stopPropagation(); handleEdit(baby); }}
                  className={`p-2 text-slate-300 hover:text-${themeColor}-400`}
                >
                  <User size={16} />
                </button>
              </div>
            </div>
          ))}
          
          {babies.length === 0 && (
            <div className="p-8 text-center text-slate-400">
               <Baby size={48} className="mx-auto mb-2 opacity-50" />
               <p>Nenhum bebê cadastrado.</p>
            </div>
          )}
        </div>

        {/* Logout Section */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex-none">
            <button 
                onClick={handleLogout}
                className="w-full flex items-center justify-center p-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors text-sm font-bold"
            >
                <LogOut size={16} className="mr-2" />
                Sair da Conta
            </button>
        </div>
      </div>
    </div>
  );
};

export default BabyProfileManager;