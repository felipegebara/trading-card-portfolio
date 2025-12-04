import { Component, ChangeDetectionStrategy, signal, computed, effect, OnInit, ViewChild, ChangeDetectorRef } from '@angular/core';
import { PortfolioService } from './services/portfolio.service';
import { CommonModule, CurrencyPipe, DatePipe, DecimalPipe } from '@angular/common';
import { PortfolioChartComponent } from './components/portfolio-chart/portfolio-chart.component';
import { MarketAnalysisAdvancedComponent } from './components/market-analysis-advanced/market-analysis-advanced.component';
import { TransactionHistoryComponent } from './components/transaction-history/transaction-history.component';
import { LoginComponent } from './components/login/login.component';
import { FormsModule } from '@angular/forms';
import { SupabaseService } from './services/supabase.service';
import { User } from '@supabase/supabase-js';
import { AddPositionModalComponent } from './components/add-position-modal/add-position-modal.component';
import { supabase } from './supabaseClient';
import { PortfolioPerformanceComponent } from './components/portfolio-performance/portfolio-performance.component';
import { PortfolioConsolidatedComponent } from './components/portfolio-consolidated/portfolio-consolidated.component';

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
  imports: [CommonModule, FormsModule, PortfolioChartComponent, MarketAnalysisAdvancedComponent, TransactionHistoryComponent, LoginComponent, AddPositionModalComponent, PortfolioPerformanceComponent, PortfolioConsolidatedComponent, CurrencyPipe, DatePipe, DecimalPipe],
})
export class AppComponent implements OnInit {
  // --- ViewChild para referenciar componentes ---
  @ViewChild(TransactionHistoryComponent) transactionHistory?: TransactionHistoryComponent;

  // --- Auth State ---
  user = signal<User | null>(null);
  loading = signal(true);

  // --- View State Signal ---
  activeView = signal<'portfolio' | 'marketAdvanced' | 'transactions'>('portfolio');

  // --- State Signals ---
  portfolio = signal<PortfolioItem[]>([]);
  chartData = signal<{ date: string; value: number; }[]>([]);
  searchTerm = signal('');

  // --- Modal State (new approach) ---
  showModal = signal(false);

  // --- Card Images Cache ---
  private cardImageCache = new Map<string, string>();
  private fetchingImages = new Set<string>();

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

  constructor(
    private supabaseService: SupabaseService,
    private cd: ChangeDetectorRef
  ) {
    effect(() => {
      if (this.user()) {
        this.updateChartData(this.currentValue());
      }
    });

    // Refresh transaction history when switching to it
    effect(() => {
      const view = this.activeView();
      if (view === 'transactions') {
        // Use setTimeout to ensure ViewChild is initialized
        setTimeout(() => {
          console.log('🔄 [AppComponent] Trocou para aba de transações, refresh automático');
          this.transactionHistory?.refresh();
        }, 0);
      }
    });
  }

  async ngOnInit() {
    // Load metadata immediately (languages/conditions are now static, but we keep this for other potential needs or remove if strictly not needed. 
    // User requested static lists, so I will remove dynamic loading for lang/cond to avoid overwriting).
    // this.loadMetadata(); 

    const session = await this.supabaseService.getSession();
    if (session) {
      this.user.set(session.user);
      await this.loadPortfolio();
    }
    this.loading.set(false);
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

      // Process each card and fetch its current price
      const portfolioItems: PortfolioItem[] = await Promise.all(
        data.map(async (card: any) => {
          const currentPrice = await this.getCurrentPrice(
            card.carta,
            card.idioma || 'PT-BR',
            card.estado || 'NM',
            conversionFactors
          );

          return {
            id: card.id,
            name: card.carta,
            code: '(117/112)- MEG',
            condition: card.estado || 'NM',
            language: card.idioma || 'PT-BR',
            quantity: card.qtd || 1,
            purchaseDate: card.data_compra,
            purchasePrice: parseFloat(card.preco_compra) || 0,
            currentPrice: currentPrice,
          };
        })
      );

      this.portfolio.set(portfolioItems);
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
  setView(view: 'portfolio' | 'marketAdvanced' | 'transactions') {
    this.activeView.set(view);
  }

  openModal() {
    this.showModal.set(true);
  }

  closeModal() {
    this.showModal.set(false);
  }

  async onSaved() {
    await this.loadPortfolio();
    this.closeModal();
  }

  async removePosition(id: number) {
    if (!confirm('Are you sure you want to remove this card?')) return;

    try {
      await this.supabaseService.removePortfolioCard(id);
      await this.loadPortfolio();
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
