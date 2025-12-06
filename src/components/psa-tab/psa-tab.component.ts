import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { supabase } from '../../supabaseClient';

interface PriceOverview {
  card_slug: string;
  card_name: string;
  ungraded_price: number;
  psa10_price: number;
  data_coleta: string;
}

interface CardWithStats extends PriceOverview {
  premium: number;
  gain: number;
}

@Component({
  selector: 'app-psa-tab',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="psa-container">
      <div class="header">
        <h1 class="title">📊 PSA vs RAW - Análise de Ganho</h1>
        <p class="subtitle">Compare o ganho esperado ao certificar cartas PSA 10</p>
      </div>

      <!-- Search -->
      <div class="filter-section">
        <label>BUSCAR CARTA</label>
        <input
          type="text"
          [(ngModel)]="searchTerm"
          (ngModelChange)="searchTerm.set($event)"
          class="search-input"
          placeholder="Digite o nome da carta..."
        />
      </div>

      <!-- KPIs -->
      <div class="stats-grid" *ngIf="!loading() && filteredData().length > 0">
        <div class="stat-card">
          <div class="stat-icon">🎴</div>
          <div class="stat-content">
            <p class="stat-label">CARTAS</p>
            <p class="stat-value">{{ uniqueCards() }}</p>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon">⚪</div>
          <div class="stat-content">
            <p class="stat-label">PREÇO MÉD. RAW</p>
            <p class="stat-value">$ {{ avgUngraded() | number:'1.2-2' }}</p>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon">🔵</div>
          <div class="stat-content">
            <p class="stat-label">PREÇO MÉD. PSA 10</p>
            <p class="stat-value">$ {{ avgPSA10() | number:'1.2-2' }}</p>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon">📈</div>
          <div class="stat-content">
            <p class="stat-label">VALORIZAÇÃO</p>
            <p class="stat-value positive">+{{ premiumPercent() | number:'1.0-0' }}%</p>
          </div>
        </div>
      </div>

      <!-- Loading -->
      <div class="loading" *ngIf="loading()">
        <div class="spinner"></div>
        <p>Carregando...</p>
      </div>

      <!-- Empty -->
      <div class="empty-state" *ngIf="!loading() && filteredData().length === 0">
        <p>{{ allData().length === 0 ? 'Sem dados' : 'Carta não encontrada' }}</p>
      </div>

      <!-- Top Cards -->
      <div class="table-section" *ngIf="!loading() && topCards().length > 0">
        <h3>🏆 Top Cartas - Maior Ganho ao Certificar PSA 10</h3>
        <div class="cards-grid">
          <div *ngFor="let card of topCards()" class="card-item" (click)="openCardDetail(card)">
            <div class="card-header">
              <span class="card-title">{{ card.card_name }}</span>
              <span class="card-slug">{{ card.card_slug }}</span>
              <span class="card-date">{{ card.data_coleta | date:'dd/MM/yyyy' }}</span>
            </div>
            <div class="card-prices">
              <div class="price-col">
                <span class="price-label">RAW</span>
                <span class="price-value">$ {{ card.ungraded_price | number:'1.2-2' }}</span>
              </div>
              <div class="arrow">→</div>
              <div class="price-col">
                <span class="price-label">PSA 10</span>
                <span class="price-value psa">$ {{ card.psa10_price | number:'1.2-2' }}</span>
              </div>
            </div>
            <div class="card-gain">
              <div class="gain-badge" [class.mega]="card.premium > 300">
                <span class="gain-percent">+{{ card.premium | number:'1.0-0' }}%</span>
                <span class="gain-amount">$ +{{ card.gain | number:'1.2-2' }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Card Detail Modal -->
      <div class="modal-overlay" *ngIf="selectedCard()" (click)="closeCardDetail()">
        <div class="modal-content" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h2>{{ selectedCard()!.card_name }}</h2>
            <button class="close-btn" (click)="closeCardDetail()">×</button>
          </div>

          <div class="modal-body">
            <!-- Card Info -->
            <div class="info-grid">
              <div class="info-item">
                <span class="info-label">Slug</span>
                <span class="info-value">{{ selectedCard()!.card_slug }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Data Coleta</span>
                <span class="info-value">{{ selectedCard()!.data_coleta | date:'dd/MM/yyyy' }}</span>
              </div>
            </div>

            <!-- Price Comparison -->
            <div class="price-comparison">
              <div class="price-box">
                <p class="price-box-label">RAW (Ungraded)</p>
                <p class="price-box-value">$ {{ selectedCard()!.ungraded_price | number:'1.2-2' }}</p>
              </div>

              <div class="arrow-large">→</div>

              <div class="price-box psa">
                <p class="price-box-label">PSA 10</p>
                <p class="price-box-value">$ {{ selectedCard()!.psa10_price | number:'1.2-2' }}</p>
              </div>
            </div>

            <!-- Gain Stats -->
            <div class="gain-stats">
              <h3>💰 Ganho ao Certificar</h3>
              <div class="stats-row">
                <div class="stat-box highlight">
                  <p class="stat-box-label">Ganho em Dólar</p>
                  <p class="stat-box-value">+$ {{ selectedCard()!.gain | number:'1.2-2' }}</p>
                </div>

                <div class="stat-box highlight">
                  <p class="stat-box-label">Ganho Percentual</p>
                  <p class="stat-box-value">+{{ selectedCard()!.premium | number:'1.1-1' }}%</p>
                </div>
              </div>

              <!-- Simulated Sales Info (mock data for demonstration) -->
              <div class="sales-info">
                <h4>📊 Dados de Mercado (Estimativa)</h4>
                <div class="sales-grid">
                  <div class="sales-item">
                    <span class="sales-label">Quantidade Vendida (30d)</span>
                    <span class="sales-value">{{ getMockSalesQty() }}</span>
                  </div>
                  <div class="sales-item">
                    <span class="sales-label">Valor Médio Vendas</span>
                    <span class="sales-value">$ {{ selectedCard()!.psa10_price | number:'1.2-2' }}</span>
                  </div>
                  <div class="sales-item">
                    <span class="sales-label">Liquidez</span>
                    <span class="sales-value">{{ getMockLiquidity() }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="modal-footer">
            <button class="btn-secondary" (click)="closeCardDetail()">Fechar</button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .psa-container {
      padding: 24px;
      background: #fef8e8;
      min-height: 100vh;
    }

    .header {
      margin-bottom: 24px;
    }

    .title {
      font-size: 24px;
      font-weight: 700;
      color: #1f2937;
      margin: 0 0 8px 0;
    }

    .subtitle {
      font-size: 14px;
      color: #6b7280;
      margin: 0;
    }

    /* Search */
    .filter-section {
      margin-bottom: 24px;
    }

    .filter-section label {
      display: block;
      font-size: 11px;
      font-weight: 700;
      color: #6b7280;
      margin-bottom: 8px;
    }

    .search-input {
      width: 100%;
      max-width: 400px;
      padding: 12px 16px;
      border: 2px solid rgba(168, 216, 234, 0.3);
      border-radius: 8px;
      font-size: 14px;
      background: white;
      transition: all 0.3s;
    }

    .search-input:focus {
      outline: none;
      border-color: #ffc700;
    }

    /* KPIs */
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 16px;
      margin-bottom: 32px;
    }

    .stat-card {
      background: rgba(255, 255, 255, 0.6);
      border: 2px solid rgba(168, 216, 234, 0.3);
      border-radius: 12px;
      padding: 16px;
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .stat-icon {
      font-size: 32px;
    }

    .stat-label {
      font-size: 10px;
      color: #6b7280;
      margin: 0 0 4px 0;
      font-weight: 700;
    }

    .stat-value {
      font-size: 20px;
      font-weight: 700;
      color: #1f2937;
      margin: 0;
    }

    .stat-value.positive {
      color: #059669;
    }

    /* Loading/Empty */
    .loading, .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 60px 20px;
      text-align: center;
    }

    .spinner {
      width: 40px;
      height: 40px;
      border: 4px solid rgba(255, 193, 204, 0.3);
      border-top-color: #ffc700;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin-bottom: 16px;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    /* Cards Grid */
    .table-section h3 {
      font-size: 18px;
      font-weight: 700;
      color: #1f2937;
      margin: 0 0 20px 0;
    }

    .cards-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 16px;
    }

    .card-item {
      background: linear-gradient(135deg, #fef8e8 0%, rgba(254, 248, 232, 0.5) 100%);
      border: 2px solid rgba(255, 193, 204, 0.3);
      border-radius: 12px;
      padding: 16px;
      transition: all 0.3s;
      cursor: pointer;
    }

    .card-item:hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 16px rgba(255, 199, 0, 0.2);
      border-color: rgba(255, 199, 0, 0.5);
    }

    .card-header {
      margin-bottom: 12px;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .card-title {
      font-size: 14px;
      font-weight: 700;
      color: #1f2937;
    }

    .card-slug {
      font-size: 11px;
      font-weight: 500;
      color: #3b82f6;
      font-family: 'Courier New', monospace;
      opacity: 0.8;
    }

    .card-date {
      font-size: 10px;
      color: #9ca3af;
      font-weight: 500;
    }

    .card-prices {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 12px;
      padding: 12px;
      background: rgba(255, 255, 255, 0.6);
      border-radius: 8px;
    }

    .price-col {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .price-label {
      font-size: 10px;
      color: #6b7280;
      font-weight: 700;
      text-transform: uppercase;
    }

    .price-value {
      font-size: 16px;
      font-weight: 700;
      color: #475569;
    }

    .price-value.psa {
      color: #2563eb;
    }

    .arrow {
      font-size: 24px;
      color: #ffc700;
      font-weight: 700;
    }

    .card-gain {
      display: flex;
      justify-content: center;
    }

    .gain-badge {
      background: linear-gradient(135deg, rgba(34, 197, 94, 0.2) 0%, rgba(34, 197, 94, 0.1) 100%);
      border: 2px solid rgba(34, 197, 94, 0.4);
      border-radius: 8px;
      padding: 12px 20px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
    }

    .gain-badge.mega {
      background: linear-gradient(135deg, rgba(251, 146, 60, 0.2) 0%, rgba(251, 146, 60, 0.1) 100%);
      border-color: rgba(251, 146, 60, 0.4);
    }

    .gain-percent {
      font-size: 20px;
      font-weight: 700;
      color: #059669;
    }

    .gain-badge.mega .gain-percent {
      color: #ea580c;
    }

    .gain-amount {
      font-size: 13px;
      font-weight: 600;
      color: #6b7280;
    }

    /* Modal */
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.6);
      backdrop-filter: blur(4px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      animation: fadeIn 0.3s;
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    .modal-content {
      background: white;
      border-radius: 16px;
      width: 90%;
      max-width: 600px;
      max-height: 90vh;
      overflow-y: auto;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
      animation: slideUp 0.3s;
    }

    @keyframes slideUp {
      from { transform: translateY(50px); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }

    .modal-header {
      background: linear-gradient(135deg, #ffc700 0%, #ffb700 100%);
      padding: 24px;
      border-radius: 16px 16px 0 0;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .modal-header h2 {
      font-size: 20px;
      font-weight: 700;
      color: #1f2937;
      margin: 0;
    }

    .close-btn {
      background: none;
      border: none;
      font-size: 32px;
      color: #1f2937;
      cursor: pointer;
      line-height: 1;
      padding: 0;
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .close-btn:hover {
      opacity: 0.7;
    }

    .modal-body {
      padding: 24px;
    }

    .info-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 16px;
      margin-bottom: 24px;
    }

    .info-item {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .info-label {
      font-size: 11px;
      font-weight: 700;
      color: #6b7280;
      text-transform: uppercase;
    }

    .info-value {
      font-size: 14px;
      color: #1f2937;
      font-weight: 600;
    }

    .price-comparison {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      margin-bottom: 32px;
      padding: 20px;
      background: #fef8e8;
      border-radius: 12px;
    }

    .price-box {
      flex: 1;
      text-align: center;
      padding: 16px;
      background: white;
      border-radius: 8px;
      border: 2px solid rgba(168, 216, 234, 0.3);
    }

    .price-box.psa {
      border-color: #3b82f6;
    }

    .price-box-label {
      font-size: 11px;
      font-weight: 700;
      color: #6b7280;
      margin: 0 0 8px 0;
      text-transform: uppercase;
    }

    .price-box-value {
      font-size: 24px;
      font-weight: 700;
      color: #1f2937;
      margin: 0;
    }

    .price-box.psa .price-box-value {
      color: #2563eb;
    }

    .arrow-large {
      font-size: 32px;
      color: #ffc700;
      font-weight: 700;
    }

    .gain-stats h3 {
      font-size: 16px;
      font-weight: 700;
      color: #1f2937;
      margin: 0 0 16px 0;
    }

    .stats-row {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 12px;
      margin-bottom: 24px;
    }

    .stat-box {
      padding: 16px;
      background: #fef8e8;
      border-radius: 8px;
      text-align: center;
    }

    .stat-box.highlight {
      background: linear-gradient(135deg, rgba(34, 197, 94, 0.1) 0%, rgba(34, 197, 94, 0.05) 100%);
      border: 2px solid rgba(34, 197, 94, 0.3);
    }

    .stat-box-label {
      font-size: 11px;
      font-weight: 700;
      color: #6b7280;
      margin: 0 0 8px 0;
      text-transform: uppercase;
    }

    .stat-box-value {
      font-size: 20px;
      font-weight: 700;
      color: #059669;
      margin: 0;
    }

    .sales-info {
      padding: 16px;
      background: rgba(59, 130, 246, 0.05);
      border-radius: 8px;
      border: 2px solid rgba(59, 130, 246, 0.2);
    }

    .sales-info h4 {
      font-size: 14px;
      font-weight: 700;
      color: #1f2937;
      margin: 0 0 12px 0;
    }

    .sales-grid {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .sales-item {
      display: flex;
      justify-content: space-between;
      font-size: 13px;
    }

    .sales-label {
      color: #6b7280;
      font-weight: 600;
    }

    .sales-value {
      color: #1f2937;
      font-weight: 700;
    }

    .modal-footer {
      padding: 16px 24px;
      border-top: 1px solid rgba(0, 0, 0, 0.1);
      display: flex;
      justify-content: flex-end;
    }

    .btn-secondary {
      padding: 12px 24px;
      background: #e5e7eb;
      border: none;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 600;
      color: #1f2937;
      cursor: pointer;
      transition: all 0.2s;
    }

    .btn-secondary:hover {
      background: #d1d5db;
    }

    /* Responsive */
    @media (max-width: 768px) {
      .stats-grid, .cards-grid {
        grid-template-columns: 1fr;
      }

      .price-comparison {
        flex-direction: column;
      }

      .arrow-large {
        transform: rotate(90deg);
      }
    }
  `]
})
export class PsaTabComponent implements OnInit {
  loading = signal(true);
  allData = signal<PriceOverview[]>([]);
  searchTerm = signal('');
  selectedCard = signal<CardWithStats | null>(null);

  filteredData = computed(() => {
    const data = this.allData();
    const search = this.searchTerm().toLowerCase().trim();
    if (!search) return data;
    return data.filter(d =>
      d.card_name?.toLowerCase().includes(search) ||
      d.card_slug?.toLowerCase().includes(search)
    );
  });

  uniqueCards = computed(() => {
    const cards = new Set(this.filteredData().map(d => d.card_slug));
    return cards.size;
  });

  avgUngraded = computed(() => {
    const data = this.filteredData();
    if (data.length === 0) return 0;
    return data.reduce((acc, d) => acc + (d.ungraded_price || 0), 0) / data.length;
  });

  avgPSA10 = computed(() => {
    const data = this.filteredData();
    if (data.length === 0) return 0;
    return data.reduce((acc, d) => acc + (d.psa10_price || 0), 0) / data.length;
  });

  premiumPercent = computed(() => {
    const raw = this.avgUngraded();
    const psa = this.avgPSA10();
    if (raw === 0) return 0;
    return ((psa - raw) / raw) * 100;
  });

  topCards = computed(() => {
    const data = this.filteredData();
    const cardMap = new Map<string, PriceOverview>();

    // Group by normalized card name to avoid duplicates
    data.forEach(d => {
      const normalizedName = d.card_name?.toLowerCase().trim() || '';
      const existing = cardMap.get(normalizedName);

      // Keep the most recent entry for each card name
      if (!existing || d.data_coleta > existing.data_coleta) {
        cardMap.set(normalizedName, d);
      }
    });

    return Array.from(cardMap.values())
      .filter(d => d.ungraded_price > 0 && d.psa10_price > 0)
      .map(d => ({
        ...d,
        premium: ((d.psa10_price - d.ungraded_price) / d.ungraded_price) * 100,
        gain: d.psa10_price - d.ungraded_price
      }))
      .sort((a, b) => b.gain - a.gain)
      .slice(0, 20);
  });

  async ngOnInit() {
    await this.loadData();
  }

  async loadData() {
    this.loading.set(true);
    try {
      const { data, error } = await supabase
        .from('pricecharting_overview')
        .select('*')
        .order('data_coleta', { ascending: false });

      if (error) throw error;

      this.allData.set((data as PriceOverview[]) || []);
      console.log(`✅ Loaded ${data?.length || 0} records`);
    } catch (error) {
      console.error('❌ Error:', error);
      this.allData.set([]);
    } finally {
      this.loading.set(false);
    }
  }

  openCardDetail(card: CardWithStats) {
    this.selectedCard.set(card);
  }

  closeCardDetail() {
    this.selectedCard.set(null);
  }

  // Mock data helpers (replace with real data when available)
  getMockSalesQty(): number {
    return Math.floor(Math.random() * 50) + 10;
  }

  getMockLiquidity(): string {
    const rand = Math.random();
    if (rand > 0.7) return 'Alta';
    if (rand > 0.3) return 'Média';
    return 'Baixa';
  }
}
