import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MarketComparisonData } from '../../models/market-comparison.model';

@Component({
  selector: 'app-market-comparison-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="comparison-container">
      <div class="comparison-header">
        <h3>📊 Comparação de Mercados</h3>
        <p class="subtitle">Analise oportunidades entre mercados</p>
      </div>

      @if (data) {
        <div class="markets-grid">
          <!-- MYP Market (Brazil) -->
          <div class="market-card myp-market">
            <div class="market-flag">🇧🇷</div>
            <h4>MYP (Brasil)</h4>
            
            <div class="metrics">
              <div class="metric">
                <span class="label">Vendas (7d)</span>
                <span class="value">{{ data.mypMarket.totalSales }}</span>
              </div>
              <div class="metric">
                <span class="label">Volume</span>
                <span class="value">R$ {{ data.mypMarket.totalVolume | number:'1.2-2' }}</span>
              </div>
              <div class="metric">
                <span class="label">Preço Médio</span>
                <span class="value primary">R$ {{ data.mypMarket.avgPrice | number:'1.2-2' }}</span>
              </div>
              <div class="metric">
                <span class="label">Variação 7d</span>
                <span class="value" [class.positive]="data.mypMarket.priceChange7d >= 0" 
                      [class.negative]="data.mypMarket.priceChange7d < 0">
                  {{ data.mypMarket.priceChange7d > 0 ? '+' : '' }}{{ data.mypMarket.priceChange7d | number:'1.1-1' }}%
                </span>
              </div>
            </div>
            
            <div class="update-time">
              Atualizado: {{ data.mypMarket.lastUpdate }}
            </div>
          </div>

          <!-- PriceCharting Market (International) -->
          <div class="market-card pc-market">
            <div class="market-flag">🌎</div>
            <h4>PriceCharting (Int'l)</h4>
            
            <div class="metrics">
              <div class="metric">
                <span class="label">Preço Atual (USD)</span>
                <span class="value">\${{ data.priceChartingMarket.currentPrice | number:'1.2-2' }}</span>
              </div>
              <div class="metric">
                <span class="label">Preço Atual (BRL)</span>
                <span class="value primary">R$ {{ data.priceChartingMarket.currentPriceBRL | number:'1.2-2' }}</span>
              </div>
              <div class="metric">
                <span class="label">Variação 30d</span>
                <span class="value" [class.positive]="data.priceChartingMarket.priceChange30d >= 0" 
                      [class.negative]="data.priceChartingMarket.priceChange30d < 0">
                  {{ data.priceChartingMarket.priceChange30d > 0 ? '+' : '' }}{{ data.priceChartingMarket.priceChange30d | number:'1.1-1' }}%
                </span>
              </div>
              <div class="metric separator">
                <span class="label">📦 RAW Sales</span>
                <span class="value">{{ data.priceChartingMarket.rawSalesCount }}</span>
              </div>
              <div class="metric">
                <span class="label">RAW Avg Price</span>
                <span class="value">\${{ data.priceChartingMarket.rawAvgPrice | number:'1.2-2' }}</span>
              </div>
              <div class="metric">
                <span class="label">🏆 PSA Sales</span>
                <span class="value">{{ data.priceChartingMarket.psaSalesCount }}</span>
              </div>
              <div class="metric">
                <span class="label">PSA Avg Price</span>
                <span class="value">\${{ data.priceChartingMarket.psaAvgPrice | number:'1.2-2' }}</span>
              </div>
              <div class="metric highlight-total">
                <span class="label">Total Sales</span>
                <span class="value primary">{{ data.priceChartingMarket.totalSales }}</span>
              </div>
              @if (data.priceChartingMarket.lastSalePrice) {
                <div class="metric">
                  <span class="label">Última Venda</span>
                  <span class="value">\${{ data.priceChartingMarket.lastSalePrice | number:'1.2-2' }}</span>
                </div>
              }
            </div>
            
            <div class="update-time">
              Atualizado: {{ data.priceChartingMarket.lastUpdate }}
            </div>
          </div>
        </div>

        <!-- Volume Comparison -->
        <div class="volume-comparison-section">
          <h4 class="volume-title">📊 Comparativo de Volume de Vendas</h4>
          
          <div class="volume-grid">
            <div class="volume-item">
              <div class="volume-header">
                <span class="volume-label">🇧🇷 MYP Brasil</span>
                <span class="volume-number">{{ data.mypMarket.totalSales }}</span>
              </div>
              <div class="volume-bar-container">
                <div class="volume-bar myp" [style.width.%]="getVolumePercentage(data.mypMarket.totalSales, data.priceChartingMarket.totalSales)"></div>
              </div>
              <div class="volume-detail">{{ data.mypMarket.totalSales }} vendas (7 dias)</div>
            </div>

            <div class="volume-item">
              <div class="volume-header">
                <span class="volume-label">🌎 PriceCharting Int'l</span>
                <span class="volume-number">{{ data.priceChartingMarket.totalSales }}</span>
              </div>
              <div class="volume-bar-container">
                <div class="volume-bar pc" [style.width.%]="getVolumePercentage(data.priceChartingMarket.totalSales, data.mypMarket.totalSales)"></div>
              </div>
              <div class="volume-detail">
                {{ data.priceChartingMarket.rawSalesCount }} RAW + {{ data.priceChartingMarket.psaSalesCount }} PSA
              </div>
            </div>
          </div>

          <div class="demand-indicator">
            <span class="demand-label">Demanda Relativa:</span>
            <span class="demand-value" [class]="getDemandClass(data.mypMarket.totalSales, data.priceChartingMarket.totalSales)">
              {{ getDemandLabel(data.mypMarket.totalSales, data.priceChartingMarket.totalSales) }}
            </span>
          </div>
        </div>

        <!-- Trends & Insights -->
        <div class="trends-section">
          <div class="trend-header">
            <span class="icon">💡</span>
            <h4>Análise de Tendências</h4>
          </div>

          <div class="arbitrage-box" [class.opportunity]="data.trends.arbitrageOpportunity < -5"
                                       [class.warning]="data.trends.arbitrageOpportunity > 5">
            <div class="arb-metric">
              <span class="arb-label">Gap de Preço</span>
              <span class="arb-value">
                {{ data.trends.arbitrageOpportunity > 0 ? '+' : '' }}{{ data.trends.arbitrageOpportunity | number:'1.1-1' }}%
              </span>
            </div>
            <div class="arb-metric">
              <span class="arb-label">Oportunidade/Carta</span>
              <span class="arb-value highlight">R$ {{ data.trends.arbitrageValueBRL | number:'1.2-2' }}</span>
            </div>
            <div class="arb-status">
              <span class="status-badge" [class]="data.trends.priceGap">
                {{ getPriceGapLabel(data.trends.priceGap) }}
              </span>
            </div>
          </div>

          <div class="recommendation">
            <strong>💼 Recomendação:</strong> {{ data.trends.recommendation }}
          </div>

          @if (data.trends.insights.length > 0) {
            <div class="insights-list">
              @for (insight of data.trends.insights; track $index) {
                <div class="insight-item">
                  <span class="bullet">•</span>
                  <span>{{ insight }}</span>
                </div>
              }
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .comparison-container {
      background: white;
      border-radius: 16px;
      padding: 24px;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
      border: 1px solid #e2e8f0;
    }

    .comparison-header {
      margin-bottom: 24px;
      text-align: center;
    }

    .comparison-header h3 {
      font-size: 20px;
      font-weight: 700;
      color: #0f172a;
      margin: 0 0 8px 0;
    }

    .subtitle {
      font-size: 14px;
      color: #64748b;
      margin: 0;
    }

    .markets-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin-bottom: 24px;
    }

    .market-card {
      background: linear-gradient(135deg, #f8fafc 0%, #fff 100%);
      border: 2px solid #e2e8f0;
      border-radius: 12px;
      padding: 20px;
      position: relative;
    }

    .market-card.myp-market {
      border-color: #10b981;
    }

    .market-card.pc-market {
      border-color: #3b82f6;
    }

    .market-flag {
      font-size: 32px;
      position: absolute;
      top: 16px;
      right: 16px;
      opacity: 0.2;
    }

    .market-card h4 {
      font-size: 16px;
      font-weight: 700;
      color: #0f172a;
      margin: 0 0 16px 0;
    }

    .metrics {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .metric {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 0;
      border-bottom: 1px solid #f1f5f9;
    }

    .metric:last-child {
      border-bottom: none;
    }

    .metric .label {
      font-size: 12px;
      color: #64748b;
      font-weight: 600;
    }

    .metric .value {
      font-size: 14px;
      font-weight: 700;
      color: #0f172a;
    }

    .metric .value.primary {
      font-size: 18px;
      color: #3b82f6;
    }

    .metric .value.positive {
      color: #10b981;
    }

    .metric .value.negative {
      color: #ef4444;
    }

    .metric.separator {
      margin-top: 8px;
      border-top: 2px solid #E2E8F0;
      padding-top: 16px;
    }

    .metric.highlight-total {
      background: linear-gradient(135deg, #eff6ff 0%, #f8fafc 100%);
      margin: 8px -8px 0 -8px;
      padding: 12px 8px 8px 8px;
      border-radius: 6px;
    }

    .volume-comparison-section {
      background: white;
      border: 2px solid #e2e8f0;
      border-radius: 12px;
      padding: 20px;
      margin-bottom: 20px;
    }

    .volume-title {
      font-size: 16px;
      font-weight: 700;
      color: #0f172a;
      margin: 0 0 20px 0;
      text-align: center;
    }

    .volume-grid {
      display: grid;
      gap: 16px;
      margin-bottom: 16px;
    }

    .volume-item {
      background: #f8fafc;
      padding: 16px;
      border-radius: 8px;
    }

    .volume-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
    }

    .volume-label {
      font-size: 14px;
      font-weight: 600;
      color: #475569;
    }

    .volume-number {
      font-size: 24px;
      font-weight: 800;
      color: #0f172a;
    }

    .volume-bar-container {
      height: 32px;
      background: #e2e8f0;
      border-radius: 6px;
      overflow: hidden;
      margin-bottom: 8px;
    }

    .volume-bar {
      height: 100%;
      transition: width 0.3s ease;
      display: flex;
      align-items: center;
      justify-content: flex-end;
      padding-right: 8px;
      color: white;
      font-size: 12px;
      font-weight: 700;
    }

    .volume-bar.myp {
      background: linear-gradient(90deg, #10b981 0%, #059669 100%);
    }

    .volume-bar.pc {
      background: linear-gradient(90deg, #3b82f6 0%, #2563eb 100%);
    }

    .volume-detail {
      font-size: 12px;
      color: #64748b;
      text-align: center;
    }

    .demand-indicator {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 12px;
      padding: 12px;
      background: linear-gradient(135deg, #f8fafc 0%, #fff 100%);
      border-radius: 8px;
      border: 1px solid #e2e8f0;
    }

    .demand-label {
      font-size: 13px;
      font-weight: 600;
      color: #64748b;
    }

    .demand-value {
      font-size: 16px;
      font-weight: 800;
      padding: 6px 16px;
      border-radius: 99px;
    }

    .demand-value.high-international {
      background: #dcfce7;
      color: #166534;
    }

    .demand-value.medium-international {
      background: #dbeafe;
      color: #1e40af;
    }

    .demand-value.balanced {
      background: #e0e7ff;
      color: #3730a3;
    }

    .demand-value.high-brasil {
      background: #fef3c7;
      color: #92400e;
    }

    .demand-value.neutral {
      background: #f3f4f6;
      color: #6b7280;
    }

    .update-time {
      margin-top: 12px;
      font-size: 11px;
      color: #94a3b8;
      text-align: center;
    }

    .trends-section {
      background: linear-gradient(135deg, #eff6ff 0%, #f8fafc 100%);
      border: 2px solid #dbeafe;
      border-radius: 12px;
      padding: 20px;
    }

    .trend-header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 16px;
    }

    .trend-header .icon {
      font-size: 24px;
    }

    .trend-header h4 {
      font-size: 16px;
      font-weight: 700;
      color: #0f172a;
      margin: 0;
    }

    .arbitrage-box {
      background: white;
      border: 2px solid #e2e8f0;
      border-radius: 8px;
      padding: 16px;
      margin-bottom: 16px;
      display: grid;
      grid-template-columns: 1fr 1fr 120px;
      gap: 16px;
      align-items: center;
    }

    .arbitrage-box.opportunity {
      border-color: #10b981;
      background: linear-gradient(135deg, #f0fdf4 0%, #fff 100%);
    }

    .arbitrage-box.warning {
      border-color: #f59e0b;
      background: linear-gradient(135deg, #fffbeb 0%, #fff 100%);
    }

    .arb-metric {
      display: flex;
      flex-direction: column;
    }

    .arb-label {
      font-size: 11px;
      color: #64748b;
      font-weight: 600;
      text-transform: uppercase;
      margin-bottom: 4px;
    }

    .arb-value {
      font-size: 20px;
      font-weight: 800;
      color: #0f172a;
    }

    .arb-value.highlight {
      color: #10b981;
    }

    .arb-status {
      display: flex;
      justify-content: center;
    }

    .status-badge {
      padding: 8px 16px;
      border-radius: 99px;
      font-size: 12px;
      font-weight: 700;
      text-transform: uppercase;
    }

    .status-badge.widening {
      background: #fef3c7;
      color: #92400e;
    }

    .status-badge.narrowing {
      background: #dcfce7;
      color: #166534;
    }

    .status-badge.stable {
      background: #e0e7ff;
      color: #3730a3;
    }

    .recommendation {
      background: white;
      border-left: 4px solid #3b82f6;
      padding: 12px 16px;
      margin-bottom: 16px;
      border-radius: 4px;
      font-size: 14px;
      color: #334155;
    }

    .recommendation strong {
      color: #0f172a;
    }

    .insights-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .insight-item {
      display: flex;
      gap: 8px;
      font-size: 13px;
      color: #475569;
      line-height: 1.5;
    }

    .insight-item .bullet {
      color: #3b82f6;
      font-weight: bold;
    }

    @media (max-width: 768px) {
      .markets-grid {
        grid-template-columns: 1fr;
      }

      .arbitrage-box {
        grid-template-columns: 1fr;
        text-align: center;
      }
    }
  `]
})
export class MarketComparisonCardComponent {
  @Input() data: MarketComparisonData | null = null;

  getPriceGapLabel(gap: 'widening' | 'narrowing' | 'stable'): string {
    const labels = {
      widening: 'Abrindo',
      narrowing: 'Fechando',
      stable: 'Estável'
    };
    return labels[gap];
  }

  getVolumePercentage(value: number, compareValue: number): number {
    if (!value && !compareValue) return 50;
    const max = Math.max(value, compareValue, 1);
    return Math.min((value / max) * 100, 100);
  }

  getDemandLabel(mypSales: number, pcSales: number): string {
    if (!pcSales) return 'Dados não disponíveis';
    const ratio = pcSales / (mypSales || 1);
    if (ratio > 5) return `Internacional ${ratio.toFixed(1)}x maior 🔥`;
    if (ratio > 2) return `Internacional ${ratio.toFixed(1)}x maior 📈`;
    if (ratio > 1.2) return 'Internacional maior';
    if (ratio > 0.8) return 'Demandas similares ⚖️';
    return '🇧🇷 Brasil maior';
  }

  getDemandClass(mypSales: number, pcSales: number): string {
    if (!pcSales) return 'neutral';
    const ratio = pcSales / (mypSales || 1);
    if (ratio > 3) return 'high-international';
    if (ratio > 1.5) return 'medium-international';
    if (ratio < 0.7) return 'high-brasil';
    return 'balanced';
  }
}
