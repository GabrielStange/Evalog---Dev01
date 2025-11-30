import React, { useState } from 'react';
import { supabase } from '../services/supabaseClient';
import { Baby, Loader2, Sparkles, Mail, Lock, ArrowRight, Ticket, Sun, Moon } from 'lucide-react';

type AuthMode = 'login' | 'register_invite';

interface LoginScreenProps {
    isDarkMode: boolean;
    toggleTheme: () => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ isDarkMode, toggleTheme }) => {
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<AuthMode>('login');
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const resetForm = (newMode: AuthMode) => {
    setMode(newMode);
    setErrorMsg(null);
    setSuccessMsg(null);
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setInviteCode('');
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
        if (mode === 'login') {
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password
            });
            if (error) throw error;
        } 
        else {
            // Registration Logic (Invite Only)
            if (password !== confirmPassword) {
                throw new Error("As senhas não coincidem.");
            }
            if (password.length < 6) {
                throw new Error("A senha deve ter pelo menos 6 caracteres.");
            }

            if (!inviteCode.trim()) {
                throw new Error("Código de convite é obrigatório.");
            }

            // TODO: Validate invite code against DB before creating user
            // For now, we proceed to create the user. If invite logic is enforced via RLS/Triggers, it will fail there or here.
            
            const { error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        invite_code: inviteCode // Store invite code in metadata for trigger processing if needed
                    }
                }
            });

            if (error) throw error;

            setSuccessMsg("Conta criada com sucesso! Verifique seu e-mail para confirmar (se necessário) ou faça login.");
            setTimeout(() => setMode('login'), 3000);
        }
    } catch (error: any) {
        console.error(error);
        if (error.message === 'Invalid login credentials') {
            setErrorMsg("E-mail ou senha incorretos.");
        } else {
            setErrorMsg(error.message || "Ocorreu um erro. Tente novamente.");
        }
    } finally {
        setLoading(false);
    }
  };

  const renderForm = () => {
    return (
        <form onSubmit={handleAuth} className="space-y-4 w-full text-left">
            <div>
                <label className="block text-sm font-bold text-slate-600 dark:text-slate-400 mb-1 ml-1">E-mail</label>
                <div className="relative">
                    <Mail className="absolute left-3 top-3.5 text-slate-400" size={18} />
                    <input 
                        type="email" 
                        required
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        className="w-full pl-10 p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-rose-400 transition-colors text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
                        placeholder="seu@email.com"
                    />
                </div>
            </div>

            <div>
                <label className="block text-sm font-bold text-slate-600 dark:text-slate-400 mb-1 ml-1">Senha</label>
                <div className="relative">
                    <Lock className="absolute left-3 top-3.5 text-slate-400" size={18} />
                    <input 
                        type="password" 
                        required
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        className="w-full pl-10 p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-rose-400 transition-colors text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
                        placeholder="••••••••"
                    />
                </div>
            </div>

            {mode !== 'login' && (
                <>
                    <div>
                        <label className="block text-sm font-bold text-slate-600 dark:text-slate-400 mb-1 ml-1">Confirmar Senha</label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-3.5 text-slate-400" size={18} />
                            <input 
                                type="password" 
                                required
                                value={confirmPassword}
                                onChange={e => setConfirmPassword(e.target.value)}
                                className="w-full pl-10 p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-rose-400 transition-colors text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
                                placeholder="••••••••"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-600 dark:text-slate-400 mb-1 ml-1">Código do Convite</label>
                        <div className="relative">
                            <Ticket className="absolute left-3 top-3.5 text-slate-400" size={18} />
                            <input 
                                type="text" 
                                required
                                value={inviteCode}
                                onChange={e => setInviteCode(e.target.value)}
                                className="w-full pl-10 p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-rose-400 transition-colors uppercase tracking-widest text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
                                placeholder="CÓDIGO"
                            />
                        </div>
                        <p className="text-[10px] text-slate-400 mt-1 ml-1">Solicite o código ao administrador do sistema.</p>
                    </div>
                </>
            )}

            <button
                type="submit"
                disabled={loading}
                className={`w-full flex items-center justify-center space-x-2 bg-rose-500 hover:bg-rose-600 text-white font-bold py-3.5 rounded-xl transition-all shadow-md active:scale-95 disabled:opacity-70 disabled:active:scale-100 mt-6`}
            >
                {loading ? (
                    <Loader2 className="animate-spin" size={20} />
                ) : (
                    <>
                        <span>{mode === 'login' ? 'Entrar' : 'Criar Conta'}</span>
                        {mode === 'login' && <ArrowRight size={18} />}
                    </>
                )}
            </button>
        </form>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 to-blue-50 dark:from-slate-900 dark:to-slate-950 flex flex-col items-center justify-center p-6 text-center font-sans relative">
      
      {/* Theme Toggle Button */}
      <div className="absolute top-6 right-6">
        <button 
            onClick={toggleTheme} 
            className="p-3 rounded-full bg-white/50 dark:bg-slate-800/50 backdrop-blur-md text-slate-500 dark:text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 border border-white dark:border-slate-700 shadow-sm transition-all hover:scale-105 active:scale-95"
            aria-label="Alternar tema"
        >
            {isDarkMode ? <Sun size={24} /> : <Moon size={24} />}
        </button>
      </div>

      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-xl p-8 border border-white/50 dark:border-slate-800 backdrop-blur-sm animate-in fade-in zoom-in duration-500">
        
        {/* Header Icon */}
        <div className="bg-rose-100 dark:bg-rose-900/30 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm relative group">
          {mode === 'login' && <Baby size={48} className="text-rose-500 dark:text-rose-400" />}
          {mode === 'register_invite' && <Ticket size={48} className="text-amber-500 dark:text-amber-400" />}
        </div>

        {/* Titles */}
        <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100 mb-2">EvaLog</h1>
        
        {mode === 'login' && (
            <p className="text-slate-500 dark:text-slate-400 mb-8 text-sm">
                Entre com sua conta para acessar o monitor.
            </p>
        )}
        {mode === 'register_invite' && (
            <p className="text-slate-500 dark:text-slate-400 mb-8 text-sm">
                Crie sua conta utilizando o convite recebido.
            </p>
        )}

        {/* Messages */}
        {errorMsg && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 p-3 rounded-xl mb-6 flex items-start text-left animate-in slide-in-from-top-2">
                <p className="text-sm text-red-600 dark:text-red-300 font-medium">{errorMsg}</p>
            </div>
        )}
        {successMsg && (
            <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800 p-3 rounded-xl mb-6 flex items-start text-left animate-in slide-in-from-top-2">
                <p className="text-sm text-emerald-600 dark:text-emerald-300 font-medium">{successMsg}</p>
            </div>
        )}

        {/* The Form */}
        {renderForm()}

        {/* Footer Actions */}
        <div className="mt-8 border-t border-slate-100 dark:border-slate-800 pt-6">
            {mode === 'login' ? (
                <div className="space-y-3">
                     <button 
                        onClick={() => resetForm('register_invite')}
                        className="text-xs text-slate-400 hover:text-rose-500 font-bold uppercase tracking-wide transition-colors"
                    >
                        Tenho um código de convite
                    </button>
                </div>
            ) : (
                <button 
                    onClick={() => resetForm('login')}
                    className="text-sm text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 font-bold transition-colors"
                >
                    Voltar para Login
                </button>
            )}
        </div>
        
        {mode === 'login' && (
            <div className="mt-8 flex items-center justify-center space-x-2 text-[10px] text-slate-300">
                <Sparkles size={10} />
                <span>Ambiente Seguro</span>
            </div>
        )}
      </div>
    </div>
  );
};

export default LoginScreen;