import { Component, OnInit, ViewChild, ElementRef, signal, computed, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { supabase } from '../../supabaseClient';

declare const Chart: any;

interface Transaction {
  id: string;
  tipo: 'compra' | 'venda';
  carta: string;
  quantidade: number;
  preco_unitario: number;
  total: number;
  estado: string;
  idioma: string;
  data: string;
  created_at: string;
}

interface KPIs {
  roi: number;
  lucroLiquido: number;
  totalInvestido: number;
  totalVendido: number;
  ticketMedio: number;
  totalTransacoes: number;
}

@Component({
  selector: 'app-transaction-history-page',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="analytics-container">
      <!-- Header -->
      <div class="header">
        <h1>📊 Analytics de Transações</h1>
        <p>Dashboard inteligente de análise de compras e vendas</p>
      </div>

      <!-- Loading -->
      <div *ngIf="loading()" class="loading">
        <div class="spinner"></div>
        <p>Carregando analytics...</p>
      </div>

      <!-- Content -->
      <div *ngIf="!loading()">
        <!-- KPIs -->
        <div class="kpis-grid">
          <div class="kpi-card roi-card">
            <div class="kpi-icon">📈</div>
            <div class="kpi-content">
              <p class="kpi-label">ROI</p>
              <p class="kpi-value" [class.positive]="kpis().roi > 0" [class.negative]="kpis().roi < 0">
                {{ kpis().roi > 0 ? '+' : '' }}{{ kpis().roi | number:'1.1-1' }}%
              </p>
            </div>
          </div>

          <div class="kpi-card">
            <div class="kpi-icon">💰</div>
            <div class="kpi-content">
              <p class="kpi-label">LUCRO LÍQUIDO</p>
              <p class="kpi-value" [class.positive]="kpis().lucroLiquido > 0">
                R$ {{ kpis().lucroLiquido | number:'1.2-2' }}
              </p>
            </div>
          </div>

          <div class="kpi-card">
            <div class="kpi-icon">📥</div>
            <div class="kpi-content">
              <p class="kpi-label">TOTAL INVESTIDO</p>
              <p class="kpi-value">R$ {{ kpis().totalInvestido | number:'1.2-2' }}</p>
            </div>
          </div>

          <div class="kpi-card">
            <div class="kpi-icon">📤</div>
            <div class="kpi-content">
              <p class="kpi-label">TOTAL VENDIDO</p>
              <p class="kpi-value">R$ {{ kpis().totalVendido | number:'1.2-2' }}</p>
            </div>
          </div>

          <div class="kpi-card">
            <div class="kpi-icon">💳</div>
            <div class="kpi-content">
              <p class="kpi-label">TICKET MÉDIO</p>
              <p class="kpi-value">R$ {{ kpis().ticketMedio | number:'1.2-2' }}</p>
            </div>
          </div>

          <div class="kpi-card">
            <div class="kpi-icon">🔢</div>
            <div class="kpi-content">
              <p class="kpi-label">TOTAL TRANSAÇÕES</p>
              <p class="kpi-value">{{ kpis().totalTransacoes }}</p>
            </div>
          </div>
        </div>

        <!-- Button to show table -->
        <div class="table-toggle">
          <button (click)="showTable.set(!showTable())" class="toggle-btn">
            {{ showTable() ? '📊 Voltar para Analytics' : '📋 Ver Lista Completa de Transações' }}
          </button>
        </div>

        <!-- Analytics View -->
        <div *ngIf="!showTable()">
          <!-- Insights -->
          <h2 class="section-title">💡 Insights Principais</h2>
          <div class="insights-grid">
            <div class="insight-card">
              <div class="insight-header">
                <span>🏆</span>
                <span>Carta Mais Lucrativa</span>
              </div>
              <div class="insight-body">
                <p class="insight-name">{{ topCard().name || 'N/A' }}</p>
                <p class="insight-value positive">+R$ {{ topCard().profit | number:'1.2-2' }}</p>
              </div>
            </div>

            <div class="insight-card">
              <div class="insight-header">
                <span>⚠️</span>
                <span>Maior Prejuízo</span>
              </div>
              <div class="insight-body">
                <p class="insight-name">{{ worstCard().name || 'N/A' }}</p>
                <p class="insight-value negative">R$ {{ worstCard().loss | number:'1.2-2' }}</p>
              </div>
            </div>

            <div class="insight-card">
              <div class="insight-header">
                <span>🎯</span>
                <span>Padrão de Compra</span>
              </div>
              <div class="insight-body">
                <p class="insight-name">Estado: {{ patterns().estadoMaisComprado }}</p>
                <p class="insight-name">Idioma: {{ patterns().idiomaMaisComprado }}</p>
              </div>
            </div>

            <div class="insight-card">
              <div class="insight-header">
                <span>⏰</span>
                <span>Horário Comum</span>
              </div>
              <div class="insight-body">
                <p class="insight-name">{{ patterns().horarioComum }}</p>
              </div>
            </div>
          </div>

          <!-- Charts -->
          <h2 class="section-title">📊 Gráficos de Análise</h2>
          <div class="charts-grid">
            <div class="chart-card">
              <h3>Compras vs Vendas por Mês</h3>
              <canvas #buySellChart></canvas>
            </div>

            <div class="chart-card">
              <h3>Distribuição por Idioma</h3>
              <canvas #languageChart></canvas>
            </div>

            <div class="chart-card">
              <h3>Distribuição por Estado</h3>
              <canvas #conditionChart></canvas>
            </div>
          </div>

          <!-- Alerts -->
          <h2 class="section-title">⚡ Alertas Inteligentes</h2>
          <div class="alerts-list">
            <div *ngFor="let alert of alerts()" class="alert" [class]="'alert-' + alert.tipo">
              <span class="alert-icon">{{ alert.icon }}</span>
              <div class="alert-content">
                <p class="alert-title">{{ alert.titulo }}</p>
                <p class="alert-desc">{{ alert.descricao }}</p>
              </div>
            </div>
            <div *ngIf="alerts().length === 0" class="no-alerts">
              <span>✅</span>
              <p>Nenhum alerta no momento. Tudo está sob controle!</p>
            </div>
          </div>
        </div>

        <!-- Table View -->
        <div *ngIf="showTable()" class="table-view">
          <div class="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Tipo</th>
                  <th>Carta</th>
                  <th>Qtd</th>
                  <th>Preço Unit.</th>
                  <th>Total</th>
                  <th>Estado</th>
                  <th>Idioma</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let t of transactions()">
                  <td>{{ formatDate(t.data) }}</td>
                  <td>
                    <span class="badge" [class.badge-compra]="t.tipo === 'compra'" [class.badge-venda]="t.tipo === 'venda'">
                      {{ t.tipo }}
                    </span>
                  </td>
                  <td class="card-name">{{ t.carta }}</td>
                  <td>{{ t.quantidade }}</td>
                  <td>R$ {{ t.preco_unitario | number:'1.2-2' }}</td>
                  <td class="total">R$ {{ t.total | number:'1.2-2' }}</td>
                  <td>{{ t.estado || '-' }}</td>
                  <td>{{ t.idioma || '-' }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .analytics-container {
      background: rgba(255, 255, 255, 0.95);
      border-radius: 16px;
      padding: 24px;
      color: #1f2937;
    }

    .header h1 {
      font-size: 28px;
      font-weight: 700;
      color: #cc9f00;
      margin: 0 0 8px 0;
    }

    .header p {
      font-size: 14px;
      color: #6b7280;
      margin: 0 0 24px 0;
    }

    .loading {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 60px;
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

    .kpis-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 16px;
      margin-bottom: 24px;
    }

    .kpi-card {
      background: linear-gradient(135deg, #fef8e8 0%, rgba(254, 248, 232, 0.5) 100%);
      border: 2px solid rgba(168, 216, 234, 0.3);
      border-radius: 12px;
      padding: 20px;
      display: flex;
      align-items: center;
      gap: 12px;
      transition: all 0.3s;
    }

    .kpi-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 16px rgba(255, 199, 0, 0.15);
    }

    .roi-card {
      background: linear-gradient(135deg, #ffc700 0%, #ffa500 100%);
      border-color: #ff8c00;
    }

    .roi-card .kpi-label,
    .roi-card .kpi-value {
      color: #1f2937;
    }

    .kpi-icon {
      font-size: 32px;
    }

    .kpi-label {
      font-size: 10px;
      font-weight: 700;
      color: #6b7280;
      margin: 0 0 4px 0;
    }

    .kpi-value {
      font-size: 20px;
      font-weight: 700;
      color: #1f2937;
      margin: 0;
    }

    .kpi-value.positive {
      color: #059669;
    }

    .kpi-value.negative {
      color: #dc2626;
    }

    .table-toggle {
      text-align: center;
      margin: 24px 0;
    }

    .toggle-btn {
      background: linear-gradient(135deg, #ffc700 0%, #ffb700 100%);
      color: #1f2937;
      font-weight: 700;
      padding: 12px 24px;
      border-radius: 8px;
      border: none;
      cursor: pointer;
      transition: all 0.3s;
    }

    .toggle-btn:hover {
      transform: scale(1.05);
      box-shadow: 0 4px 12px rgba(255, 199, 0, 0.4);
    }

    .section-title {
      font-size: 20px;
      font-weight: 700;
      color: #1f2937;
      margin: 32px 0 16px 0;
    }

    .insights-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 16px;
      margin-bottom: 24px;
    }

    .insight-card {
      background: rgba(254, 248, 232, 0.6);
      border: 2px solid rgba(255, 193, 204, 0.3);
      border-radius: 12px;
      padding: 16px;
    }

    .insight-header {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 12px;
      font-weight: 700;
      color: #6b7280;
      margin-bottom: 12px;
    }

    .insight-name {
      font-size: 14px;
      font-weight: 600;
      color: #1f2937;
      margin: 0 0 4px 0;
    }

    .insight-value {
      font-size: 18px;
      font-weight: 700;
      margin: 0;
    }

    .charts-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 16px;
      margin-bottom: 24px;
    }

    .chart-card {
      background: #fef8e8;
      border: 2px solid rgba(168, 216, 234, 0.3);
      border-radius: 12px;
      padding: 20px;
      height: 350px;
      display: flex;
      flex-direction: column;
    }

    .chart-card h3 {
      font-size: 14px;
      font-weight: 700;
      color: #1f2937;
      margin: 0 0 16px 0;
      flex-shrink: 0;
    }

    .chart-card canvas {
      flex: 1;
      max-height: 280px;
    }

    .alerts-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .alert {
      display: flex;
      align-items: start;
      gap: 12px;
      padding: 16px;
      border-radius: 8px;
      border-left: 4px solid;
    }

    .alert-warning {
      background: rgba(251, 191, 36, 0.1);
      border-color: #f59e0b;
    }

    .alert-danger {
      background: rgba(239, 68, 68, 0.1);
      border-color: #dc2626;
    }

    .alert-icon {
      font-size: 24px;
    }

    .alert-title {
      font-weight: 700;
      color: #1f2937;
      margin: 0 0 4px 0;
    }

    .alert-desc {
      font-size: 13px;
      color: #6b7280;
      margin: 0;
    }

    .no-alerts {
      text-align: center;
      padding: 40px;
      color: #6b7280;
    }

    .no-alerts span {
      font-size: 48px;
      display: block;
      margin-bottom: 12px;
    }

    .table-wrapper {
      overflow-x: auto;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      background: #fef8e8;
    }

    thead {
      background: linear-gradient(135deg, #ffc700 0%, #ffb700 100%);
    }

    th {
      padding: 12px;
      text-align: left;
      font-size: 11px;
      font-weight: 700;
      color: #1f2937;
    }

    td {
      padding: 12px;
      border-top: 1px solid rgba(255, 193, 204, 0.2);
      font-size: 13px;
    }

    .badge {
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
    }

    .badge-compra {
      background: rgba(59, 130, 246, 0.15);
      color: #2563eb;
    }

    .badge-venda {
      background: rgba(34, 197, 94, 0.15);
      color: #059669;
    }

    .card-name {
      font-weight: 600;
    }

    .total {
      font-weight: 700;
    }

    @media (max-width: 768px) {
      .kpis-grid,
      .insights-grid,
      .charts-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class TransactionHistoryPageComponent implements OnInit, AfterViewInit {
  @ViewChild('buySellChart') buySellCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('languageChart') languageCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('conditionChart') conditionCanvas!: ElementRef<HTMLCanvasElement>;

  loading = signal(true);
  transactions = signal<Transaction[]>([]);
  showTable = signal(false);

  kpis = computed(() => this.calculateKPIs());
  topCard = computed(() => this.getTopCard());
  worstCard = computed(() => this.getWorstCard());
  patterns = computed(() => this.getPatterns());
  alerts = computed(() => this.getAlerts());

  private charts: any[] = [];

  async ngOnInit() {
    await this.loadTransactions();
  }

  ngAfterViewInit() {
    if (this.transactions().length > 0) {
      setTimeout(() => this.renderCharts(), 100);
    }
  }

  async loadTransactions() {
    this.loading.set(true);
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .order('data', { ascending: false });

      if (error) throw error;

      this.transactions.set((data as Transaction[]) || []);
      console.log(`✅ Loaded ${data?.length || 0} transactions`);

      setTimeout(() => this.renderCharts(), 100);
    } catch (error) {
      console.error('❌ Error loading transactions:', error);
      this.transactions.set([]);
    } finally {
      this.loading.set(false);
    }
  }

  calculateKPIs(): KPIs {
    const txs = this.transactions();
    const compras = txs.filter(t => t.tipo === 'compra');
    const vendas = txs.filter(t => t.tipo === 'venda');

    const totalInvestido = compras.reduce((sum, t) => sum + t.total, 0);
    const totalVendido = vendas.reduce((sum, t) => sum + t.total, 0);
    const lucroLiquido = totalVendido - totalInvestido;
    const roi = totalInvestido > 0 ? (lucroLiquido / totalInvestido) * 100 : 0;
    const ticketMedio = txs.length > 0 ? txs.reduce((sum, t) => sum + t.total, 0) / txs.length : 0;

    return {
      roi,
      lucroLiquido,
      totalInvestido,
      totalVendido,
      ticketMedio,
      totalTransacoes: txs.length
    };
  }

  getTopCard() {
    const txs = this.transactions();
    if (txs.length === 0) return { name: 'N/A', profit: 0 };

    // Group by card to calculate profit
    const cardProfits = new Map<string, number>();
    txs.forEach(t => {
      const current = cardProfits.get(t.carta) || 0;
      if (t.tipo === 'venda') {
        cardProfits.set(t.carta, current + t.total);
      } else {
        cardProfits.set(t.carta, current - t.total);
      }
    });

    const sorted = Array.from(cardProfits.entries())
      .sort((a, b) => b[1] - a[1]);

    return sorted.length > 0
      ? { name: sorted[0][0], profit: sorted[0][1] }
      : { name: 'N/A', profit: 0 };
  }

  getWorstCard() {
    const txs = this.transactions();
    if (txs.length === 0) return { name: 'N/A', loss: 0 };

    // Group by card to calculate profit
    const cardProfits = new Map<string, number>();
    txs.forEach(t => {
      const current = cardProfits.get(t.carta) || 0;
      if (t.tipo === 'venda') {
        cardProfits.set(t.carta, current + t.total);
      } else {
        cardProfits.set(t.carta, current - t.total);
      }
    });

    const sorted = Array.from(cardProfits.entries())
      .sort((a, b) => a[1] - b[1]);

    return sorted.length > 0
      ? { name: sorted[0][0], loss: sorted[0][1] }
      : { name: 'N/A', loss: 0 };
  }

  getPatterns() {
    const txs = this.transactions();

    const estados = txs.map(t => t.estado).filter(Boolean);
    const estadoMaisComprado = this.getMostCommon(estados) || 'N/A';

    const idiomas = txs.map(t => t.idioma).filter(Boolean);
    const idiomaMaisComprado = this.getMostCommon(idiomas) || 'N/A';

    // Calculate most common hour
    const hours = txs.map(t => {
      const hour = new Date(t.created_at).getHours();
      return `${hour}h`;
    });
    const mostCommonHour = this.getMostCommon(hours) || 'N/A';

    return {
      horarioComum: mostCommonHour,
      estadoMaisComprado,
      idiomaMaisComprado,
      colecoesRecorrentes: []
    };
  }

  getAlerts() {
    const alerts: any[] = [];
    const kpis = this.kpis();

    if (kpis.roi < -10) {
      alerts.push({
        tipo: 'danger',
        icon: '⚠️',
        titulo: 'ROI Negativo',
        descricao: `Seu ROI está em ${kpis.roi.toFixed(1)}%. Revise sua estratégia de compra/venda.`
      });
    }

    if (kpis.ticketMedio > 500) {
      alerts.push({
        tipo: 'warning',
        icon: '💰',
        titulo: 'Ticket Médio Alto',
        descricao: `Ticket médio de R$ ${kpis.ticketMedio.toFixed(2)} está acima da média.`
      });
    }

    return alerts;
  }

  getMostCommon(arr: string[]): string | null {
    if (arr.length === 0) return null;
    const counts = arr.reduce((acc, val) => {
      acc[val] = (acc[val] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    return Object.keys(counts).reduce((a, b) => counts[a] > counts[b] ? a : b);
  }

  renderCharts() {
    if (!this.buySellCanvas || !this.languageCanvas || !this.conditionCanvas) return;

    this.charts.forEach(chart => chart.destroy());
    this.charts = [];

    const txs = this.transactions();

    // Buy/Sell Chart - REAL DATA
    const ctx1 = this.buySellCanvas.nativeElement.getContext('2d');
    if (ctx1) {
      // Group by month
      const monthlyData = new Map<string, { compras: number; vendas: number }>();

      txs.forEach(t => {
        const month = new Date(t.data).toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
        if (!monthlyData.has(month)) {
          monthlyData.set(month, { compras: 0, vendas: 0 });
        }
        const data = monthlyData.get(month)!;
        if (t.tipo === 'compra') {
          data.compras++;
        } else {
          data.vendas++;
        }
      });

      const sortedMonths = Array.from(monthlyData.keys()).sort((a, b) => {
        return new Date(a).getTime() - new Date(b).getTime();
      });

      this.charts.push(new Chart(ctx1, {
        type: 'bar',
        data: {
          labels: sortedMonths,
          datasets: [
            {
              label: 'Compras',
              data: sortedMonths.map(m => monthlyData.get(m)!.compras),
              backgroundColor: 'rgba(59, 130, 246, 0.8)',
              borderColor: 'rgba(59, 130, 246, 1)',
              borderWidth: 1
            },
            {
              label: 'Vendas',
              data: sortedMonths.map(m => monthlyData.get(m)!.vendas),
              backgroundColor: 'rgba(34, 197, 94, 0.8)',
              borderColor: 'rgba(34, 197, 94, 1)',
              borderWidth: 1
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: true,
              position: 'top',
              labels: {
                padding: 10,
                font: { size: 11 }
              }
            },
            tooltip: {
              backgroundColor: 'rgba(0, 0, 0, 0.8)',
              padding: 12,
              titleFont: { size: 12 },
              bodyFont: { size: 11 }
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                precision: 0,
                font: { size: 10 }
              },
              grid: {
                color: 'rgba(0, 0, 0, 0.05)'
              }
            },
            x: {
              ticks: {
                font: { size: 10 }
              },
              grid: {
                display: false
              }
            }
          }
        }
      }));
    }

    // Language Chart
    const idiomas = txs.map(t => t.idioma).filter(Boolean);
    const idiomasCounts = idiomas.reduce((acc, val) => {
      acc[val] = (acc[val] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const ctx2 = this.languageCanvas.nativeElement.getContext('2d');
    if (ctx2) {
      this.charts.push(new Chart(ctx2, {
        type: 'doughnut',
        data: {
          labels: Object.keys(idiomasCounts),
          datasets: [{
            data: Object.values(idiomasCounts),
            backgroundColor: [
              'rgba(59, 130, 246, 0.8)',
              'rgba(16, 185, 129, 0.8)',
              'rgba(245, 158, 11, 0.8)',
              'rgba(239, 68, 68, 0.8)',
              'rgba(139, 92, 246, 0.8)'
            ],
            borderColor: '#fff',
            borderWidth: 2
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'bottom',
              labels: {
                padding: 15,
                font: { size: 11 }
              }
            },
            tooltip: {
              backgroundColor: 'rgba(0, 0, 0, 0.8)',
              padding: 12
            }
          }
        }
      }));
    }

    // Condition Chart
    const estados = txs.map(t => t.estado).filter(Boolean);
    const estadosCounts = estados.reduce((acc, val) => {
      acc[val] = (acc[val] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const ctx3 = this.conditionCanvas.nativeElement.getContext('2d');
    if (ctx3) {
      this.charts.push(new Chart(ctx3, {
        type: 'bar',
        data: {
          labels: Object.keys(estadosCounts),
          datasets: [{
            label: 'Quantidade',
            data: Object.values(estadosCounts),
            backgroundColor: 'rgba(251, 146, 60, 0.8)',
            borderColor: 'rgba(251, 146, 60, 1)',
            borderWidth: 1
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          indexAxis: 'x',
          plugins: {
            legend: { display: false },
            tooltip: {
              backgroundColor: 'rgba(0, 0, 0, 0.8)',
              padding: 12
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                precision: 0,
                font: { size: 10 }
              },
              grid: {
                color: 'rgba(0, 0, 0, 0.05)'
              }
            },
            x: {
              ticks: {
                font: { size: 10 }
              },
              grid: {
                display: false
              }
            }
          }
        }
      }));
    }
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('pt-BR');
  }
}
