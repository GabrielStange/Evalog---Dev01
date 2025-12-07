import React, { useState, useEffect } from 'react';
import { Users, Plus, ArrowRight, Loader2, Ticket } from 'lucide-react';
import { createFamily, joinFamilyByInvite } from '../services/storageService';
import { supabase } from '../services/supabaseClient';

interface FamilyOnboardingProps {
    onSuccess: () => void;
}

const FamilyOnboarding: React.FC<FamilyOnboardingProps> = ({ onSuccess }) => {
    const [mode, setMode] = useState<'welcome' | 'create' | 'join'>('welcome');
    const [loading, setLoading] = useState(false);
    
    // Create State
    const [familyName, setFamilyName] = useState('');
    
    // Join State
    const [inviteCode, setInviteCode] = useState('');
    const [error, setError] = useState<string | null>(null);

    // Safe environment variable access
    const [enableCreation, setEnableCreation] = useState(false);

    useEffect(() => {
        try {
            // @ts-ignore
            if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_ENABLE_FAMILY_CREATION === 'true') {
                setEnableCreation(true);
            } else if (typeof process !== 'undefined' && process.env && process.env.VITE_ENABLE_FAMILY_CREATION === 'true') {
                setEnableCreation(true);
            }
        } catch (e) {
            // ignore environment access errors
        }
    }, []);

    const handleCreate = async () => {
        if(!familyName.trim()) return;
        setLoading(true);
        setError(null);
        try {
            await createFamily(familyName);
            onSuccess();
        } catch (e) {
            setError("Erro ao criar família. Tente novamente.");
        } finally {
            setLoading(false);
        }
    };

    const handleJoin = async () => {
        if(!inviteCode.trim()) return;
        setLoading(true);
        setError(null);
        try {
            await joinFamilyByInvite(inviteCode);
            onSuccess();
        } catch (e: any) {
            setError(e.message || "Erro ao entrar na família.");
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        // Trigger generic reload or auth state change listener in App handles it
    };

    return (
        <div className="h-screen w-full flex flex-col items-center justify-center p-6 bg-slate-50 dark:bg-slate-900 font-sans">
            <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-3xl shadow-xl p-8 border border-slate-100 dark:border-slate-700 animate-in fade-in zoom-in duration-300">
                
                <div className="flex justify-center mb-6">
                    <div className="bg-rose-100 dark:bg-rose-900/30 p-4 rounded-full">
                        <Users size={40} className="text-rose-500 dark:text-rose-400" />
                    </div>
                </div>

                <h1 className="text-2xl font-bold text-center text-slate-800 dark:text-slate-100 mb-2">
                    Bem-vindo ao EvaLog
                </h1>
                
                {mode === 'welcome' && (
                    <>
                        <p className="text-center text-slate-500 dark:text-slate-400 mb-8">
                            Para começar, você precisa fazer parte de uma família.
                        </p>
                        
                        <div className="space-y-3">
                            {enableCreation && (
                                <button 
                                    onClick={() => setMode('create')}
                                    className="w-full py-4 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold shadow-lg transition-all flex items-center justify-center"
                                >
                                    <Plus size={20} className="mr-2" />
                                    Criar Nova Família
                                </button>
                            )}
                            
                            <button 
                                onClick={() => setMode('join')}
                                className={`w-full py-4 rounded-xl font-bold border-2 transition-all flex items-center justify-center ${enableCreation ? 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700' : 'bg-rose-500 text-white border-rose-500 hover:bg-rose-600'}`}
                            >
                                <Ticket size={20} className="mr-2" />
                                Tenho um Convite
                            </button>
                            
                            <button 
                                onClick={handleLogout}
                                className="w-full py-2 text-sm text-slate-400 font-medium hover:text-slate-600 dark:hover:text-slate-200"
                            >
                                Sair da conta
                            </button>
                        </div>
                    </>
                )}

                {mode === 'create' && (
                    <div className="animate-in slide-in-from-right duration-300">
                        <h2 className="text-lg font-bold text-center mb-6 text-slate-700 dark:text-slate-200">Criar Família</h2>
                        <input 
                            type="text"
                            placeholder="Sobrenome da Família (ex: Silva)"
                            value={familyName}
                            onChange={(e) => setFamilyName(e.target.value)}
                            className="w-full p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl mb-4 focus:outline-none focus:border-rose-400 dark:text-white"
                        />
                         {error && <p className="text-red-500 text-sm mb-4 text-center">{error}</p>}
                        <div className="flex gap-3">
                            <button onClick={() => setMode('welcome')} className="flex-1 py-3 bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300 rounded-xl font-bold">Voltar</button>
                            <button 
                                onClick={handleCreate} 
                                disabled={loading || !familyName}
                                className="flex-1 py-3 bg-rose-500 text-white rounded-xl font-bold flex justify-center items-center disabled:opacity-50"
                            >
                                {loading ? <Loader2 className="animate-spin" /> : 'Criar'}
                            </button>
                        </div>
                    </div>
                )}

                {mode === 'join' && (
                    <div className="animate-in slide-in-from-right duration-300">
                        <h2 className="text-lg font-bold text-center mb-6 text-slate-700 dark:text-slate-200">Entrar na Família</h2>
                        <input 
                            type="text"
                            placeholder="Código do Convite"
                            value={inviteCode}
                            onChange={(e) => setInviteCode(e.target.value)}
                            className="w-full p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl mb-4 focus:outline-none focus:border-rose-400 dark:text-white uppercase tracking-widest text-center"
                        />
                        {error && <p className="text-red-500 text-sm mb-4 text-center">{error}</p>}
                        <div className="flex gap-3">
                            <button onClick={() => setMode('welcome')} className="flex-1 py-3 bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300 rounded-xl font-bold">Voltar</button>
                            <button 
                                onClick={handleJoin} 
                                disabled={loading || !inviteCode}
                                className="flex-1 py-3 bg-rose-500 text-white rounded-xl font-bold flex justify-center items-center disabled:opacity-50"
                            >
                                {loading ? <Loader2 className="animate-spin" /> : 'Entrar'}
                            </button>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
};

export default FamilyOnboarding;