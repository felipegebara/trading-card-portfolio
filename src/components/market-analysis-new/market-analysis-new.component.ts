import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { supabase } from '../../supabaseClient';

interface MarketCard {
  carta: string;
  preco_atual?: number;
  colecao?: string;
  variacao_7d?: number;
  volume?: number;
}

interface MarketStats {
  totalValue: number;
  topGainer: { name: string; change: number };
  averagePrice: number;
  totalCards: number;
}

@Component({
  selector: 'app-market-analysis-new',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="market-analysis">
      <header class="page-header">
        <h1>📊 Análise de Mercado</h1>
        <p class="subtitle">Acompanhe tendências e preços do mercado Pokémon TCG</p>
      </header>

      <!-- Loading State -->
      <div *ngIf="loading()" class="loading">
        <div class="spinner"></div>
        <p>Carregando dados do mercado...</p>
      </div>

      <!-- Stats Cards -->
      <div *ngIf="!loading()" class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon">💰</div>
          <div class="stat-content">
            <p class="stat-label">Valor Total Mercado</p>
            <p class="stat-value">R$ {{ formatNumber(stats().totalValue) }}</p>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon">📈</div>
          <div class="stat-content">
            <p class="stat-label">Maior Alta (7d)</p>
            <p class="stat-value-small">{{ stats().topGainer.name }}</p>
            <p class="stat-change positive">+{{ stats().topGainer.change }}%</p>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon">💳</div>
          <div class="stat-content">
            <p class="stat-label">Preço Médio</p>
            <p class="stat-value">R$ {{ formatNumber(stats().averagePrice) }}</p>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon">🎴</div>
          <div class="stat-content">
            <p class="stat-label">Total de Cartas</p>
            <p class="stat-value">{{ stats().totalCards }}</p>
          </div>
        </div>
      </div>

      <!-- Top Cards Section -->
      <div *ngIf="!loading()" class="content-section">
        <h2 class="section-title">🏆 Top 10 Cartas Mais Valiosas</h2>
        <div class="top-cards-grid">
          <div *ngFor="let card of topCards(); let i = index" class="top-card-item">
            <div class="rank">{{ i + 1 }}</div>
            <div class="card-info">
              <h3>{{ card.carta }}</h3>
              <p class="collection">{{ card.colecao || 'N/A' }}</p>
            </div>
            <div class="card-price">
              <p class="price">R$ {{ formatNumber(card.preco_atual || 0) }}</p>
              <p class="change" [class.positive]="(card.variacao_7d || 0) > 0" [class.negative]="(card.variacao_7d || 0) < 0">
                {{ (card.variacao_7d || 0) > 0 ? '+' : '' }}{{ (card.variacao_7d || 0).toFixed(1) }}%
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Market Table -->
      <div *ngIf="!loading()" class="content-section">
        <h2 class="section-title">📋 Tabela de Mercado</h2>
        <div class="table-container">
          <table class="market-table">
            <thead>
              <tr>
                <th>Carta</th>
                <th>Coleção</th>
                <th>Preço Atual</th>
                <th>Variação 7d</th>
                <th>Volume</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let card of marketCards()">
                <td class="card-name">{{ card.carta }}</td>
                <td class="collection">{{ card.colecao || 'N/A' }}</td>
                <td class="price">R$ {{ formatNumber(card.preco_atual || 0) }}</td>
                <td [class.positive]="(card.variacao_7d || 0) > 0" [class.negative]="(card.variacao_7d || 0) < 0">
                  {{ (card.variacao_7d || 0) > 0 ? '+' : '' }}{{ (card.variacao_7d || 0).toFixed(1) }}%
                </td>
                <td>{{ card.volume || 0 }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Collections Comparison -->
      <div *ngIf="!loading()" class="content-section">
        <h2 class="section-title">📦 Comparação por Coleção</h2>
        <div class="collections-grid">
          <div *ngFor="let col of collectionStats()" class="collection-card">
            <h3>{{ col.name }}</h3>
            <div class="col-stats">
              <div class="col-stat">
                <span class="label">Cartas:</span>
                <span class="value">{{ col.count }}</span>
              </div>
              <div class="col-stat">
                <span class="label">Preço Médio:</span>
                <span class="value">R$ {{ formatNumber(col.avgPrice) }}</span>
              </div>
              <div class="col-stat">
                <span class="label">Valorização:</span>
                <span class="value" [class.positive]="col.growth > 0" [class.negative]="col.growth < 0">
                  {{ col.growth > 0 ? '+' : '' }}{{ col.growth.toFixed(1) }}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .market-analysis {
      padding: 20px;
      max-width: 1400px;
      margin: 0 auto;
    }

    .page-header {
      margin-bottom: 32px;
    }

    .page-header h1 {
      font-size: 32px;
      color: #22c55e;
      margin: 0 0 8px 0;
    }

    .subtitle {
      color: #9ca3af;
      font-size: 16px;
      margin: 0;
    }

    .loading {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 80px 20px;
      color: #9ca3af;
    }

    .spinner {
      width: 50px;
      height: 50px;
      border: 4px solid #1f2937;
      border-top-color: #22c55e;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin-bottom: 16px;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 20px;
      margin-bottom: 32px;
    }

    .stat-card {
      background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
      border-radius: 12px;
      padding: 20px;
      display: flex;
      gap: 16px;
      border: 1px solid #1f2937;
    }

    .stat-icon {
      font-size: 40px;
    }

    .stat-content {
      flex: 1;
    }

    .stat-label {
      font-size: 12px;
      color: #9ca3af;
      margin: 0 0 8px 0;
    }

    .stat-value {
      font-size: 28px;
      font-weight: bold;
      color: #22c55e;
      margin: 0;
    }

    .stat-value-small {
      font-size: 14px;
      font-weight: 600;
      color: #e5e7eb;
      margin: 0 0 4px 0;
    }

    .stat-change {
      font-size: 16px;
      font-weight: 600;
      margin: 0;
    }

    .stat-change.positive {
      color: #22c55e;
    }

    .stat-change.negative {
      color: #ef4444;
    }

    .content-section {
      margin-bottom: 32px;
    }

    .section-title {
      font-size: 24px;
      color: #e5e7eb;
      margin: 0 0 20px 0;
    }

    .top-cards-grid {
      display: grid;
      gap: 12px;
    }

    .top-card-item {
      background: #0f172a;
      border: 1px solid #1f2937;
      border-radius: 10px;
      padding: 16px;
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .rank {
      font-size: 28px;
      font-weight: bold;
      color: #22c55e;
      min-width: 40px;
    }

    .card-info {
      flex: 1;
    }

    .card-info h3 {
      font-size: 16px;
      color: #e5e7eb;
      margin: 0 0 4px 0;
    }

    .card-info .collection {
      font-size: 12px;
      color: #9ca3af;
      margin: 0;
    }

    .card-price {
      text-align: right;
    }

    .card-price .price {
      font-size: 20px;
      font-weight: bold;
      color: #22c55e;
      margin: 0 0 4px 0;
    }

    .card-price .change {
      font-size: 14px;
      font-weight: 600;
      margin: 0;
    }

    .table-container {
      background: #0f172a;
      border: 1px solid #1f2937;
      border-radius: 10px;
      overflow-x: auto;
    }

    .market-table {
      width: 100%;
      border-collapse: collapse;
    }

    .market-table thead {
      background: #1e293b;
    }

    .market-table th {
      padding: 12px 16px;
      text-align: left;
      font-size: 12px;
      font-weight: 600;
      color: #9ca3af;
      text-transform: uppercase;
    }

    .market-table td {
      padding: 16px;
      border-top: 1px solid #1f2937;
      color: #e5e7eb;
    }

    .market-table .card-name {
      font-weight: 600;
    }

    .market-table .collection {
      color: #9ca3af;
      font-size: 14px;
    }

    .market-table .price {
      font-weight: 600;
      color: #22c55e;
    }

    .market-table .positive {
      color: #22c55e;
      font-weight: 600;
    }

    .market-table .negative {
      color: #ef4444;
      font-weight: 600;
    }

    .collections-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 20px;
    }

    .collection-card {
      background: #0f172a;
      border: 1px solid #1f2937;
      border-radius: 10px;
      padding: 20px;
    }

    .collection-card h3 {
      font-size: 18px;
      color: #22c55e;
      margin: 0 0 16px 0;
    }

    .col-stats {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .col-stat {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .col-stat .label {
      font-size: 14px;
      color: #9ca3af;
    }

    .col-stat .value {
      font-size: 16px;
      font-weight: 600;
      color: #e5e7eb;
    }
  `]
})
export class MarketAnalysisNewComponent implements OnInit {
  loading = signal(true);
  stats = signal<MarketStats>({
    totalValue: 0,
    topGainer: { name: 'N/A', change: 0 },
    averagePrice: 0,
    totalCards: 0
  });
  topCards = signal<MarketCard[]>([]);
  marketCards = signal<MarketCard[]>([]);
  collectionStats = signal<any[]>([]);

  async ngOnInit() {
    await this.loadMarketData();
  }

  private async loadMarketData() {
    try {
      console.log('📊 Carregando dados de mercado...');

      // Buscar cartas do catálogo
      const { data, error } = await supabase
        .from('myp_cards_meg')
        .select('carta, preco_atual, colecao, numero')
        .order('preco_atual', { ascending: false, nullsFirst: false });

      if (error) {
        console.error('Erro ao carregar:', error);
        this.loading.set(false);
        return;
      }

      if (!data || data.length === 0) {
        this.loading.set(false);
        return;
      }

      // Processar dados
      const cards: MarketCard[] = data.map(card => ({
        carta: card.carta,
        preco_atual: card.preco_atual || 0,
        colecao: card.colecao,
        variacao_7d: Math.random() * 30 - 10, // Mock data
        volume: Math.floor(Math.random() * 100)
      }));

      // Top 10 cartas
      this.topCards.set(cards.slice(0, 10));

      // Todas as cartas para tabela (primeiras 20)
      this.marketCards.set(cards.slice(0, 20));

      // Calcular estatísticas
      const totalValue = cards.reduce((sum, c) => sum + (c.preco_atual || 0), 0);
      const avgPrice = totalValue / cards.length;
      const topGainer = cards.reduce((max, c) =>
        (c.variacao_7d || 0) > (max.variacao_7d || 0) ? c : max
        , cards[0]);

      this.stats.set({
        totalValue,
        averagePrice: avgPrice,
        topGainer: {
          name: topGainer.carta,
          change: topGainer.variacao_7d || 0
        },
        totalCards: cards.length
      });

      // Estatísticas por coleção
      const collections = cards.reduce((acc: any, card) => {
        const col = card.colecao || 'Sem Coleção';
        if (!acc[col]) {
          acc[col] = { cards: [], prices: [] };
        }
        acc[col].cards.push(card);
        acc[col].prices.push(card.preco_atual || 0);
        return acc;
      }, {});

      const colStats = Object.entries(collections).map(([name, data]: [string, any]) => ({
        name,
        count: data.cards.length,
        avgPrice: data.prices.reduce((a: number, b: number) => a + b, 0) / data.prices.length,
        growth: Math.random() * 20 - 5 // Mock
      })).slice(0, 6);

      this.collectionStats.set(colStats);

      console.log('✅ Dados carregados');
      this.loading.set(false);

    } catch (e) {
      console.error('Erro:', e);
      this.loading.set(false);
    }
  }

  formatNumber(num: number): string {
    return num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
}
