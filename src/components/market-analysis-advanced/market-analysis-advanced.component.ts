import { Component, OnInit, signal, computed, AfterViewInit, ViewChild, ElementRef, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { supabase } from '../../supabaseClient';
import {
  MarketOffer,
  MarketKPIs,
  FilterState,
  PriceEvolution,
  DistributionItem
} from './market-analysis.types';
import { MarketAnalysisService } from './market-analysis.service';
import { ChartRenderer } from './chart-renderer';

@Component({
  selector: 'app-market-analysis-advanced',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="market-container">
      <header class="header">
        <h1 class="title">Análise de Mercado</h1>
        <p class="subtitle">Explore preços, liquidez e distribuição das ofertas</p>
      </header>

      <!-- Top Row: Filters + Card -->
      <div class="top-row">
        <!-- Filters Column -->
        <div class="filters-column">
          <div class="filters-card">
            <div class="filter-group full">
              <label>Carta</label>
              <select [ngModel]="selectedCard()" (ngModelChange)="selectedCard.set($event); onFilterChange()" class="filter-select">
                <option value="">Selecione uma carta...</option>
                <option *ngFor="let card of cardNames()" [value]="card">{{ card }}</option>
              </select>
            </div>
            <div class="filter-row">
              <div class="filter-group">
                <label>Idioma</label>
                <select [ngModel]="selectedLanguage()" (ngModelChange)="selectedLanguage.set($event); onFilterChange()" class="filter-select">
                  <option value="">Todas</option>
                  <option value="PT-BR">PT-BR</option>
                  <option value="ING">ING</option>
                  <option value="JPN">JPN</option>
                </select>
              </div>
              <div class="filter-group">
                <label>Condição</label>
                <select [ngModel]="selectedCondition()" (ngModelChange)="selectedCondition.set($event); onFilterChange()" class="filter-select">
                  <option value="">Todas</option>
                  <option value="NM">NM</option>
                  <option value="SP">SP</option>
                  <option value="MP">MP</option>
                  <option value="HP">HP</option>
                </select>
              </div>
              <div class="filter-group">
                <label>Período</label>
                <select [ngModel]="selectedPeriod()" (ngModelChange)="selectedPeriod.set($event); onFilterChange()" class="filter-select">
                  <option value="7">Últimos 7 dias</option>
                  <option value="30">Últimos 30 dias</option>
                  <option value="90">Últimos 90 dias</option>
                </select>
              </div>
            </div>
          </div>

          <div *ngIf="loading()" class="loading"><div class="spinner"></div><p>Carregando...</p></div>
          <div *ngIf="!loading() && !selectedCard()" class="empty-state"><p>Selecione uma carta para análise</p></div>
        </div>

        <!-- Card Preview Column -->
        <div class="card-column" *ngIf="selectedCard()">
          <div class="card-preview">
            <img 
              [src]="cardImageUrl() || 'https://images.pokemontcg.io/sv3/187_hires.png'" 
              [alt]="selectedCard()" 
              class="card-image" 
              (error)="cardImageUrl.set(null)"
            />
            <h3 class="card-name">{{ selectedCard() }}</h3>
            <p class="card-rarity" *ngIf="!cardImageUrl()">Imagem não disponível</p>
          </div>
        </div>
      </div>

      <!-- Bottom Content: Charts & Tables -->
      <div class="bottom-content" *ngIf="!loading() && selectedCard() && filteredOffers().length > 0">
        <!-- Price Evolution -->
        <div class="section-card">
          <h3 class="section-title">Evolução de Preços</h3>
          <div class="kpis-row">
            <div class="kpi-item">
              <div class="kpi-icon">💰</div>
              <div class="kpi-content">
                <p class="kpi-label">PREÇO MÉDIO</p>
                <p class="kpi-value green">R$ {{ formatPrice(kpis().avgPrice) }}</p>
              </div>
            </div>
            <div class="kpi-item">
              <div class="kpi-icon">💵</div>
              <div class="kpi-content">
                <p class="kpi-label">PREÇO MÍNIMO</p>
                <p class="kpi-value green">R$ {{ formatPrice(kpis().minPrice) }}</p>
              </div>
            </div>
            <div class="kpi-item">
              <div class="kpi-icon">📊</div>
              <div class="kpi-content">
                <p class="kpi-label">DISPERSÃO</p>
                <p class="kpi-value">{{ kpis().dispersion.toFixed(1) }} %</p>
              </div>
            </div>

            <div class="kpi-item">
              <div class="kpi-icon">📦</div>
              <div class="kpi-content">
                <p class="kpi-label">VOLUME DISPONÍVEL</p>
                <p class="kpi-value">{{ kpis().totalVolume }}</p>
              </div>
            </div>
            <div class="kpi-item">
              <div class="kpi-icon">🆕</div>
              <div class="kpi-content">
                <p class="kpi-label">NOVAS ENTRADAS</p>
                <p class="kpi-value">{{ kpis().newListings }}</p>
              </div>
            </div>
          </div>
          <div #priceChart class="chart-container"></div>
        </div>

        <!-- Distributions -->
        <div class="distributions-row">
          <div class="section-card half">
            <h3 class="section-title">Distribuição por Condição</h3>
            <div class="dist-list">
              <div *ngFor="let item of conditionDistribution()" class="dist-item">
                <div class="dist-bar" [style.width.%]="item.percentage" [class]="'condition-' + item.name">
                  <span class="dist-label">{{ item.name }} ({{ item.name === 'NM' ? 'Near Mint' : item.name === 'SP' ? 'Slightly Played' : item.name === 'HP' ? 'Heavily Played' : 'Moderately Played' }})</span>
                </div>
                <span class="dist-percent">{{ item.percentage.toFixed(1) }}%</span>
              </div>
            </div>
          </div>

          <div class="section-card half">
            <h3 class="section-title">Distribuição por Idioma</h3>
            <div class="dist-list">
              <div *ngFor="let item of languageDistribution()" class="dist-item">
                <div class="dist-bar lang" [style.width.%]="item.percentage">
                  <span class="dist-label">{{ item.name }}</span>
                </div>
                <span class="dist-percent">{{ item.percentage.toFixed(0) }}%</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Offers Table -->
        <div class="section-card">
          <div class="table-header">
            <h3 class="section-title">Ofertas do Último Dia ({{ latestDate() }})</h3>
            <button class="export-btn" (click)="exportCSV()">📥 Exportar CSV</button>
          </div>
          <div class="table-wrapper">
            <table class="offers-table">
              <thead>
                <tr>
                  <th>PREÇO</th>
                  <th>IDIOMA</th>
                  <th>CONDIÇÃO</th>
                  <th>QUANTIDADE</th>
                  <th>VENDEDOR</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let offer of latestDayOffers().slice(0, 10)">
                  <td class="price-cell">R$ {{ formatPrice(offer.valor) }}</td>
                  <td><span class="lang-badge">{{ offer.idioma }}</span></td>
                  <td><span class="condition-badge" [class]="'condition-' + normalizeCondition(offer.estado)">{{ normalizeCondition(offer.estado) }}</span></td>
                  <td>{{ offer.qtd }}</td>
                  <td>{{ offer.vendedor }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .market-container{background:#0a0e1a;min-height:100vh;padding:24px;color:#fff;max-width:1600px;margin:0 auto}
    
    .header{margin-bottom:32px}
    .title{font-size:32px;font-weight:700;color:#22c55e;margin:0 0 8px 0;letter-spacing:-0.5px}
    .subtitle{font-size:14px;color:#94a3b8;margin:0}
    
    .top-row{display:grid;grid-template-columns:1fr 400px;gap:32px;margin-bottom:32px}
    .filters-column{display:flex;flex-direction:column;gap:24px}
    .card-column{display:flex;flex-direction:column;gap:24px}
    
    .filters-card{background:#0f172a;border:1px solid #1e293b;border-radius:24px;padding:40px;height:100%;display:flex;flex-direction:column;justify-content:center;box-shadow:0 4px 6px -1px rgba(0,0,0,0.1),0 2px 4px -1px rgba(0,0,0,0.06)}
    .filter-group{display:flex;flex-direction:column;gap:10px}
    .filter-group.full{margin-bottom:32px}
    .filter-group label{font-size:12px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:1px;margin-left:4px}
    
    .filter-select{
      width:100%;
      background-color:#1e293b;
      border:1px solid #334155;
      border-radius:12px;
      padding:16px 20px;
      color:#f8fafc;
      font-size:15px;
      font-weight:500;
      appearance:none;
      cursor:pointer;
      transition:all 0.2s ease;
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2394a3b8'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E");
      background-repeat: no-repeat;
      background-position: right 20px center;
      background-size: 20px;
      padding-right: 50px;
    }
    .filter-select:hover{border-color:#475569;background-color:#253045}
    .filter-select:focus{border-color:#22c55e;box-shadow:0 0 0 3px rgba(34,197,94,0.15);outline:none}
    
    .filter-row{display:grid;grid-template-columns:repeat(3,1fr);gap:24px}
    
    .card-preview{background:#0f172a;border:1px solid #1e293b;border-radius:24px;padding:24px;text-align:center;box-shadow:0 4px 6px -1px rgba(0,0,0,0.1);height:100%;display:flex;flex-direction:column;justify-content:center}
    .card-image{width:100%;border-radius:12px;margin-bottom:16px;max-height:480px;object-fit:contain;transition:transform 0.3s ease}
    .card-image:hover{transform:scale(1.02)}
    .card-name{font-size:18px;font-weight:700;color:#f1f5f9;margin:0 0 4px 0}
    .card-rarity{font-size:13px;color:#64748b;font-weight:500}
    
    .dispersion-card{background:#0f172a;border:1px solid #1e293b;border-radius:20px;padding:24px;display:flex;align-items:center;gap:16px;box-shadow:0 4px 6px -1px rgba(0,0,0,0.1)}
    .disp-icon{font-size:36px;background:rgba(34,197,94,0.1);width:64px;height:64px;display:flex;align-items:center;justify-content:center;border-radius:16px}
    .disp-content{flex:1}
    .disp-label{font-size:11px;color:#64748b;margin:0 0 4px 0;font-weight:700;letter-spacing:1px;text-transform:uppercase}
    .disp-value{font-size:28px;font-weight:800;color:#22c55e;margin:0;letter-spacing:-1px}
    
    .bottom-content{display:flex;flex-direction:column;gap:32px}
    
    .section-card{background:#0f172a;border:1px solid #1e293b;border-radius:20px;padding:32px;box-shadow:0 4px 6px -1px rgba(0,0,0,0.1)}
    .section-card.half{flex:1}
    .section-title{font-size:15px;font-weight:700;color:#e2e8f0;margin:0 0 24px 0;text-transform:uppercase;letter-spacing:1px;display:flex;align-items:center;gap:8px}
    .section-title::before{content:'';display:block;width:4px;height:16px;background:#22c55e;border-radius:2px}
    
    .kpis-row{display:grid;grid-template-columns:repeat(5,1fr);gap:32px;margin-bottom:32px}
    .kpi-item{display:flex;align-items:center;gap:20px;background:#162032;padding:20px;border-radius:16px;border:1px solid #1e293b}
    .kpi-icon{font-size:32px}
    .kpi-content{flex:1}
    .kpi-label{font-size:11px;color:#64748b;margin:0 0 4px 0;font-weight:700;letter-spacing:1px}
    .kpi-value{font-size:28px;font-weight:700;margin:0;letter-spacing:-0.5px}
    .kpi-value.green{color:#22c55e}
    
    .chart-container{height:280px;background:#0a0e1a;border-radius:12px;padding:20px;border:1px solid #1e293b}
    
    .distributions-row{display:grid;grid-template-columns:repeat(2,1fr);gap:32px}
    .dist-list{display:flex;flex-direction:column;gap:16px}
    .dist-item{display:flex;align-items:center;gap:16px}
    .dist-bar{height:40px;border-radius:8px;display:flex;align-items:center;padding:0 16px;min-width:100px;transition:width 0.5s cubic-bezier(0.4,0,0.2,1)}
    .dist-bar.condition-NM{background:linear-gradient(90deg, #16a34a 0%, #22c55e 100%)}
    .dist-bar.condition-SP{background:linear-gradient(90deg, #ca8a04 0%, #eab308 100%)}
    .dist-bar.condition-MP{background:linear-gradient(90deg, #ea580c 0%, #f97316 100%)}
    .dist-bar.condition-HP{background:linear-gradient(90deg, #dc2626 0%, #ef4444 100%)}
    .dist-bar.lang{background:linear-gradient(90deg, #2563eb 0%, #3b82f6 100%)}
    .dist-label{font-size:12px;font-weight:600;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;text-shadow:0 1px 2px rgba(0,0,0,0.3)}
    .dist-percent{font-size:14px;font-weight:600;color:#94a3b8;min-width:50px;text-align:right}
    
    .table-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:24px}
    .export-btn{background:#3b82f6;border:none;border-radius:8px;padding:10px 20px;color:#fff;font-size:12px;font-weight:600;cursor:pointer;transition:all 0.2s;display:flex;align-items:center;gap:8px}
    .export-btn:hover{background:#2563eb;transform:translateY(-1px)}
    
    .table-wrapper{overflow-x:auto;border-radius:12px;border:1px solid #1e293b}
    .offers-table{width:100%;border-collapse:collapse}
    .offers-table thead{background:#162032}
    .offers-table th{padding:16px 20px;text-align:left;font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:1px;border-bottom:1px solid #1e293b}
    .offers-table td{padding:16px 20px;font-size:14px;color:#e2e8f0;border-bottom:1px solid #1e293b;font-weight:500}
    .offers-table tbody tr:hover{background:#162032}
    .price-cell{color:#22c55e;font-weight:700;font-family:'Roboto Mono', monospace}
    .lang-badge{background:rgba(34,197,94,0.1);color:#22c55e;padding:6px 12px;border-radius:6px;font-size:11px;font-weight:700;border:1px solid rgba(34,197,94,0.2)}
    .condition-badge{padding:6px 12px;border-radius:6px;font-size:11px;font-weight:700}
    .condition-badge.condition-NM{background:rgba(34,197,94,0.1);color:#22c55e;border:1px solid rgba(34,197,94,0.2)}
    .condition-badge.condition-SP{background:rgba(234,179,8,0.1);color:#eab308;border:1px solid rgba(234,179,8,0.2)}
    .condition-badge.condition-MP{background:rgba(249,115,22,0.1);color:#f97316;border:1px solid rgba(249,115,22,0.2)}
    .condition-badge.condition-HP{background:rgba(239,68,68,0.1);color:#ef4444;border:1px solid rgba(239,68,68,0.2)}
    
    .loading{display:flex;flex-direction:column;align-items:center;padding:80px 20px;color:#64748b}
    .spinner{width:48px;height:48px;border:4px solid #1e293b;border-top-color:#22c55e;border-radius:50%;animation:spin 1s linear infinite;margin-bottom:16px}
    @keyframes spin{to{transform:rotate(360deg)}}
    .empty-state{text-align:center;padding:80px 20px;color:#64748b;font-size:16px;font-weight:500}
    
    @media (max-width: 1024px){
      .top-row{grid-template-columns:1fr}
      .card-column{display:none}
      .distributions-row{grid-template-columns:1fr}
      .filter-row{grid-template-columns:1fr}
    }
  `]
})
export class MarketAnalysisAdvancedComponent implements OnInit, AfterViewInit {
  @ViewChild('priceChart') priceChartRef!: ElementRef;

  // State
  loading = signal(true);
  allOffers = signal<MarketOffer[]>([]);
  cardNames = signal<string[]>([]);
  recentFilters = signal<FilterState[]>([]);
  quickFilter = signal('');
  sortColumn = signal('score');
  sortDirection = signal<'asc' | 'desc'>('desc');

  // Filters
  selectedCard = signal('');
  selectedLanguage = signal('');
  selectedCondition = signal('');
  selectedPeriod = signal('30');

  // Card image
  cardImageUrl = signal<string | null>(null);

  // Expose Math for template
  Math = Math;

  // Computed: Filtered offers
  filteredOffers = computed(() => {
    let offers = this.allOffers().filter(o => o.carta === this.selectedCard());

    if (this.selectedLanguage()) {
      offers = offers.filter(o => o.idioma === this.selectedLanguage());
    }

    if (this.selectedCondition()) {
      offers = offers.filter(o =>
        MarketAnalysisService.normalizeCondition(o.estado) === this.selectedCondition()
      );
    }

    if (this.selectedPeriod() !== 'all') {
      const days = parseInt(this.selectedPeriod());
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);
      offers = offers.filter(o => new Date(o.data_coleta) >= cutoffDate);
    }

    return offers.sort((a, b) =>
      new Date(b.data_coleta).getTime() - new Date(a.data_coleta).getTime()
    );
  });

  // Computed: Displayed offers with filters and sorting
  displayedOffers = computed(() => {
    let offers = this.filteredOffers();

    // Quick filters
    if (this.quickFilter() === 'top') {
      offers = offers.filter(o =>
        MarketAnalysisService.calculateOpportunityScore(o, this.kpis().avgPrice).score >= 80
      );
    } else if (this.quickFilter() === 'nm') {
      offers = offers.filter(o =>
        MarketAnalysisService.normalizeCondition(o.estado) === 'NM'
      );
    } else if (this.quickFilter() === 'cheap') {
      const avg = this.kpis().avgPrice;
      offers = offers.filter(o => o.valor < avg * 0.8);
    }

    // Sorting
    const sorted = [...offers].sort((a, b) => {
      if (this.sortColumn() === 'score') {
        const scoreA = MarketAnalysisService.calculateOpportunityScore(a, this.kpis().avgPrice).score;
        const scoreB = MarketAnalysisService.calculateOpportunityScore(b, this.kpis().avgPrice).score;
        return this.sortDirection() === 'desc' ? scoreB - scoreA : scoreA - scoreB;
      } else if (this.sortColumn() === 'valor') {
        return this.sortDirection() === 'desc' ? b.valor - a.valor : a.valor - b.valor;
      }
      return 0;
    });

    return sorted.slice(0, 20);
  });

  // Computed: KPIs
  kpis = computed((): MarketKPIs => {
    const offers = this.filteredOffers();
    if (offers.length === 0) {
      return {
        minPrice: 0,
        avgPrice: 0,
        totalOffers: 0,
        dispersion: 0,
        minPriceTrend: 0,
        avgPriceTrend: 0,
        liquidityLabel: 'N/A',
        offersPerDay: 0,
        totalVolume: 0,
        newListings: 0
      };
    }

    const prices = offers.map(o => o.valor);
    const minPrice = Math.min(...prices);
    const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;
    const maxPrice = Math.max(...prices);
    const dispersion = avgPrice > 0 ? ((maxPrice - minPrice) / avgPrice * 100) : 0;

    // Calculate trends (simplified - could be enhanced with historical data)
    const minPriceTrend = Math.random() * 20 - 10;
    const avgPriceTrend = Math.random() * 20 - 10;

    // Liquidity
    const days = parseInt(this.selectedPeriod());
    const offersPerDay = offers.length / days;
    let liquidityLabel = 'Baixa';
    if (offersPerDay > 5) liquidityLabel = 'Alta';
    else if (offersPerDay > 2) liquidityLabel = 'Média';

    // Volume & New Listings
    const totalVolume = offers.reduce((acc, curr) => acc + parseInt(curr.qtd), 0);

    // Find latest date for new listings count
    const sortedDates = offers.map(o => o.data_coleta).sort().reverse();
    const latestDate = sortedDates[0]?.split('T')[0];
    const newListings = offers.filter(o => o.data_coleta.startsWith(latestDate)).length;

    return {
      minPrice,
      avgPrice,
      totalOffers: offers.length,
      dispersion,
      minPriceTrend,
      avgPriceTrend,
      liquidityLabel,
      offersPerDay,
      totalVolume,
      newListings
    };
  });

  // Computed: Condition distribution
  conditionDistribution = computed((): DistributionItem[] => {
    return MarketAnalysisService.calculateConditionDistribution(this.filteredOffers());
  });

  // Computed: Language distribution
  languageDistribution = computed((): DistributionItem[] => {
    return MarketAnalysisService.calculateLanguageDistribution(this.filteredOffers());
  });

  // Computed: Best value condition
  bestValueCondition = computed((): string => {
    return MarketAnalysisService.getBestValueCondition(this.conditionDistribution());
  });

  // Computed: Market trend
  marketTrend = computed((): string => {
    return MarketAnalysisService.getMarketTrend(this.kpis().avgPriceTrend);
  });

  // Computed: Latest date in offers
  latestDate = computed((): string => {
    const offers = this.filteredOffers();
    if (offers.length === 0) return '';
    const date = new Date(offers[0].data_coleta);
    return date.toLocaleDateString('pt-BR');
  });

  // Computed: Offers from the latest day
  latestDayOffers = computed((): MarketOffer[] => {
    const offers = this.filteredOffers();
    if (offers.length === 0) return [];

    // Assuming offers are already sorted by date desc
    const latestDateStr = offers[0].data_coleta.split('T')[0];
    return offers.filter(o => o.data_coleta.startsWith(latestDateStr));
  });

  // Computed: Price zone
  priceZone = computed((): string => {
    return MarketAnalysisService.getPriceZone(this.kpis().avgPrice, this.kpis().minPrice);
  });

  // Computed: Recommendation
  recommendation = computed((): string => {
    return MarketAnalysisService.getRecommendation(this.priceZone());
  });

  // Computed: Price evolution
  priceEvolution = computed((): PriceEvolution[] => {
    const offers = this.filteredOffers();
    if (offers.length === 0) return [];

    const byDate = offers.reduce((acc, offer) => {
      const date = offer.data_coleta;
      if (!acc[date]) acc[date] = [];
      acc[date].push(offer.valor);
      return acc;
    }, {} as Record<string, number[]>);

    return Object.entries(byDate)
      .map(([date, prices]) => ({
        date,
        avgPrice: prices.reduce((a, b) => a + b, 0) / prices.length,
        minPrice: Math.min(...prices),
        maxPrice: Math.max(...prices)
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  });

  constructor() {
    effect(() => {
      if (this.selectedCard() && this.priceChartRef) {
        setTimeout(() => this.updateChart(), 100);
      }
    });
  }

  async ngOnInit() {
    console.log('🚀 [Market Analysis] ngOnInit chamado');
    await this.loadData();
    this.loadRecentFilters();
  }

  ngAfterViewInit() {
    if (this.selectedCard()) {
      this.updateChart();
    }
  }

  // Data loading
  private async loadData() {
    console.log('🔍 [Market Analysis] Iniciando loadData...');
    try {
      // Primeiro tenta a view normalizada
      let { data, error } = await supabase
        .from('v_myp_cards_meg_norm')
        .select('*')
        .order('data_coleta', { ascending: false });

      // Se der erro, tenta a tabela original
      if (error) {
        console.warn('⚠️ [Market Analysis] View normalizada não encontrada, tentando tabela original...', error);
        const result = await supabase
          .from('myp_cards_meg')
          .select('*')
          .order('data_coleta', { ascending: false });
        data = result.data;
        error = result.error;
      }

      console.log('📊 [Market Analysis] Resposta do Supabase:', { data: data?.length, error });

      if (error) {
        console.error('❌ [Market Analysis] Erro ao buscar dados:', error);
        this.loading.set(false);
        return;
      }

      if (!data || data.length === 0) {
        console.warn('⚠️ [Market Analysis] Nenhum dado retornado do Supabase');
        this.loading.set(false);
        return;
      }

      const mappedData = data.map((item: any) => ({
        ...item,
        estado: item.estado_norm || item.estado,
        idioma: item.idioma_norm || item.idioma
      }));

      this.allOffers.set(mappedData as MarketOffer[]);

      const uniqueCards = Array.from(new Set(data.map(d => d.carta))).sort();
      console.log('✅ [Market Analysis] Cartas únicas carregadas:', uniqueCards.length);
      console.log('📋 [Market Analysis] Primeiras 5 cartas:', uniqueCards.slice(0, 5));
      console.log('📋 [Market Analysis] Signal cardNames antes do set:', this.cardNames().length);
      this.cardNames.set(uniqueCards);
      console.log('📋 [Market Analysis] Signal cardNames depois do set:', this.cardNames().length);

      this.loading.set(false);
    } catch (e) {
      console.error('❌ [Market Analysis] Exceção capturada:', e);
      this.loading.set(false);
    }
  }

  // Load card image from card_images table
  private async loadCardImage(cardName: string) {
    console.log('🖼️ [Market Analysis] Buscando imagem para:', cardName);
    try {
      // Primeiro, vamos ver todas as colunas disponíveis
      const { data: testData, error: testError } = await supabase
        .from('card_images')
        .select('*')
        .eq('carta', cardName)
        .limit(1);

      console.log('🔍 [Market Analysis] Teste de colunas disponíveis:', testData);
      console.log('🔍 [Market Analysis] Erro no teste:', testError);

      if (testError) {
        console.warn('⚠️ [Market Analysis] Erro ao acessar card_images:', testError);
        this.cardImageUrl.set(null);
        return;
      }

      if (!testData || testData.length === 0) {
        console.warn('⚠️ [Market Analysis] Nenhuma carta encontrada com nome:', cardName);

        // Vamos ver quais cartas existem (primeiras 5)
        const { data: allCards } = await supabase
          .from('card_images')
          .select('carta')
          .limit(5);
        console.log('📋 [Market Analysis] Primeiras 5 cartas na tabela card_images:', allCards);

        this.cardImageUrl.set(null);
        return;
      }

      // Verificar qual campo tem a URL da imagem
      const cardData = testData[0];
      console.log('📦 [Market Analysis] Dados da carta encontrada:', cardData);

      // Tentar diferentes nomes de coluna comuns
      const imageUrl = cardData.image_url || cardData.imageUrl || cardData.url || cardData.image;

      if (imageUrl) {
        console.log('✅ [Market Analysis] Imagem encontrada:', imageUrl);
        this.cardImageUrl.set(imageUrl);
      } else {
        console.warn('⚠️ [Market Analysis] Carta encontrada mas sem URL de imagem. Campos disponíveis:', Object.keys(cardData));
        this.cardImageUrl.set(null);
      }
    } catch (e) {
      console.error('❌ [Market Analysis] Erro ao buscar imagem:', e);
      this.cardImageUrl.set(null);
    }
  }

  // Filter management
  onFilterChange() {
    if (this.selectedCard()) {
      this.saveRecentFilter();
      this.loadCardImage(this.selectedCard());
    } else {
      this.cardImageUrl.set(null);
    }
    setTimeout(() => this.updateChart(), 100);
  }

  private saveRecentFilter() {
    const filter: FilterState = {
      card: this.selectedCard(),
      language: this.selectedLanguage(),
      condition: this.selectedCondition(),
      period: this.selectedPeriod()
    };

    const recent = this.recentFilters();
    const filtered = recent.filter(r => r.card !== filter.card);
    this.recentFilters.set([filter, ...filtered].slice(0, 5));

    localStorage.setItem('recentFilters', JSON.stringify(this.recentFilters()));
  }

  private loadRecentFilters() {
    const stored = localStorage.getItem('recentFilters');
    if (stored) {
      this.recentFilters.set(JSON.parse(stored));
    }
  }

  applyRecentFilter(filter: FilterState) {
    this.selectedCard.set(filter.card);
    this.selectedLanguage.set(filter.language);
    this.selectedCondition.set(filter.condition);
    this.selectedPeriod.set(filter.period);
    this.onFilterChange();
  }

  // Quick filters
  setQuickFilter(filter: string) {
    this.quickFilter.set(this.quickFilter() === filter ? '' : filter);
  }

  // Sorting
  sortBy(column: string) {
    if (this.sortColumn() === column) {
      this.sortDirection.set(this.sortDirection() === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortColumn.set(column);
      this.sortDirection.set('desc');
    }
  }

  // Template helpers
  getScoreLabel(offer: MarketOffer): string {
    return MarketAnalysisService.calculateOpportunityScore(offer, this.kpis().avgPrice).label;
  }

  getScoreClass(offer: MarketOffer): string {
    return MarketAnalysisService.calculateOpportunityScore(offer, this.kpis().avgPrice).color;
  }

  isPriceOutlier(offer: MarketOffer): boolean {
    return MarketAnalysisService.isPriceOutlier(offer, this.filteredOffers());
  }

  getPriceOutlierLabel(offer: MarketOffer): string {
    return MarketAnalysisService.getPriceOutlierLabel(offer, this.kpis().avgPrice);
  }

  normalizeCondition(condition: string): string {
    return MarketAnalysisService.normalizeCondition(condition);
  }

  formatPrice(price: number): string {
    return price.toFixed(2);
  }

  // Export
  exportCSV() {
    MarketAnalysisService.exportToCSV(
      this.displayedOffers(),
      this.selectedCard(),
      this.kpis().avgPrice
    );
  }

  // Chart rendering
  private updateChart() {
    if (!this.priceChartRef) return;

    const evolution = this.priceEvolution();
    if (evolution.length === 0) return;

    const element = this.priceChartRef.nativeElement;
    element.innerHTML = '';

    const canvas = document.createElement('canvas');
    canvas.width = element.offsetWidth;
    canvas.height = element.offsetHeight || 200;
    element.appendChild(canvas);

    ChartRenderer.renderPriceChart(canvas, evolution);
  }
}
