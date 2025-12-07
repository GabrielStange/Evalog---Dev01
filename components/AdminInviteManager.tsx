
import React, { useEffect, useState } from 'react';
import { supabase } from '../services/supabaseClient';
import { InviteCode, ThemeColor } from '../types';
import { Ticket, Copy, Check, X, RefreshCw, Plus, Users } from 'lucide-react';
import { getUserFamily } from '../services/storageService';

interface AdminInviteManagerProps {
    onClose: () => void;
    themeColor: ThemeColor;
}

const AdminInviteManager: React.FC<AdminInviteManagerProps> = ({ onClose, themeColor }) => {
    const [invites, setInvites] = useState<InviteCode[]>([]);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [familyId, setFamilyId] = useState<string | null>(null);

    const loadData = async () => {
        setLoading(true);
        const family = await getUserFamily();
        if (family) {
            setFamilyId(family.id);
            const { data, error } = await supabase
                .from('invites')
                .select('*')
                .eq('family_id', family.id)
                .order('created_at', { ascending: false });
            
            if (data) setInvites(data as InviteCode[]);
        }
        setLoading(false);
    };

    useEffect(() => {
        loadData();
    }, []);

    const generateInvite = async () => {
        if (!familyId) return;
        setGenerating(true);
        // Generate a random 6 char code
        const code = Math.random().toString(36).substring(2, 8).toUpperCase();
        
        const { error } = await supabase
            .from('invites')
            .insert([{ code, family_id: familyId }]);

        if (error) {
            alert('Erro ao gerar convite: ' + error.message);
        } else {
            await loadData();
        }
        setGenerating(false);
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        alert(`Código ${text} copiado!`);
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[80vh]" onClick={e => e.stopPropagation()}>
                <div className={`bg-slate-800 p-4 flex justify-between items-center text-white`}>
                    <div className="flex items-center gap-2">
                        <Users size={20} className="text-white" />
                        <h3 className="font-bold text-lg">Convidar para Família</h3>
                    </div>
                    <button onClick={onClose}><X size={24} /></button>
                </div>

                <div className="p-4 bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800">
                    <button 
                        onClick={generateInvite}
                        disabled={generating || !familyId}
                        className={`w-full bg-${themeColor}-500 text-white font-bold py-3 rounded-xl shadow-md hover:bg-${themeColor}-600 disabled:opacity-50 flex items-center justify-center gap-2 transition-colors`}
                    >
                        {generating ? <RefreshCw className="animate-spin" size={20} /> : <Plus size={20} />}
                        Gerar Novo Convite
                    </button>
                    <p className="text-xs text-slate-500 mt-2 text-center">
                        Envie este código para quem você quer adicionar à sua família no app.
                    </p>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                    {loading ? (
                        <div className="text-center py-8 text-slate-400">Carregando...</div>
                    ) : invites.length === 0 ? (
                        <div className="text-center py-8 text-slate-400">Nenhum convite ativo.</div>
                    ) : (
                        invites.map((invite) => (
                            <div key={invite.code} className="flex items-center justify-between bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-100 dark:border-slate-700">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="font-mono font-bold text-lg text-slate-800 dark:text-slate-100">{invite.code}</span>
                                        {invite.used_at ? (
                                            <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-bold">USADO</span>
                                        ) : (
                                            <span className="text-xs bg-emerald-100 text-emerald-600 px-2 py-0.5 rounded-full font-bold">DISPONÍVEL</span>
                                        )}
                                    </div>
                                    <p className="text-xs text-slate-400 mt-0.5">
                                        {new Date(invite.created_at).toLocaleDateString()} 
                                        {invite.used_at && ` • Usado em ${new Date(invite.used_at).toLocaleDateString()}`}
                                    </p>
                                </div>
                                {!invite.used_at && (
                                    <button 
                                        onClick={() => copyToClipboard(invite.code)}
                                        className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-slate-700 rounded-lg transition-colors"
                                        title="Copiar código"
                                    >
                                        <Copy size={18} />
                                    </button>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdminInviteManager;
