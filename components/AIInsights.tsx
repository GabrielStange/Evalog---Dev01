import React, { useState } from 'react';
import { FeedingRecord, BabyProfile, ThemeColor } from '../types';
import { analyzeFeedingData } from '../services/geminiService';
import { Sparkles, Send, Loader2 } from 'lucide-react';

interface AIInsightsProps {
  records: FeedingRecord[];
  babyProfile: BabyProfile | undefined;
  themeColor: ThemeColor;
}

const AIInsights: React.FC<AIInsightsProps> = ({ records, babyProfile, themeColor }) => {
  const [response, setResponse] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [question, setQuestion] = useState('');

  const handleAnalysis = async (customQuestion?: string) => {
    setLoading(true);
    setResponse(null);
    const result = await analyzeFeedingData(records, babyProfile, customQuestion);
    setResponse(result);
    setLoading(false);
  };

  return (
    <div className="w-full max-w-md mx-auto p-4 h-full flex flex-col">
      <div className={`bg-gradient-to-br from-${themeColor}-500 to-${themeColor}-400 rounded-3xl p-6 text-white shadow-lg mb-6 transition-colors relative`}>
        <div className="flex items-center space-x-2 mb-2">
            <Sparkles size={24} className="text-white/80" />
            <h2 className="text-xl font-bold">Assistente Inteligente</h2>
        </div>
        <p className="text-white/90 text-sm leading-relaxed pr-8">
            {babyProfile 
             ? `Olá! Estou analisando os dados de ${babyProfile.name}. Posso dar dicas sobre amamentação e rotina.` 
             : "Olá! Posso analisar os dados de alimentação do bebê e responder dúvidas."}
        </p>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto mb-4 space-y-4">
        {!response && !loading && (
             <div className="text-center text-slate-400 mt-8 px-8">
                <Sparkles size={48} className={`mx-auto mb-4 text-${themeColor}-200 dark:text-slate-700`} />
                <p>Toque abaixo para gerar um relatório ou faça uma pergunta específica.</p>
             </div>
        )}

        {loading && (
            <div className="flex justify-center items-center py-8">
                <Loader2 size={32} className={`text-${themeColor}-500 dark:text-${themeColor}-400 animate-spin`} />
                <span className="ml-3 text-slate-500 font-medium">Analisando dados...</span>
            </div>
        )}

        {response && (
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className={`prose prose-${themeColor} dark:prose-invert prose-sm max-w-none text-slate-700 dark:text-slate-300 whitespace-pre-line`}>
                    {response}
                </div>
            </div>
        )}
      </div>

      {/* Input Area */}
      <div className="mt-auto space-y-3">
         <button 
            onClick={() => handleAnalysis()}
            className={`w-full bg-white dark:bg-slate-800 border-2 border-${themeColor}-200 dark:border-slate-700 text-${themeColor}-600 dark:text-${themeColor}-400 font-bold py-3 rounded-xl hover:bg-${themeColor}-50 dark:hover:bg-slate-700 transition-colors flex items-center justify-center`}
         >
            <Sparkles size={18} className="mr-2" />
            Gerar Resumo Semanal
         </button>

         <div className="flex items-center space-x-2 relative">
            <input 
                type="text"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Ex: A frequência está normal?"
                className={`w-full p-4 pr-12 rounded-xl bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:border-${themeColor}-400 focus:outline-none shadow-sm transition-colors`}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' && question) {
                        handleAnalysis(question);
                        setQuestion('');
                    }
                }}
            />
            <button 
                onClick={() => {
                    if (question) {
                        handleAnalysis(question);
                        setQuestion('');
                    }
                }}
                disabled={!question || loading}
                className={`absolute right-2 bg-${themeColor}-500 p-2 rounded-lg text-white hover:bg-${themeColor}-600 disabled:opacity-50 transition-colors shadow-md`}
            >
                <Send size={18} />
            </button>
         </div>
      </div>
    </div>
  );
};

export default AIInsights;