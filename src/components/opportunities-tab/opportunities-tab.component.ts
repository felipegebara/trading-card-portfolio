import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SupabaseService } from '../../services/supabase.service';

interface ArbitrageOpportunity {
  card_name: string;
  card_slug: string;
  preco_compra_myp: number;
  avg_myp_3: number;
  liquidity: number;
  preco_raw_usd: number;
  preco_venda_raw: number;
  lucro_potencial: number;
  roi_percent: number;
  data_myp?: string;
  data_pc?: string;
}

@Component({
  selector: 'app-opportunities-tab',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="opportunities-container">
      <!-- Header -->
      <header class="header">
        <div class="header-content">
          <h1 class="title">🚀 Oportunidades de Arbitragem</h1>
          <p class="subtitle">Análise avançada: Compra no MYP (Brasil) vs Venda no PriceCharting Raw (Internacional)</p>
          <div class="badge-rate">Câmbio: R$ 5.30 / USD</div>
        </div>
      </header>

      <!-- Insights Section (Top of the Day) -->
      <div class="insights-section" *ngIf="!loading() && filteredOpportunities().length > 0">
        <h3 class="section-title">✨ Destaques do Dia</h3>
        <div class="insights-grid">
            <div class="insight-card highlight-green">
                <div class="insight-label">MELHOR ROI</div>
                <div class="insight-value">{{ topRoiOpp()?.roi_percent | number:'1.0-0' }}%</div>
                <div class="insight-sub">{{ topRoiOpp()?.card_name }}</div>
            </div>
            <div class="insight-card highlight-blue">
                <div class="insight-label">MAIOR LUCRO</div>
                <div class="insight-value">R$ {{ topProfitOpp()?.lucro_potencial | number:'1.0-0' }}</div>
                <div class="insight-sub">{{ topProfitOpp()?.card_name }}</div>
            </div>
            <div class="insight-card highlight-orange">
                <div class="insight-label">MAIS LÍQUIDA</div>
                <div class="insight-value">{{ topLiquidityOpp()?.liquidity }} Ofertas</div>
                <div class="insight-sub">{{ topLiquidityOpp()?.card_name }}</div>
            </div>
        </div>
      </div>

      <!-- Filters & Sorting -->
      <div class="controls-bar">
        <div class="filters">
            <label>ROI Mín:</label>
            <input type="number" [(ngModel)]="minRoi" placeholder="0" class="filter-input">
            <label>Lucro Mín (R$):</label>
            <input type="number" [(ngModel)]="minProfit" placeholder="0" class="filter-input">
        </div>
        <div class="sorting">
            <label>Ordenar por:</label>
            <select [(ngModel)]="sortBy" (change)="sortOpportunities()" class="sort-select">
                <option value="roi">Maior ROI</option>
                <option value="profit">Maior Lucro</option>
                <option value="liquidity">Maior Liquidez</option>
            </select>
        </div>
      </div>

      <!-- Loading State -->
      <div *ngIf="loading()" class="loading">
        <div class="spinner"></div>
        <p>Analisando o mercado (MYP vs PC)...</p>
      </div>

      <!-- Empty State -->
      <div *ngIf="!loading() && filteredOpportunities().length === 0" class="empty-state">
        <p>Nenhuma oportunidade encontrada com os filtros atuais.</p>
      </div>

      <!-- Opportunity Cards Grid -->
      <div class="cards-grid" *ngIf="!loading()">
        <div *ngFor="let card of filteredOpportunities()" class="opp-card">
            <div class="card-header">
                <div class="card-title">{{ card.card_name }}</div>
                <div class="card-badges">
                    <span class="badge-liquidity" [class.high]="card.liquidity >= 5" [class.low]="card.liquidity < 3">
                        💧 {{ card.liquidity }} Ofertas
                    </span>
                    <span class="badge-roi" [class.mega]="card.roi_percent > 100">
                        🚀 ROI {{ card.roi_percent | number:'1.0-0' }}%
                    </span>
                </div>
            </div>

            <div class="card-body">
                <div class="price-row buy">
                    <span class="label">Compra (MYP nm)</span>
                    <!-- FIX: Binding to correct property preco_compra_myp -->
                    <span class="value" *ngIf="card.preco_compra_myp; else noPrice">
                        R$ {{ card.preco_compra_myp | number:'1.2-2' }}
                    </span>
                    <ng-template #noPrice><span class="value">—</span></ng-template>
                    <span class="sub-value">Méd. Top 3: R$ {{ card.avg_myp_3 | number:'1.2-2' }}</span>
                </div>
                
                <div class="divider">vs</div>

                <div class="price-row sell">
                    <span class="label">Venda Est. (Raw)</span>
                    <span class="value">~ R$ {{ card.preco_venda_raw | number:'1.2-2' }}</span>
                    <span class="sub-value">$ {{ card.preco_raw_usd | number:'1.2-2' }} (USD)</span>
                </div>
            </div>

            <div class="card-profit">
                <span class="label">LUCRO POTENCIAL</span>
                <span class="value" [class.positive]="card.lucro_potencial > 0">
                    R$ {{ card.lucro_potencial | number:'1.2-2' }}
                </span>
            </div>

            <div class="card-footer">
                <a [href]="'https://myp.cards/search?q=' + card.card_name" target="_blank" class="btn-action">
                    Ver no MYP ↗
                </a>
            </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .opportunities-container { padding: 0 0 40px 0; max-width: 1200px; margin: 0 auto; }
    
    .header { margin-bottom: 32px; padding-bottom: 16px; border-bottom: 1px solid #e5e7eb; display: flex; justify-content: space-between; align-items: flex-start; }
    .title { font-size: 28px; font-weight: 800; color: #111827; margin: 0 0 4px 0; letter-spacing: -0.5px; }
    .subtitle { font-size: 14px; color: #6b7280; margin: 0; }
    .badge-rate { background: #f3f4f6; color: #4b5563; padding: 6px 12px; border-radius: 99px; font-size: 12px; font-weight: 600; margin-top: 8px; display: inline-block; }

    /* Insights Section */
    .insights-section { margin-bottom: 40px; }
    .section-title { font-size: 16px; font-weight: 700; color: #374151; margin-bottom: 16px; text-transform: uppercase; letter-spacing: 0.5px; }
    .insights-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 16px; }
    
    .insight-card { background: white; padding: 20px; border-radius: 16px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); border: 1px solid rgba(0,0,0,0.05); transition: transform 0.2s; }
    .insight-card:hover { transform: translateY(-2px); }
    .insight-label { font-size: 11px; font-weight: 700; color: #9ca3af; margin-bottom: 4px; letter-spacing: 0.5px; }
    .insight-value { font-size: 24px; font-weight: 800; color: #111827; margin-bottom: 4px; }
    .insight-sub { font-size: 13px; color: #6b7280; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

    .highlight-green { border-left: 4px solid #10b981; }
    .highlight-blue { border-left: 4px solid #3b82f6; }
    .highlight-orange { border-left: 4px solid #f97316; }

    /* Controls */
    .controls-bar { display: flex; flex-wrap: wrap; gap: 24px; align-items: center; justify-content: space-between; margin-bottom: 24px; background: white; padding: 16px; border-radius: 12px; border: 1px solid #f3f4f6; }
    .filters, .sorting { display: flex; align-items: center; gap: 12px; }
    .filters label, .sorting label { font-size: 13px; font-weight: 600; color: #4b5563; }
    .filter-input, .sort-select { padding: 8px 12px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 14px; outline: none; transition: border 0.2s; }
    .filter-input:focus, .sort-select:focus { border-color: #3b82f6; }
    .filter-input { width: 80px; }

    /* Cards Grid */
    .cards-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); gap: 24px; }
    
    .opp-card { background: white; border-radius: 16px; border: 1px solid rgba(0,0,0,0.04); box-shadow: 0 10px 15px -3px rgba(0,0,0,0.05), 0 4px 6px -2px rgba(0,0,0,0.025); overflow: hidden; display: flex; flex-direction: column; transition: all 0.3s ease; }
    .opp-card:hover { transform: translateY(-4px); box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04); }

    .card-header { padding: 20px; background: #f9fafb; border-bottom: 1px solid #f3f4f6; }
    .card-title { font-size: 16px; font-weight: 700; color: #111827; margin-bottom: 12px; line-height: 1.4; }
    .card-badges { display: flex; gap: 8px; flex-wrap: wrap; }
    
    .badge-liquidity { font-size: 11px; padding: 4px 8px; border-radius: 6px; background: #e5e7eb; color: #4b5563; font-weight: 600; }
    .badge-liquidity.high { background: #dbeafe; color: #1e40af; }
    .badge-liquidity.low { background: #fee2e2; color: #991b1b; }
    
    .badge-roi { font-size: 11px; padding: 4px 8px; border-radius: 6px; background: #d1fae5; color: #065f46; font-weight: 700; }
    .badge-roi.mega { background: #ffedd5; color: #9a3412; box-shadow: 0 0 0 1px #fdba74; }

    .card-body { padding: 20px; display: flex; align-items: center; justify-content: space-between; gap: 8px; }
    .price-row { display: flex; flex-direction: column; }
    .price-row.buy { align-items: flex-start; }
    .price-row.sell { align-items: flex-end; text-align: right; }
    
    .label { font-size: 10px; text-transform: uppercase; color: #9ca3af; font-weight: 700; margin-bottom: 4px; }
    .value { font-size: 18px; font-weight: 800; color: #1f2937; }
    .sub-value { font-size: 11px; color: #6b7280; margin-top: 2px; }
    
    .divider { font-size: 12px; font-weight: 700; color: #d1d5db; background: #f3f4f6; padding: 4px 8px; border-radius: 12px; }

    .card-profit { background: #f0fdf4; padding: 12px 20px; display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #f3f4f6; border-bottom: 1px solid #f3f4f6; }
    .card-profit .label { margin: 0; color: #166534; }
    .card-profit .value { color: #166534; font-size: 16px; }

    .card-footer { padding: 16px 20px; background: white; text-align: center; }
    .btn-action { display: block; width: 100%; padding: 10px; background: #111827; color: white; border-radius: 8px; font-size: 13px; font-weight: 600; text-decoration: none; transition: background 0.2s; }
    .btn-action:hover { background: #374151; }

    .loading, .empty-state { padding: 60px; text-align: center; color: #6b7280; }
    .spinner { margin: 0 auto 16px; width: 32px; height: 32px; border: 3px solid #e5e7eb; border-top-color: #111827; border-radius: 50%; animation: spin 1s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
  `]
})
export class OpportunitiesTabComponent implements OnInit {
  // Data
  allOpportunities = signal<ArbitrageOpportunity[]>([]);

  // Filters
  minRoi = 0;
  minProfit = 0;
  sortBy: 'roi' | 'profit' | 'liquidity' = 'roi';

  loading = signal(true);

  // Computed & Filtered
  filteredOpportunities = computed(() => {
    let list = this.allOpportunities();
    const roiMin = this.minRoi;
    const profitMin = this.minProfit;

    // Filter
    list = list.filter(o => o.roi_percent >= roiMin && o.lucro_potencial >= profitMin);

    // Sort
    const sort = this.sortBy;
    return list.sort((a, b) => {
      if (sort === 'profit') return b.lucro_potencial - a.lucro_potencial;
      if (sort === 'liquidity') return b.liquidity - a.liquidity;
      return b.roi_percent - a.roi_percent; // Default ROI
    });
  });

  // Insights
  topRoiOpp = computed(() => {
    const list = this.allOpportunities();
    return list.length ? [...list].sort((a, b) => b.roi_percent - a.roi_percent)[0] : null;
  });

  topProfitOpp = computed(() => {
    const list = this.allOpportunities();
    return list.length ? [...list].sort((a, b) => b.lucro_potencial - a.lucro_potencial)[0] : null;
  });

  topLiquidityOpp = computed(() => {
    const list = this.allOpportunities();
    return list.length ? [...list].sort((a, b) => b.liquidity - a.liquidity)[0] : null;
  });

  constructor(private supabaseService: SupabaseService) { }

  ngOnInit() {
    this.loadOpportunities();
  }

  async loadOpportunities() {
    this.loading.set(true);
    try {
      const data = await this.supabaseService.getArbitrageOpportunities();
      this.allOpportunities.set(data as any);
    } catch (error) {
      console.error('Failed to load opportunities', error);
    } finally {
      this.loading.set(false);
    }
  }

  sortOpportunities() {
    // Logic handled by computed signal 'filteredOpportunities'
  }
}
