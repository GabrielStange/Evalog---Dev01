import { GoogleGenAI } from "@google/genai";
import { FeedingRecord, BabyProfile } from '../types';

export const analyzeFeedingData = async (
    records: FeedingRecord[], 
    babyProfile: BabyProfile | undefined, 
    userQuestion: string | undefined
): Promise<string> => {
  
  // Use process.env.API_KEY exclusively as per guidelines
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  // Filter logs to last 7 days
  const recentLogs = records.filter(r => {
    const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
    return r.startTime > sevenDaysAgo;
  });

  const logsSummary = recentLogs.map(r => ({
    tipo: r.type === 'bottle' ? 'Mamadeira' : (r.type === 'breast_left' ? 'Seio Esquerdo' : 'Seio Direito'),
    inicio: new Date(r.startTime).toLocaleString('pt-BR'),
    duracao_minutos: r.durationSeconds ? Math.round(r.durationSeconds / 60) : 0,
    volume_ml: r.volumeMl || 0,
  }));

  let babyInfoStr = "";
  if (babyProfile) {
      const ageMs = Date.now() - babyProfile.birthDate;
      const ageDays = Math.floor(ageMs / (1000 * 60 * 60 * 24));
      const ageMonths = Math.floor(ageDays / 30);
      babyInfoStr = `
        Dados do Bebê:
        - Nome: ${babyProfile.name}
        - Idade: ${ageMonths} meses (${ageDays} dias)
        - Sexo: ${babyProfile.gender === 'girl' ? 'Menina' : 'Menino'}
        - Peso Atual: ${babyProfile.weightKg ? babyProfile.weightKg + 'kg' : 'Não informado'}
        - Altura Atual: ${babyProfile.heightCm ? babyProfile.heightCm + 'cm' : 'Não informado'}
      `;
  } else {
      babyInfoStr = "Dados do bebê não especificados (assumir média de 4 meses se não informado).";
  }

  const systemInstruction = `
    Você é um especialista gentil e solidário em amamentação e nutrição infantil.
    Seu objetivo é analisar os registros de alimentação e responder a perguntas dos pais sobre seu filho específico.
    
    ${babyInfoStr}

    Analise a frequência, duração e volume (se aplicável) com base na IDADE exata do bebê fornecida acima.
    Responda sempre em Português do Brasil de forma acolhedora (use emojis ocasionais).
    Se houver sinais de alerta óbvios (ex: perda de peso implícita pela falta de alimentação, ou intervalos muito longos para a idade), sugira gentilmente consultar um médico, mas não dê diagnósticos médicos.
    
    Dados recentes de alimentação (JSON simplificado):
    ${JSON.stringify(logsSummary).slice(0, 10000)}
  `;

  const prompt = userQuestion 
    ? `O usuário perguntou: "${userQuestion}"`
    : `Por favor, faça uma análise geral dos padrões de alimentação de ${babyProfile?.name || 'minha filha'} nos últimos dias. Há algo que devamos observar para a idade del(a)?`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        systemInstruction: systemInstruction,
      }
    });

    return response.text || "Não consegui gerar uma análise no momento.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Desculpe, ocorreu um erro ao conectar com a inteligência artificial. Verifique se sua Chave de API é válida.";
  }
};