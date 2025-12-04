import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GoogleGenAI, Type } from '@google/genai';

// Define o tipo para o resultado da análise para melhor segurança de tipos
interface MarketAnalysis {
  cardName: string;
  estimatedValue: number;
  priceTrend: 'rising' | 'stable' | 'falling';
  demand: 'high' | 'medium' | 'low';
  shortAnalysis: string;
  investmentRecommendation: string;
}

@Component({
  selector: 'app-market-analysis',
  templateUrl: './market-analysis.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
})
export class MarketAnalysisComponent {
  // --- Sinais de Estado ---
  searchTerm = signal('');
  loading = signal(false);
  error = signal<string | null>(null);
  analysisResult = signal<MarketAnalysis | null>(null);
  generatedImage = signal<string | null>(null);
  // Mostra um estado inicial/boas-vindas antes da primeira busca
  initialState = signal(true);

  private ai: GoogleGenAI;

  constructor() {
    // É seguro usar process.env aqui, pois é um placeholder para o sistema de build.
    this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
  }

  onSearchTermChange(event: Event) {
    const target = event.target as HTMLInputElement;
    this.searchTerm.set(target.value);
  }

  async getMarketAnalysis() {
    if (!this.searchTerm().trim()) return;

    // Reseta os estados para uma nova busca
    this.loading.set(true);
    this.error.set(null);
    this.analysisResult.set(null);
    this.generatedImage.set(null);
    this.initialState.set(false);

    try {
      const cardName = this.searchTerm();

      // Define a estrutura de saída JSON desejada
      const analysisSchema = {
        type: Type.OBJECT,
        properties: {
          cardName: { type: Type.STRING, description: 'O nome completo da carta.' },
          estimatedValue: { type: Type.NUMBER, description: 'O valor de mercado atual estimado em BRL.' },
          priceTrend: { type: Type.STRING, enum: ['rising', 'stable', 'falling'], description: 'A tendência de preço atual.' },
          demand: { type: Type.STRING, enum: ['high', 'medium', 'low'], description: 'A demanda de mercado atual.' },
          shortAnalysis: { type: Type.STRING, description: 'Uma breve análise de 2-3 frases sobre a posição da carta no mercado.' },
          investmentRecommendation: { type: Type.STRING, description: 'Uma curta recomendação de investimento (ex: "Bom momento para comprar", "Manter", "Considere vender").' }
        },
        required: ['cardName', 'estimatedValue', 'priceTrend', 'demand', 'shortAnalysis', 'investmentRecommendation']
      };

      // --- Chamadas de API Paralelas ---
      const [analysisResponse, imageResponse] = await Promise.all([
        // 1. Obter análise de mercado
        this.ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: `Forneça uma análise de mercado para a carta: "${cardName}". Considere sua raridade, vendas recentes e interesse geral dos colecionadores. Responda em português do Brasil.`,
          config: {
            responseMimeType: 'application/json',
            responseSchema: analysisSchema,
          },
        }),
        // 2. Gerar uma imagem da carta
        this.ai.models.generateImages({
          model: 'imagen-4.0-generate-001',
          prompt: `Uma ilustração digital artística, de alta qualidade e profissional da carta "${cardName}". O estilo deve ser épico e visualmente impressionante, com iluminação dinâmica e um fundo limpo. Foco na arte, não em uma foto de uma carta física.`,
          config: {
            numberOfImages: 1,
            outputMimeType: 'image/jpeg',
            aspectRatio: '3:4',
          },
        }),
      ]);

      // --- Processar Respostas ---

      // Processar análise
      const analysisText = analysisResponse.text.trim();
      const analysisData = JSON.parse(analysisText) as MarketAnalysis;
      this.analysisResult.set(analysisData);

      // Processar imagem
      const base64ImageBytes = imageResponse.generatedImages[0].image.imageBytes;
      const imageUrl = `data:image/jpeg;base64,${base64ImageBytes}`;
      this.generatedImage.set(imageUrl);

    } catch (err: any) {
      console.error('Erro ao buscar análise:', err);
      this.error.set('Falha ao obter análise de mercado. Por favor, tente novamente.');
    } finally {
      this.loading.set(false);
    }
  }
}