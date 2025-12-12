import { Component, ChangeDetectionStrategy, signal, computed, effect, OnInit, ViewChild, ChangeDetectorRef } from '@angular/core';
import { PortfolioService } from './services/portfolio.service';
import { CommonModule, CurrencyPipe, DatePipe, DecimalPipe } from '@angular/common';
import { PortfolioChartComponent } from './components/portfolio-chart/portfolio-chart.component';
import { MarketAnalysisAdvancedComponent } from './components/market-analysis-advanced/market-analysis-advanced.component';
import { TransactionHistoryPageComponent } from './components/transaction-history-page/transaction-history-page.component';
import { LoginComponent } from './components/login/login.component';
import { FormsModule } from '@angular/forms';
import { SupabaseService } from './services/supabase.service';
import { User } from '@supabase/supabase-js';
import { AddPositionModalComponent } from './components/add-position-modal/add-position-modal.component';
import { supabase } from './supabaseClient';
import { PortfolioPerformanceComponent } from './components/portfolio-performance/portfolio-performance.component';
import { PortfolioConsolidatedComponent } from './components/portfolio-consolidated/portfolio-consolidated.component';
import { PsaTabComponent } from './components/psa-tab/psa-tab.component';
import { OpportunitiesTabComponent } from './components/opportunities-tab/opportunities-tab.component';
import { SalesFlowCardComponent } from './components/sales-flow-card/sales-flow-card.component';
import { SalesFlowData } from './models/sales-flow.model';

export interface PortfolioItem {
  id: number;
  name: string;
  code: string;
  condition: string;
  language: string;
  quantity: number;
  purchaseDate: string;
  purchasePrice: number;
  currentPrice: number;
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [CommonModule, FormsModule, PortfolioChartComponent, MarketAnalysisAdvancedComponent, TransactionHistoryPageComponent, LoginComponent, AddPositionModalComponent, PortfolioPerformanceComponent, PortfolioConsolidatedComponent, PsaTabComponent, OpportunitiesTabComponent, SalesFlowCardComponent, CurrencyPipe, DatePipe, DecimalPipe],
})
export class AppComponent implements OnInit {
  // --- Auth State ---
  user = signal<User | null>(null);
  loading = signal(true);

  // --- View State Signal ---
  activeView = signal<'portfolio' | 'marketAdvanced' | 'transactionsNew' | 'psa' | 'opportunities'>('portfolio');

  // --- Portfolio Table Visibility ---
  showTableView = signal(false);

  // --- State Signals ---
  portfolio = signal<PortfolioItem[]>([]);
  chartData = signal<{ date: string; value: number; }[]>([]);
  searchTerm = signal('');

  // --- Modal State (new approach) ---
  showModal = signal(false);

  // --- Card Detail Modal ---
  selectedCard = signal<PortfolioItem | null>(null);

  // --- Card Images Cache ---
  private cardImageCache = new Map<string, string>();
  private fetchingImages = new Set<string>();

  // --- Mock Sales Flow Data ---
  mockSalesData: SalesFlowData = {
    summary: {
      totalSales: 15,
      totalVolume: 2450.00,
      avgTicket: 163.33,
      activeSellers: 8,
      diffSalesPct: 25,      // +25%
      diffVolumePct: 18.5,   // +18.5%
      newSellers: 2,
      returningSellers: 1,
      lostSellers: 1
    },
    history: [
      { date: '2025-12-02', sales: 8 },
      { date: '2025-12-03', sales: 12 },
      { date: '2025-12-04', sales: 10 },
      { date: '2025-12-05', sales: 14 },
      { date: '2025-12-06', sales: 11 },
      { date: '2025-12-07', sales: 12 },
      { date: '2025-12-08', sales: 15 }
    ]
  };

  // --- Computed Signals for KPIs ---
  totalInvested = computed(() =>
    this.portfolio().reduce((acc, item) => acc + (item.purchasePrice * item.quantity), 0)
  );

  currentValue = computed(() =>
    this.portfolio().reduce((acc, item) => acc + (item.currentPrice * item.quantity), 0)
  );

  pnl = computed(() => this.currentValue() - this.totalInvested());

  averageRoi = computed(() => {
    const totalInvested = this.totalInvested();
    if (totalInvested === 0) return 0;
    return (this.pnl() / totalInvested);
  });

  filteredPortfolio = computed(() => {
    const term = this.searchTerm().toLowerCase();
    if (!term) {
      return this.portfolio();
    }
    return this.portfolio().filter(item =>
      item.name.toLowerCase().includes(term) ||
      item.code.toLowerCase().includes(term)
    );
  });

  // --- New Analytics Computed Signals ---
  roi = computed(() => {
    const invested = this.totalInvested();
    if (invested === 0) return 0;
    return (this.pnl() / invested) * 100;
  });

  totalGainLoss = computed(() => this.pnl());

  totalCards = computed(() =>
    this.portfolio().reduce((sum, item) => sum + item.quantity, 0)
  );

  topPerformer = computed(() => {
    const items = this.portfolio();
    if (items.length === 0) return { name: '', gain: 0 };

    const sorted = [...items]
      .map(item => ({
        name: item.name,
        gain: (item.currentPrice - item.purchasePrice) * item.quantity
      }))
      .sort((a, b) => b.gain - a.gain);

    return sorted[0] || { name: '', gain: 0 };
  });

  worstPerformer = computed(() => {
    const items = this.portfolio();
    if (items.length === 0) return { name: '', loss: 0 };

    const sorted = [...items]
      .map(item => ({
        name: item.name,
        loss: (item.currentPrice - item.purchasePrice) * item.quantity
      }))
      .sort((a, b) => a.loss - b.loss);

    return sorted[0] || { name: '', loss: 0 };
  });

  topConcentration = computed(() => {
    const items = this.portfolio();
    if (items.length === 0) return 0;

    const sorted = [...items]
      .map(item => ({
        value: item.currentPrice * item.quantity
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);

    const top5Value = sorted.reduce((sum, item) => sum + item.value, 0);
    const total = this.currentValue();

    return total > 0 ? Math.round((top5Value / total) * 100) : 0;
  });

  constructor(
    private supabaseService: SupabaseService,
    private cd: ChangeDetectorRef,
    private portfolioService: PortfolioService
  ) {
    effect(() => {
      if (this.user()) {
        this.updateChartData(this.currentValue());
      }
    });


  }

  async ngOnInit() {
    console.log('🚀 AppComponent initializing...');
    try {
      console.log('🔄 Checking Supabase session...');
      const session = await this.supabaseService.getSession();
      console.log('✅ Session result:', session);

      if (session) {
        console.log('👤 User found:', session.user.email);
        this.user.set(session.user);
        await this.loadPortfolio();
      } else {
        console.log('🤷 No session found. Should show login.');
      }
    } catch (err) {
      console.error('❌ Error in ngOnInit:', err);
    } finally {
      this.loading.set(false);
      console.log('🏁 Loading set to false. View should render.');
    }
  }

  async signOut() {
    await this.supabaseService.signOut();
    this.user.set(null);
  }

  async loadPortfolio() {
    try {
      const data = await this.supabaseService.getPortfolioCards();

      // Load conversion factors once
      const conversionFactors = await this.loadConversionFactors();

      const portfolioItems: PortfolioItem[] = await Promise.all(
        data.map(async (card: any) => {
          console.log(`📦 [Portfolio] Processando carta: ${card.carta} (ID: ${card.id})`);

          const currentPrice = await this.getCurrentPrice(
            card.carta,
            card.idioma || 'PT-BR',
            card.estado || 'NM',
            conversionFactors
          );

          return {
            id: card.id,
            name: card.carta,
            code: '(117/112)- MEG', // TODO: Fetch real code if available
            condition: card.estado || 'NM',
            language: card.idioma || 'PT-BR',
            quantity: card.qtd || 1,
            purchaseDate: card.data_compra,
            purchasePrice: parseFloat(card.preco_compra) || 0,
            currentPrice: currentPrice,
          };
        })
      );

      console.log('✅ [Portfolio] Itens carregados:', portfolioItems);
      this.portfolio.set(portfolioItems);

      // Log computed metrics for debugging
      setTimeout(() => {
        console.log('📊 [KPIs] Total Investido:', this.totalInvested());
        console.log('📊 [KPIs] Valor Atual:', this.currentValue());
        console.log('📊 [KPIs] P&L:', this.pnl());
        console.log('📊 [KPIs] Top Performer:', this.topPerformer());
      }, 100);

    } catch (error) {
      console.error('Error loading portfolio:', error);
    }
  }

  async loadConversionFactors() {
    console.log('📊 [P&L] Usando fatores de conversão hardcoded...');

    // Hardcoded factors as requested
    const idiomaMap = new Map([
      ['PT-BR', 1.0],
      ['EN', 0.85],
      ['JPN', 1.15],
      ['ES', 0.90],
      ['FR', 0.88],
      ['DE', 0.87],
      ['IT', 0.86]
    ]);

    const estadoMap = new Map([
      ['NM', 1.0],
      ['SP', 0.7],
      ['MP', 0.5],
      ['HP', 0.3],
      ['D', 0.1]
    ]);

    console.log('✅ [P&L] Fatores carregados (Hardcoded):', {
      idioma: Array.from(idiomaMap.entries()),
      estado: Array.from(estadoMap.entries())
    });

    return { idioma: idiomaMap, estado: estadoMap };
  }

  async getCurrentPrice(
    carta: string,
    targetIdioma: string,
    targetEstado: string,
    factors: { idioma: Map<string, number>, estado: Map<string, number> }
  ): Promise<number> {
    const cleanName = carta.trim();
    console.log(`💰 [P&L] Buscando preço para: "${cleanName}" (${targetIdioma}/${targetEstado})`);

    try {
      let priceData = null;

      // 1. Tentativa Exata
      let { data, error } = await supabase
        .from('myp_cards_meg')
        .select('preco_minimo_carta, idioma, estado, carta')
        .eq('carta', cleanName)
        .order('data_coleta', { ascending: false })
        .limit(1)
        .single();

      if (data) {
        console.log(`✅ [P&L] Match EXATO encontrado para "${cleanName}"`);
        priceData = data;
      } else {
        console.warn(`⚠️ [P&L] Match exato falhou para "${cleanName}". Tentando ILIKE...`);

        // 2. Tentativa Case Insensitive
        const { data: ilikeData } = await supabase
          .from('myp_cards_meg')
          .select('preco_minimo_carta, idioma, estado, carta')
          .ilike('carta', cleanName)
          .order('data_coleta', { ascending: false })
          .limit(1)
          .single();

        if (ilikeData) {
          console.log(`✅ [P&L] Match ILIKE encontrado: "${ilikeData.carta}"`);
          priceData = ilikeData;
        } else {
          console.warn(`⚠️ [P&L] Match ILIKE falhou. Tentando parcial...`);

          // 3. Tentativa Parcial (primeiros 15 chars)
          const partialName = cleanName.substring(0, 15) + '%';
          const { data: partialData } = await supabase
            .from('myp_cards_meg')
            .select('preco_minimo_carta, idioma, estado, carta')
            .ilike('carta', partialName)
            .order('data_coleta', { ascending: false })
            .limit(1)
            .single();

          if (partialData) {
            console.log(`✅ [P&L] Match PARCIAL encontrado: "${partialData.carta}" para busca "${partialName}"`);
            priceData = partialData;
          }
        }
      }

      if (!priceData) {
        console.error(`❌ [P&L] NENHUM preço encontrado para "${cleanName}" após todas as tentativas.`);
        return 0;
      }

      const basePrice = parseFloat(priceData.preco_minimo_carta);
      console.log(`💵 [P&L] Preço base: R$ ${basePrice} (${priceData.idioma}/${priceData.estado})`);

      // Check if exact match
      if (priceData.idioma === targetIdioma && priceData.estado === targetEstado) {
        console.log(`✅ [P&L] Match de variante exato! Preço: R$ ${basePrice}`);
        return basePrice;
      }

      // Apply conversion factors
      // Logic: Price = BasePrice * (TargetFactor / SourceFactor)
      // This generalizes the user's request: "preco_atual = preco_base * idioma_factor * estado_factor"
      // assuming the base price found is "Standard" (Factor 1.0).
      // If the found price is NOT standard (e.g. Damaged), we divide by its factor to normalize it first.

      let adjustedPrice = basePrice;

      const sourceIdiomaFactor = factors.idioma.get(priceData.idioma) || 1.0;
      const targetIdiomaFactor = factors.idioma.get(targetIdioma) || 1.0;
      const idiomaAdjustment = targetIdiomaFactor / sourceIdiomaFactor;
      adjustedPrice *= idiomaAdjustment;

      const sourceEstadoFactor = factors.estado.get(priceData.estado) || 1.0;
      const targetEstadoFactor = factors.estado.get(targetEstado) || 1.0;
      const estadoAdjustment = targetEstadoFactor / sourceEstadoFactor;
      adjustedPrice *= estadoAdjustment;

      console.log(`🔄 [P&L] Ajuste: Base R$${basePrice} (${priceData.idioma}/${priceData.estado}) -> Alvo (${targetIdioma}/${targetEstado})`);
      console.log(`   Idioma: ${sourceIdiomaFactor} -> ${targetIdiomaFactor} (x${idiomaAdjustment.toFixed(4)})`);
      console.log(`   Estado: ${sourceEstadoFactor} -> ${targetEstadoFactor} (x${estadoAdjustment.toFixed(4)})`);
      console.log(`✅ [P&L] Preço final ajustado: R$ ${adjustedPrice.toFixed(2)}`);

      return adjustedPrice;
    } catch (e) {
      console.error(`❌ [P&L] Erro crítico ao buscar preço para ${carta}:`, e);
      return 0;
    }
  }

  // --- Methods ---
  setView(view: 'portfolio' | 'marketAdvanced' | 'transactionsNew' | 'psa' | 'opportunities') {
    this.activeView.set(view);
  }

  openModal() {
    this.showModal.set(true);
  }

  closeModal() {
    this.showModal.set(false);
  }

  openCardDetail(card: PortfolioItem) {
    this.selectedCard.set(card);
  }

  closeCardDetail() {
    this.selectedCard.set(null);
  }

  openTopPerformer() {
    const top = this.topPerformer();
    if (!top.name) return;
    const card = this.portfolio().find(c => c.name === top.name);
    if (card) this.openCardDetail(card);
  }

  openWorstPerformer() {
    const worst = this.worstPerformer();
    if (!worst.name) return;
    const card = this.portfolio().find(c => c.name === worst.name);
    if (card) this.openCardDetail(card);
  }

  async onSaved() {
    await this.loadPortfolio();
    this.portfolioService.notifyUpdate();
    this.closeModal();
  }

  async removePosition(id: number) {
    if (!confirm('Are you sure you want to remove this card?')) return;

    try {
      await this.supabaseService.removePortfolioCard(id);
      await this.loadPortfolio();
      this.portfolioService.notifyUpdate();
    } catch (error) {
      console.error('Error removing position:', error);
      alert('Failed to remove position from database');
    }
  }

  updateChartData(currentValue: number) {
    const data = [];
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      const randomFactor = (i === 0) ? 1 : 1 - (Math.random() * 0.05);
      data.push({
        date: `${date.getDate()}/${date.getMonth() + 1}`,
        value: currentValue * randomFactor
      });
    }
    this.chartData.set(data);
  }

  onSearch(event: Event) {
    const target = event.target as HTMLInputElement;
    this.searchTerm.set(target.value);
  }

  getCardImageUrl(cardName: string): string {
    // 1. Check cache
    if (this.cardImageCache.has(cardName)) {
      return this.cardImageCache.get(cardName)!;
    }

    // 2. If already fetching, return placeholder
    if (this.fetchingImages.has(cardName)) {
      return 'https://via.placeholder.com/60x84?text=...';
    }

    // 3. Fetch image
    this.fetchingImages.add(cardName);
    this.fetchCardImage(cardName);

    return 'https://via.placeholder.com/60x84?text=...';
  }

  private async fetchCardImage(cardName: string) {
    try {
      const { data, error } = await supabase
        .from('card_images')
        .select('image_url')
        .eq('carta', cardName)
        .single();

      if (data && data.image_url) {
        this.cardImageCache.set(cardName, data.image_url);
      } else {
        this.cardImageCache.set(cardName, 'https://via.placeholder.com/60x84?text=?');
      }
    } catch (e) {
      console.error('Error fetching image for', cardName, e);
      this.cardImageCache.set(cardName, 'https://via.placeholder.com/60x84?text=?');
    } finally {
      this.fetchingImages.delete(cardName);
      this.cd.markForCheck();
    }
  }
}
