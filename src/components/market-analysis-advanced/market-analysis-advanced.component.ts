import { Component, OnInit, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { supabase } from '../../supabaseClient';
import { Chart } from 'chart.js/auto';

// Interfaces
interface CardMetadata {
  slug: string;
  name: string;
  image_url?: string;
  set_name?: string;
  set_num?: string;
}

interface MarketOffer {
  id?: string;
  date: Date;
  price: number;
  source: 'liga' | 'myp';
  condition?: string;
  language?: string;
  seller?: string;
}

interface DailyStats {
  date: string; // YYYY-MM-DD
  minPrice: number;
  avgPrice: number;
  volume: number;
  movingAvg7d?: number;
}

interface KPI {
  currentMinPrice: number;
  avgPrice7d: number;
  variation30d: number;
  liquidity: number; // offers/day
  volatility: number;
}

// Helper de normalização
function normalize(str: string | null | undefined): string {
  return (str ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // remove acentos
    .toLowerCase()
    .trim();
}

@Component({
  selector: 'app-market-analysis-advanced',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="dashboard-container">
      <!-- Header / Search -->
      <header class="dashboard-header">
        <div class="search-section">
          <div class="search-wrapper">
            <span class="search-icon">🔍</span>
            <input
              type="text"
              [ngModel]="searchTerm()"
              (ngModelChange)="searchTerm.set($event)"
              class="search-input"
              placeholder="Buscar carta (ex: Charizard)..."
            />
            
            @if (showDropdown() && filteredCards().length > 0) {
              <div class="search-results">
                @for (card of filteredCards().slice(0, 50); track card.slug) {
                  <div class="search-item" (click)="selectCard(card)">
                    {{ card.card_name }}
                  </div>
                }
              </div>
            }
            @if (showDropdown() && filteredCards().length === 0 && searchTerm().length > 2) {
               <div class="search-results">
                  <div class="search-item no-results">
                     Nenhuma carta encontrada...
                  </div>
               </div>
            }
          </div>
        </div>
      </header>

      @if (loading()) {
        <div class="loading-state">
          <div class="spinner"></div>
          <p>Carregando dados do mercado...</p>
        </div>
      }

      @if (!loading() && selectedMetadata()) {
        <div class="main-content">
          <!-- Top Section: Card Info + KPIs -->
          <div class="top-section">
            <!-- Card Image & Info -->
            <div class="card-profile section-card">
              <div class="card-image-wrapper">
                <img [src]="selectedMetadata()?.image_url || 'assets/placeholder-card.png'" 
                     alt="{{ selectedMetadata()?.name }}" 
                     class="card-image"
                     (error)="handleImageError($event)">
              </div>
              <div class="card-details">
                <h1>{{ selectedMetadata()?.name }}</h1>
                <div class="badges">
                  <span class="badge set">{{ selectedMetadata()?.set_name || 'Coleção Desconhecida' }}</span>
                  <span class="badge num">#{{ selectedMetadata()?.set_num || '???' }}</span>
                </div>
              </div>
            </div>

            <!-- KPIs Grid -->
            <div class="kpi-grid">
              <div class="kpi-item">
                <div class="kpi-header">
                  <span class="kpi-icon">🏷️</span>
                  <span class="kpi-label">Preço Mínimo</span>
                </div>
                <span class="kpi-value">R$ {{ kpis()?.currentMinPrice | number:'1.2-2' }}</span>
              </div>
              
              <div class="kpi-item">
                <div class="kpi-header">
                  <span class="kpi-icon">📈</span>
                  <span class="kpi-label">Média (7 dias)</span>
                </div>
                <span class="kpi-value">R$ {{ kpis()?.avgPrice7d | number:'1.2-2' }}</span>
              </div>

              <div class="kpi-item">
                <div class="kpi-header">
                  <span class="kpi-icon">📊</span>
                  <span class="kpi-label">Variação (30d)</span>
                </div>
                <span class="kpi-value" [class.positive]="(kpis()?.variation30d || 0) >= 0" [class.negative]="(kpis()?.variation30d || 0) < 0">
                  {{ kpis()?.variation30d | number:'1.1-1' }}%
                </span>
              </div>

              <div class="kpi-item">
                <div class="kpi-header">
                  <span class="kpi-icon">💧</span>
                  <span class="kpi-label">Liquidez</span>
                </div>
                <span class="kpi-value">{{ kpis()?.liquidity | number:'1.1-1' }} <small>/dia</small></span>
              </div>

              <div class="kpi-item">
                <div class="kpi-header">
                  <span class="kpi-icon">⚡</span>
                  <span class="kpi-label">Volatilidade</span>
                </div>
                <span class="kpi-value">{{ kpis()?.volatility | number:'1.1-1' }}%</span>
              </div>
            </div>
          </div>

          <!-- Charts Section -->
          <div class="charts-grid">
            <!-- Main Price Chart -->
            <div class="chart-card main-chart section-card">
              <h3 class="section-title">📉 Histórico de Preço & Tendência</h3>
              <div class="chart-container">
                <canvas id="priceChart"></canvas>
              </div>
            </div>

            <!-- Volume Chart -->
            <div class="chart-card volume-chart section-card">
              <h3 class="section-title">📊 Volume de Ofertas</h3>
              <div class="chart-container">
                <canvas id="volumeChart"></canvas>
              </div>
            </div>
          </div>

          <!-- Seller Flow Analysis -->
          <div class="analysis-section">
            <div class="analysis-card section-card">
              <h3 class="section-title">🔄 Fluxo de Vendedores (Hoje)</h3>
              <div class="flow-stats">
                <div class="flow-item in">
                  <span class="flow-count">+{{ sellerFlow()?.newSellers?.length || 0 }}</span>
                  <span class="flow-label">Novas Entradas</span>
                </div>
                <div class="flow-divider"></div>
                <div class="flow-item out">
                  <span class="flow-count">-{{ sellerFlow()?.exitedSellers?.length || 0 }}</span>
                  <span class="flow-label">Saídas</span>
                </div>
              </div>
              @if (sellerFlow()?.newSellers?.length) {
                <div class="seller-list">
                  <p><strong>Entraram:</strong> {{ getSellerNames(sellerFlow()?.newSellers) }}</p>
                </div>
              }
            </div>

            <div class="analysis-card section-card">
              <h3 class="section-title">💡 Insights</h3>
              <ul class="insights-list">
                @for (insight of insights(); track $index) {
                  <li>{{ insight }}</li>
                }
              </ul>
            </div>
          </div>

          <!-- Detailed Offers Toggle -->
          <div class="details-section">
            <button class="btn-toggle" (click)="toggleDetails()">
              {{ showDetails() ? 'Ocultar Ofertas Detalhadas' : 'Ver Ofertas Detalhadas' }}
            </button>
            
            @if (showDetails()) {
              <div class="table-wrapper section-card">
                <table>
                  <thead>
                    <tr>
                      <th>Data</th>
                      <th>Vendedor</th>
                      <th>Preço</th>
                      <th>Condição</th>
                      <th>Fonte</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (offer of sortedOffers().slice(0, 50); track $index) {
                      <tr>
                        <td>{{ offer.date | date:'dd/MM/yyyy' }}</td>
                        <td>{{ offer.seller || 'N/A' }}</td>
                        <td><strong>R$ {{ offer.price | number:'1.2-2' }}</strong></td>
                        <td>{{ offer.condition || '-' }}</td>
                        <td>
                          <span class="source-badge" [class.liga]="offer.source === 'liga'" [class.myp]="offer.source === 'myp'">
                            {{ offer.source | uppercase }}
                          </span>
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            }
          </div>

        </div>
      }

      @if (!loading() && !selectedMetadata() && searchTerm()) {
        <div class="empty-state">
          <p>Selecione uma carta para ver a análise.</p>
        </div>
      }
    </div>
  `,
  styles: [`
    :host {
      display: block;
      background: #f8fafc;
      min-height: 100vh;
      font-family: 'Inter', sans-serif;
      color: #1e293b;
    }

    .dashboard-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 32px 24px;
    }

    /* Cards & Containers */
    .section-card {
      background: white;
      border-radius: 16px;
      padding: 24px;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);
      border: 1px solid #f1f5f9;
    }

    .section-title {
      font-size: 14px;
      font-weight: 700;
      color: #64748b;
      margin: 0 0 20px 0;
      text-transform: uppercase;
      letter-spacing: 1px;
      display: flex;
      align-items: center;
      gap: 10px;
    }

    /* Header & Search */
    .dashboard-header {
      margin-bottom: 40px;
      display: flex;
      justify-content: center;
    }

    .search-wrapper {
      position: relative;
      width: 100%;
      max-width: 500px;
    }

    .search-input {
      width: 100%;
      padding: 14px 20px 14px 48px;
      border: 1px solid #e2e8f0;
      border-radius: 99px; /* Pill shape */
      font-size: 16px;
      background: white;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03);
      transition: all 0.2s;
    }

    .search-input:focus {
      outline: none;
      border-color: #3b82f6;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }

    .search-icon {
      position: absolute;
      left: 18px;
      top: 50%;
      transform: translateY(-50%);
      font-size: 18px;
      color: #94a3b8;
    }

    .search-results {
      position: absolute;
      top: 100%;
      left: 0;
      right: 0;
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      margin-top: 8px;
      max-height: 300px;
      overflow-y: auto;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);
      z-index: 50;
    }

    .search-item {
      padding: 12px 20px;
      cursor: pointer;
      border-bottom: 1px solid #f8fafc;
      transition: background 0.1s;
      font-size: 14px;
    }

    .search-item:hover { background: #f1f5f9; }
    .search-item.no-results { color: #94a3b8; font-style: italic; cursor: default; }

    /* Top Section */
    .top-section {
      display: grid;
      grid-template-columns: 280px 1fr;
      gap: 24px;
      margin-bottom: 24px;
    }

    .card-profile {
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
    }

    .card-image-wrapper {
      margin-bottom: 16px;
      height: 260px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .card-image {
      max-width: 100%;
      max-height: 100%;
      object-fit: contain;
      filter: drop-shadow(0 8px 16px rgba(0,0,0,0.15));
      transition: transform 0.3s;
    }
    
    .card-image:hover { transform: scale(1.02); }

    .card-details h1 {
      font-size: 18px;
      font-weight: 700;
      color: #0f172a;
      margin: 0 0 12px 0;
      line-height: 1.4;
    }

    .badges { display: flex; gap: 8px; justify-content: center; flex-wrap: wrap; }
    .badge { padding: 4px 10px; border-radius: 6px; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }
    .badge.set { background: #eff6ff; color: #3b82f6; border: 1px solid #dbeafe; }
    .badge.num { background: #f8fafc; color: #64748b; border: 1px solid #e2e8f0; }

    /* KPI Grid */
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 16px;
      align-content: start;
    }

    .kpi-item {
      background: white;
      border-radius: 12px;
      padding: 20px;
      border: 1px solid #e2e8f0;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      height: 100%;
      transition: all 0.2s;
    }

    .kpi-item:hover {
      border-color: #cbd5e1;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
    }

    .kpi-header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 12px;
    }

    .kpi-icon { font-size: 20px; }
    .kpi-label { font-size: 12px; font-weight: 600; color: #64748b; text-transform: uppercase; }

    .kpi-value {
      font-size: 24px;
      font-weight: 700;
      color: #0f172a;
    }
    
    .kpi-value small { font-size: 14px; color: #94a3b8; font-weight: 500; }
    .kpi-value.positive { color: #10b981; }
    .kpi-value.negative { color: #ef4444; }

    /* Charts */
    .charts-grid {
      display: grid;
      grid-template-columns: 2fr 1fr;
      gap: 24px;
      margin-bottom: 24px;
    }

    .chart-container { position: relative; height: 320px; width: 100%; }

    /* Analysis */
    .analysis-section {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 24px;
      margin-bottom: 32px;
    }

    .flow-stats {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 40px;
      padding: 20px 0;
    }

    .flow-item { text-align: center; }
    .flow-count { display: block; font-size: 36px; font-weight: 800; line-height: 1; margin-bottom: 4px; }
    .flow-label { font-size: 12px; font-weight: 600; color: #64748b; text-transform: uppercase; }
    .flow-item.in .flow-count { color: #10b981; }
    .flow-item.out .flow-count { color: #ef4444; }
    
    .flow-divider { width: 1px; height: 40px; background: #e2e8f0; }

    .insights-list { list-style: none; padding: 0; margin: 0; }
    .insights-list li {
      padding: 12px 0;
      border-bottom: 1px solid #f1f5f9;
      font-size: 14px;
      color: #334155;
      display: flex;
      align-items: flex-start;
      gap: 10px;
      line-height: 1.5;
    }
    .insights-list li:last-child { border-bottom: none; }

    /* Table */
    .details-section { text-align: center; }
    .btn-toggle {
      background: white;
      border: 1px solid #e2e8f0;
      padding: 10px 24px;
      border-radius: 99px;
      font-size: 14px;
      font-weight: 600;
      color: #64748b;
      cursor: pointer;
      margin-bottom: 24px;
      transition: all 0.2s;
    }
    .btn-toggle:hover { background: #f8fafc; color: #0f172a; border-color: #cbd5e1; }

    .table-wrapper { overflow-x: auto; border-radius: 12px; border: 1px solid #e2e8f0; }
    table { width: 100%; border-collapse: collapse; }
    th { background: #f8fafc; padding: 14px 20px; text-align: left; font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; }
    td { padding: 14px 20px; border-top: 1px solid #f1f5f9; font-size: 13px; color: #334155; }
    tr:hover td { background: #f8fafc; }

    .source-badge { padding: 2px 8px; border-radius: 4px; font-size: 10px; font-weight: 700; text-transform: uppercase; }
    .source-badge.liga { background: #e0f2fe; color: #0284c7; }
    .source-badge.myp { background: #f0fdf4; color: #16a34a; }

    @media (max-width: 1024px) {
      .top-section, .charts-grid, .analysis-section { grid-template-columns: 1fr; }
      .card-image-wrapper { height: 240px; }
    }
  `]
})
export class MarketAnalysisAdvancedComponent implements OnInit {
  // Signals
  loading = signal(false);
  searchTerm = signal('');

  // Data State
  allCards = signal<Array<{ slug: string, card_name: string }>>([]);
  selectedMetadata = signal<CardMetadata | null>(null);
  rawOffers = signal<MarketOffer[]>([]);

  // Computed
  filteredCards = computed(() => {
    const term = normalize(this.searchTerm());
    const cards = this.allCards();

    if (!term || term.length < 2) return [];

    return cards.filter(c => normalize(c.card_name).includes(term)).slice(0, 50);
  });

  showDropdown = computed(() => this.searchTerm().length >= 2);

  sortedOffers = computed(() => {
    return [...this.rawOffers()].sort((a, b) => b.date.getTime() - a.date.getTime());
  });

  kpis = computed(() => this.calculateKPIs(this.rawOffers()));
  dailyStats = computed(() => this.processDailyStats(this.rawOffers()));
  sellerFlow = computed(() => this.analyzeSellerFlow(this.rawOffers()));

  insights = computed(() => {
    const kpi = this.kpis();
    const flow = this.sellerFlow();
    const list: string[] = [];

    if (kpi.variation30d > 10) list.push(`🚀 Forte tendência de alta: +${kpi.variation30d.toFixed(1)}% em 30 dias.`);
    if (kpi.variation30d < -10) list.push(`🔻 Preço em queda: ${kpi.variation30d.toFixed(1)}% em 30 dias.`);
    if (flow.newSellers.length > 2) list.push(`🔥 Aumento de oferta: ${flow.newSellers.length} novos vendedores hoje.`);
    if (kpi.liquidity > 2) list.push(`💧 Alta liquidez: média de ${kpi.liquidity.toFixed(1)} ofertas/dia.`);

    return list.length ? list : ['Nenhum insight relevante no momento.'];
  });

  // UI State
  showDetails = signal(false);
  priceChart: any;
  volumeChart: any;

  async ngOnInit() {
    await this.loadAllCards();
  }

  async loadAllCards() {
    console.log('🔄 Carregando todas as cartas...');
    // Select 'carta' and 'url' to derive slug/name
    const { data, error } = await supabase
      .from('myp_cards_meg')
      .select('carta, url')
      .order('carta', { ascending: true });

    if (error) {
      console.error('❌ Erro ao carregar cartas:', error);
      return;
    }

    if (data) {
      const unique = new Map();
      data.forEach((d: any) => {
        if (d.carta && !unique.has(d.carta)) {
          // Use 'carta' as both name and slug for now since we lack a real slug
          unique.set(d.carta, {
            card_name: d.carta,
            slug: d.carta
          });
        }
      });

      const cards = Array.from(unique.values());
      console.log(`✅ ${cards.length} cartas carregadas.`);
      this.allCards.set(cards);
    }
  }

  async selectCard(card: { slug: string, card_name: string }) {
    this.searchTerm.set(card.card_name);
    this.loading.set(true);

    try {
      await Promise.all([
        this.fetchMetadata(card.slug),
        this.fetchMarketHistory(card.slug)
      ]);

    } catch (e) {
      console.error(e);
    } finally {
      this.loading.set(false);
      setTimeout(() => {
        this.updateCharts();
      }, 100);
    }
  }

  async fetchMetadata(slug: string) {
    // 1. Get basic info from myp_cards_meg
    const { data: cardData } = await supabase
      .from('myp_cards_meg')
      .select('*')
      .eq('carta', slug)
      .limit(1)
      .single();

    // 2. Get image from card_images
    const { data: imageData } = await supabase
      .from('card_images')
      .select('image_url')
      .eq('carta', slug)
      .limit(1)
      .single();

    if (cardData) {
      this.selectedMetadata.set({
        slug: cardData.carta,
        name: cardData.carta,
        image_url: imageData?.image_url || null,
        set_name: 'MYP Cards',
        set_num: '---'
      });
    }
  }

  async fetchMarketHistory(slug: string) {
    const offers: MarketOffer[] = [];

    // 1. Fetch from Liga (History)
    const { data: ligaData } = await supabase
      .from('cartas_precos_liga')
      .select('*')
      .or(`slug_carta.eq.${slug},nome.eq.${slug},carta.eq.${slug}`)
      .order('data_coleta', { ascending: true });

    if (ligaData) {
      ligaData.forEach((d: any) => {
        offers.push({
          date: new Date(d.data_coleta || d.created_at),
          price: d.preco || d.price,
          source: 'liga',
          condition: d.estado || d.condition,
          seller: d.vendedor || d.seller
        });
      });
    }

    // 2. Fetch from MYP (myp_cards_meg)
    const { data: mypData } = await supabase
      .from('myp_cards_meg')
      .select('*')
      .eq('carta', slug)
      .order('data_coleta', { ascending: true });

    if (mypData) {
      mypData.forEach((d: any) => {
        offers.push({
          date: new Date(d.data_coleta),
          price: d.valor,
          source: 'myp',
          condition: d.estado,
          seller: d.vendedor
        });
      });
    }

    this.rawOffers.set(offers);
  }

  calculateKPIs(offers: MarketOffer[]): KPI {
    if (!offers.length) return { currentMinPrice: 0, avgPrice7d: 0, variation30d: 0, liquidity: 0, volatility: 0 };

    const sorted = [...offers].sort((a, b) => b.date.getTime() - a.date.getTime());
    const latestDate = sorted[0].date;
    const sevenDaysAgo = new Date(latestDate);
    sevenDaysAgo.setDate(latestDate.getDate() - 7);
    const thirtyDaysAgo = new Date(latestDate);
    thirtyDaysAgo.setDate(latestDate.getDate() - 30);

    // Current Min
    const latestOffers = sorted.filter(o => o.date.getTime() === latestDate.getTime());
    const currentMin = Math.min(...latestOffers.map(o => o.price));

    // Avg 7d
    const last7d = sorted.filter(o => o.date >= sevenDaysAgo);
    const avg7d = last7d.reduce((acc, o) => acc + o.price, 0) / (last7d.length || 1);

    // Variation 30d
    const oldOffers = sorted.filter(o => o.date <= thirtyDaysAgo && o.date > new Date(thirtyDaysAgo.getTime() - 86400000 * 5)); // Window around 30d ago
    const oldPrice = oldOffers.length ? (oldOffers.reduce((acc, o) => acc + o.price, 0) / oldOffers.length) : avg7d;
    const variation = ((avg7d - oldPrice) / oldPrice) * 100;

    return {
      currentMinPrice: currentMin,
      avgPrice7d: avg7d,
      variation30d: variation,
      liquidity: sorted.filter(o => o.date >= thirtyDaysAgo).length / 30,
      volatility: 0 // TODO: Implement std dev
    };
  }

  processDailyStats(offers: MarketOffer[]): DailyStats[] {
    const grouped = new Map<string, number[]>();

    offers.forEach(o => {
      const dateStr = o.date.toISOString().split('T')[0];
      if (!grouped.has(dateStr)) grouped.set(dateStr, []);
      grouped.get(dateStr)?.push(o.price);
    });

    const stats: DailyStats[] = [];
    grouped.forEach((prices, date) => {
      stats.push({
        date,
        minPrice: Math.min(...prices),
        avgPrice: prices.reduce((a, b) => a + b, 0) / prices.length,
        volume: prices.length
      });
    });

    return stats.sort((a, b) => a.date.localeCompare(b.date));
  }

  analyzeSellerFlow(offers: MarketOffer[]) {
    if (offers.length === 0) return { newSellers: [], exitedSellers: [] };

    // Group by date
    const byDate = new Map<string, Set<string>>();
    offers.forEach(o => {
      if (!o.seller) return;
      const d = o.date.toISOString().split('T')[0];
      if (!byDate.has(d)) byDate.set(d, new Set());
      byDate.get(d)?.add(o.seller);
    });

    const dates = Array.from(byDate.keys()).sort();
    if (dates.length < 2) return { newSellers: [], exitedSellers: [] };

    const today = dates[dates.length - 1];
    const yesterday = dates[dates.length - 2];

    const todaySellers = byDate.get(today)!;
    const yesterdaySellers = byDate.get(yesterday)!;

    const newSellers = Array.from(todaySellers).filter(s => !yesterdaySellers.has(s));
    const exitedSellers = Array.from(yesterdaySellers).filter(s => !todaySellers.has(s));

    return { newSellers, exitedSellers };
  }

  updateCharts() {
    const stats = this.dailyStats();
    if (!stats.length) return;

    // Destroy old charts
    if (this.priceChart) this.priceChart.destroy();
    if (this.volumeChart) this.volumeChart.destroy();

    // Price Chart
    const ctxPrice = document.getElementById('priceChart') as HTMLCanvasElement;
    this.priceChart = new Chart(ctxPrice, {
      type: 'line',
      data: {
        labels: stats.map(s => s.date),
        datasets: [
          {
            label: 'Preço Mínimo',
            data: stats.map(s => s.minPrice),
            borderColor: '#3b82f6',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            fill: true,
            tension: 0.4
          },
          {
            label: 'Preço Médio',
            data: stats.map(s => s.avgPrice),
            borderColor: '#94a3b8',
            borderDash: [5, 5],
            tension: 0.4,
            pointRadius: 0
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: 'top' } },
        scales: { y: { beginAtZero: false } }
      }
    });

    // Volume Chart
    const ctxVol = document.getElementById('volumeChart') as HTMLCanvasElement;
    this.volumeChart = new Chart(ctxVol, {
      type: 'bar',
      data: {
        labels: stats.map(s => s.date),
        datasets: [{
          label: 'Ofertas',
          data: stats.map(s => s.volume),
          backgroundColor: '#10b981',
          borderRadius: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } }
      }
    });
  }

  toggleDetails() {
    this.showDetails.update(v => !v);
  }

  handleImageError(event: any) {
    event.target.src = 'assets/placeholder-card.png';
  }

  getSellerNames(sellers: string[] | undefined) {
    if (!sellers) return '';
    return sellers.slice(0, 3).join(', ') + (sellers.length > 3 ? ` e mais ${sellers.length - 3}` : '');
  }
}
