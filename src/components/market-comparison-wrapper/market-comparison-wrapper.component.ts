import { Component, OnInit, signal, computed, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MarketComparisonCardComponent } from '../market-comparison-card/market-comparison-card.component';
import { MarketComparisonData } from '../../models/market-comparison.model';
import { SalesFlowData } from '../../models/sales-flow.model';
import { detectRealSales } from '../../utils/sales-detection';
import { supabase } from '../../supabaseClient';

interface MarketOffer {
  date: Date;
  price: number;
  source: 'liga' | 'myp';
  condition?: string;
  seller?: string;
}

/**
 * Wrapper component that combines MYP sales data with PriceCharting data
 * and displays a market comparison view
 */
@Component({
  selector: 'app-market-comparison-wrapper',
  standalone: true,
  imports: [CommonModule, MarketComparisonCardComponent],
  template: `
    <div class="market-comparison-wrapper">
      @if (loading()) {
        <div class="loading-state">
          <div class="spinner"></div>
          <p>Carregando comparação de mercados...</p>
        </div>
      }

      @if (!loading() && marketComparisonData()) {
        <app-market-comparison-card [data]="marketComparisonData()"></app-market-comparison-card>
      }

      @if (!loading() && error()) {
        <div class="error-state">
          <p>❌ {{ error() }}</p>
        </div>
      }
    </div>
  `,
  styles: [`
    .market-comparison-wrapper {
      width: 100%;
    }

    .loading-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 40px;
      background: white;
      border-radius: 16px;
      border: 1px solid #e2e8f0;
    }

    .spinner {
      width: 40px;
      height: 40px;
      border: 4px solid #f3f4f6;
      border-top-color: #3b82f6;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin-bottom: 16px;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .loading-state p {
      color: #64748b;
      font-size: 14px;
      margin: 0;
    }

    .error-state {
      padding: 24px;
      background: #fef2f2;
      border: 1px solid #fecaca;
      border-radius: 12px;
      color: #991b1b;
      text-align: center;
    }

    .error-state p {
      margin: 0;
      font-size: 14px;
    }
  `]
})
export class MarketComparisonWrapperComponent implements OnInit {
  @Input() cardName!: string;
  @Input() offers: MarketOffer[] = [];

  loading = signal(false);
  error = signal<string | null>(null);
  priceChartingData = signal<any>(null);

  // Compute MYP sales data from offers
  mypSalesData = computed((): SalesFlowData | null => {
    if (this.offers.length === 0) return null;
    return detectRealSales(this.offers);
  });

  // Compute the full market comparison
  marketComparisonData = computed((): MarketComparisonData | null => {
    const salesFlow = this.mypSalesData();
    const pcData = this.priceChartingData();

    if (!salesFlow || !pcData) return null;

    const EXCHANGE_RATE = 5.3;
    const pcPriceBRL = pcData.ungraded_price * EXCHANGE_RATE;
    const mypAvgPrice = salesFlow.summary.avgTicket;

    // Calculate arbitrage
    const priceDiff = pcPriceBRL - mypAvgPrice;
    const arbitragePct = (priceDiff / pcPriceBRL) * 100;

    // Determine trend direction
    let priceGap: 'widening' | 'narrowing' | 'stable' = 'stable';
    if (Math.abs(arbitragePct) > 15) {
      priceGap = arbitragePct < 0 ? 'widening' : 'narrowing';
    }

    // Generate insights
    const insights: string[] = [];
    if (arbitragePct < -10) {
      insights.push(`MYP está ${Math.abs(arbitragePct).toFixed(1)}% mais barato que PriceCharting`);
      insights.push('Forte oportunidade de arbitragem para venda internacional');
    } else if (arbitragePct > 10) {
      insights.push(`MYP está ${arbitragePct.toFixed(1)}% mais caro que PriceCharting`);
      insights.push('Considere comprar no mercado internacional');
    }

    if (salesFlow.summary.diffVolumePct > 0) {
      insights.push(`Volume MYP crescendo (+${salesFlow.summary.diffVolumePct.toFixed(1)}%)`);
    }

    // Volume comparison insights
    const mypSales = salesFlow.summary.totalSales;
    const pcTotalSales = pcData.totalSales || 0;
    const pcRawSales = pcData.rawSalesCount || 0;
    const pcPsaSales = pcData.psaSalesCount || 0;

    if (pcTotalSales > 0) {
      const demandRatio = pcTotalSales / (mypSales || 1);

      if (demandRatio > 5) {
        insights.push(`🔥 Demanda internacional ${demandRatio.toFixed(1)}x maior que Brasil (${pcTotalSales} vs ${mypSales} vendas)`);
        insights.push('Alta liquidez no exterior - forte oportunidade de export');
      } else if (demandRatio > 2) {
        insights.push(`📈 Demanda razoável no exterior (${demandRatio.toFixed(1)}x Brasil)`);
      } else if (demandRatio < 0.5) {
        insights.push(`🇧🇷 Demanda maior no Brasil - carta popular localmente`);
      }

      // PSA vs RAW analysis
      if (pcPsaSales > pcRawSales && pcPsaSales > 10) {
        insights.push(`🏆 Mercado internacional prefere PSA (${pcPsaSales} PSA vs ${pcRawSales} RAW)`);
        const psaPremium = pcData.psaAvgPrice ? ((pcData.psaAvgPrice - pcData.rawAvgPrice) / pcData.rawAvgPrice * 100) : 0;
        if (psaPremium > 30) {
          insights.push(`💰 Premium PSA de +${psaPremium.toFixed(0)}% - considere gradar`);
        }
      }
    }

    // Recommendation
    let recommendation = 'Mercados em equilíbrio';
    if (arbitragePct < -15) {
      recommendation = '✅ COMPRAR no MYP e vender no PriceCharting';
    } else if (arbitragePct < -5) {
      recommendation = '🟡 Boa oportunidade de arbitragem';
    } else if (arbitragePct > 10) {
      recommendation = '⚠️ MYP sobrevalorizado - aguardar correção';
    }

    return {
      mypMarket: {
        totalSales: salesFlow.summary.totalSales,
        totalVolume: salesFlow.summary.totalVolume,
        avgPrice: mypAvgPrice,
        priceChange7d: salesFlow.summary.diffSalesPct,
        lastUpdate: 'Agora'
      },
      priceChartingMarket: {
        currentPrice: pcData.ungraded_price,
        currentPriceBRL: pcPriceBRL,
        priceChange30d: 0, // TODO: calculate from historical data
        lastUpdate: new Date(pcData.data_coleta).toLocaleDateString('pt-BR'),
        rawSalesCount: pcData.rawSalesCount || 0,
        rawAvgPrice: pcData.rawAvgPrice || pcData.ungraded_price || 0,
        psaSalesCount: pcData.psaSalesCount || 0,
        psaAvgPrice: pcData.psaAvgPrice || 0,
        totalSales: pcData.totalSales || 0
      },
      trends: {
        arbitrageOpportunity: arbitragePct,
        arbitrageValueBRL: priceDiff,
        priceGap,
        recommendation,
        insights
      }
    };
  });

  async ngOnInit() {
    if (this.cardName) {
      await this.fetchPriceChartingData(this.cardName);
    }
  }

  async fetchPriceChartingData(cardName: string) {
    this.loading.set(true);
    this.error.set(null);

    try {
      console.log('🔍 Fetching PriceCharting data for:', cardName);

      // Get latest date from overview
      const { data: latestDate, error: dateError } = await supabase
        .from('pricecharting_overview')
        .select('data_coleta')
        .order('data_coleta', { ascending: false })
        .limit(1)
        .single();

      if (dateError) {
        throw new Error('Could not fetch latest PriceCharting date');
      }

      // Get price data for this card
      const { data: pcData, error: pcError } = await supabase
        .from('pricecharting_overview')
        .select('*')
        .eq('data_coleta', latestDate.data_coleta)
        .ilike('card_name', `%${cardName}%`)
        .limit(1)
        .single();

      if (pcError || !pcData) {
        throw new Error(`PriceCharting overview data not found for ${cardName}`);
      }

      // Fetch sales volume data from pricecharting_sales
      const { data: salesData, error: salesError } = await supabase
        .from('pricecharting_sales')
        .select('price, grade')
        .ilike('card_name', `%${cardName}%`)
        .order('sale_date', { ascending: false });

      console.log('✅ PriceCharting data loaded:', pcData);
      console.log('📊 Sales data loaded:', salesData?.length, 'sales');

      // Calculate sales metrics
      let rawSales = 0, rawPriceSum = 0;
      let psaSales = 0, psaPriceSum = 0;

      if (salesData && salesData.length > 0) {
        salesData.forEach((sale: any) => {
          const price = sale.price || 0;
          const grade = (sale.grade || '').toUpperCase();

          if (grade === 'RAW' || grade === '' || !sale.grade) {
            rawSales++;
            rawPriceSum += price;
          } else if (grade.includes('PSA')) {
            psaSales++;
            psaPriceSum += price;
          }
        });
      }

      const rawAvgPrice = rawSales > 0 ? rawPriceSum / rawSales : pcData.ungraded_price || 0;
      const psaAvgPrice = psaSales > 0 ? psaPriceSum / psaSales : 0;

      // Combine all data
      const completeData = {
        ...pcData,
        rawSalesCount: rawSales,
        rawAvgPrice: rawAvgPrice,
        psaSalesCount: psaSales,
        psaAvgPrice: psaAvgPrice,
        totalSales: rawSales + psaSales
      };

      console.log('📊 Sales summary:', {
        raw: `${rawSales} sales, avg $${rawAvgPrice.toFixed(2)}`,
        psa: `${psaSales} sales, avg $${psaAvgPrice.toFixed(2)}`,
        total: rawSales + psaSales
      });

      this.priceChartingData.set(completeData);

    } catch (err: any) {
      console.error('❌ Error fetching PriceCharting data:', err);
      this.error.set(err.message || 'Erro ao buscar dados do PriceCharting');
    } finally {
      this.loading.set(false);
    }
  }
}
