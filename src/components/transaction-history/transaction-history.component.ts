import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { supabase } from '../../supabaseClient';
import { Transaction, TransactionType, TransactionSummary, TransactionFilters } from './transaction-history.types';

@Component({
  selector: 'app-transaction-history',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="transaction-container">
      <div class="header">
        <h1 class="title">📜 Histórico de Transações</h1>
        <p class="subtitle">Acompanhe todas as suas compras, vendas e trades</p>
      </div>

      <!-- Summary KPIs -->
      <div class="kpis-row" *ngIf="!loading()">
        <div class="kpi-card spent">
          <div class="kpi-icon">💸</div>
          <div class="kpi-content">
            <p class="kpi-label">TOTAL GASTO</p>
            <p class="kpi-value">R$ {{ formatPrice(summary().totalGasto) }}</p>
            <p class="kpi-sub">{{ summary().numCompras }} compras</p>
          </div>
        </div>
        
        <div class="kpi-card earned">
          <div class="kpi-icon">💰</div>
          <div class="kpi-content">
            <p class="kpi-label">TOTAL VENDIDO</p>
            <p class="kpi-value">R$ {{ formatPrice(summary().totalVendido) }}</p>
            <p class="kpi-sub">{{ summary().numVendas }} vendas</p>
          </div>
        </div>
        
        <div class="kpi-card profit" [class.negative]="summary().lucroLiquido < 0">
          <div class="kpi-icon">{{ summary().lucroLiquido >= 0 ? '📈' : '📉' }}</div>
          <div class="kpi-content">
            <p class="kpi-label">LUCRO LÍQUIDO</p>
            <p class="kpi-value">R$ {{ formatPrice(Math.abs(summary().lucroLiquido)) }}</p>
            <p class="kpi-sub">{{ summary().lucroLiquido >= 0 ? 'Positivo' : 'Negativo' }}</p>
          </div>
        </div>
        
        <div class="kpi-card total">
          <div class="kpi-icon">📊</div>
          <div class="kpi-content">
            <p class="kpi-label">TRANSAÇÕES</p>
            <p class="kpi-value">{{ summary().totalTransacoes }}</p>
            <p class="kpi-sub">{{ summary().numTrades }} trades</p>
          </div>
        </div>
      </div>

      <!-- Filters -->
      <div class="filters-section">
        <div class="filter-group">
          <label>TIPO</label>
          <select 
            [ngModel]="filters().type" 
            (ngModelChange)="updateFilter('type', $event)"
            class="filter-select"
          >
            <option value="ALL">Todos</option>
            <option value="COMPRA">Compras</option>
            <option value="VENDA">Vendas</option>
            <option value="TRADE">Trades</option>
          </select>
        </div>

        <div class="filter-group">
          <label>BUSCAR CARTA</label>
          <input 
            type="text"
            [ngModel]="filters().carta"
            (ngModelChange)="updateFilter('carta', $event)"
            class="filter-input"
            placeholder="Nome da carta..."
          />
        </div>

        <div class="filter-group">
          <label>DATA INÍCIO</label>
          <input 
            type="date"
            [ngModel]="filters().dateStart"
            (ngModelChange)="updateFilter('dateStart', $event)"
            class="filter-input"
          />
        </div>

        <div class="filter-group">
          <label>DATA FIM</label>
          <input 
            type="date"
            [ngModel]="filters().dateEnd"
            (ngModelChange)="updateFilter('dateEnd', $event)"
            class="filter-input"
          />
        </div>

        <button class="export-btn" (click)="exportCSV()" [disabled]="filteredTransactions().length === 0">
          📥 Exportar CSV
        </button>
      </div>

      <!-- Loading State -->
      <div class="loading" *ngIf="loading()">
        <div class="spinner"></div>
        <p>Carregando transações...</p>
      </div>

      <!-- Empty State -->
      <div class="empty-state" *ngIf="!loading() && filteredTransactions().length === 0">
        <p>{{ filters().type !==  'ALL' || filters().carta ? 'Nenhuma transação encontrada com esses filtros' : 'Nenhuma transação registrada ainda' }}</p>
      </div>

      <!-- Transactions Table -->
      <div class="table-wrapper" *ngIf="!loading() && filteredTransactions().length > 0">
        <table class="transactions-table">
          <thead>
            <tr>
              <th>DATA</th>
              <th>TIPO</th>
              <th>CARTA</th>
              <th>QTD</th>
              <th>PREÇO UNIT.</th>
              <th>TOTAL</th>
              <th>ESTADO</th>
              <th>IDIOMA</th>
              <th>NOTAS</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let transaction of paginatedTransactions()" class="transaction-row">
              <td>{{ formatDate(transaction.data) }}</td>
              <td>
                <span class="type-badge" [class]="'badge-' + getBadgeClass(transaction.tipo)">
                  {{ getTypeLabel(transaction.tipo) }}
                </span>
              </td>
              <td class="carta-cell">{{ transaction.carta }}</td>
              <td>{{ transaction.quantidade }}</td>
              <td>R$ {{ formatPrice(transaction.preco_unitario) }}</td>
              <td class="total-cell">R$ {{ formatPrice(transaction.total) }}</td>
              <td>
                <span class="condition-badge" *ngIf="transaction.estado">{{ transaction.estado }}</span>
                <span *ngIf="!transaction.estado">-</span>
              </td>
              <td>{{ transaction.idioma || '-' }}</td>
              <td class="notas-cell">{{ transaction.notas || '-' }}</td>
            </tr>
          </tbody>
        </table>

        <!-- Pagination -->
        <div class="pagination" *ngIf="totalPages() > 1">
          <button 
            class="page-btn"
            (click)="currentPage.set(currentPage() - 1)"
            [disabled]="currentPage() === 1"
          >
            ← Anterior
          </button>
          <span class="page-info">Página {{ currentPage() }} de {{ totalPages() }}</span>
          <button 
            class="page-btn"
            (click)="currentPage.set(currentPage() + 1)"
            [disabled]="currentPage() === totalPages()"
          >
            Próxima →
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .transaction-container {
      background: #0a0e1a;
      min-height: 100vh;
      padding: 24px;
      color: #fff;
      max-width: 1600px;
      margin: 0 auto;
    }

    .header {
      margin-bottom: 32px;
    }

    .title {
      font-size: 32px;
      font-weight: 700;
      color: #22c55e;
      margin: 0 0 8px 0;
      letter-spacing: -0.5px;
    }

    .subtitle {
      font-size: 14px;
      color: #94a3b8;
      margin: 0;
    }

    .kpis-row {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 20px;
      margin-bottom: 32px;
    }

    .kpi-card {
      background: #0f172a;
      border: 1px solid #1e293b;
      border-radius: 16px;
      padding: 24px;
      display: flex;
      align-items: center;
      gap: 16px;
      transition: transform 0.2s;
    }

    .kpi-card:hover {
      transform: translateY(-2px);
      border-color: #334155;
    }

    .kpi-card.spent { border-left: 3px solid #ef4444; }
    .kpi-card.earned { border-left: 3px solid #22c55e; }
    .kpi-card.profit { border-left: 3px solid #22c55e; }
    .k pi-card.profit.negative { border-left: 3px solid #ef4444; }
    .kpi-card.total { border-left: 3px solid #3b82f6; }

    .kpi-icon {
      font-size: 36px;
    }

    .kpi-content {
      flex: 1;
    }

    .kpi-label {
      font-size: 11px;
      color: #64748b;
      margin: 0 0 4px 0;
      font-weight: 700;
      letter-spacing: 1px;
    }

    .kpi-value {
      font-size: 24px;
      font-weight: 800;
      color: #f1f5f9;
      margin: 0 0 4px 0;
    }

    .kpi-sub {
      font-size: 12px;
      color: #94a3b8;
      margin: 0;
    }

    .filters-section {
      background: #0f172a;
      border: 1px solid #1e293b;
      border-radius: 16px;
      padding: 24px;
      margin-bottom: 24px;
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 16px;
      align-items: end;
    }

    .filter-group {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .filter-group label {
      font-size: 11px;
      font-weight: 700;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 1px;
    }

    .filter-select, .filter-input {
      background: #1e293b;
      border: 1px solid #334155;
      border-radius: 8px;
      padding: 10px 12px;
      color: #f8fafc;
      font-size: 14px;
      transition: all 0.2s;
    }

    .filter-select:hover, .filter-input:hover {
      border-color: #475569;
    }

    .filter-select:focus, .filter-input:focus {
      border-color: #22c55e;
      box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.1);
      outline: none;
    }

    .export-btn {
      background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
      border: none;
      border-radius: 8px;
      padding: 10px 20px;
      color: white;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
      font-size: 14px;
    }

    .export-btn:hover:not(:disabled) {
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(34, 197, 94, 0.3);
    }

    .export-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .loading {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 80px 20px;
      color: #64748b;
    }

    .spinner {
      width: 48px;
      height: 48px;
      border: 4px solid #1e293b;
      border-top-color: #22c55e;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin-bottom: 16px;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .empty-state {
      text-align: center;
      padding: 80px 20px;
      color: #64748b;
      font-size: 16px;
    }

    .table-wrapper {
      background: #0f172a;
      border: 1px solid #1e293b;
      border-radius: 16px;
      overflow: hidden;
    }

    .transactions-table {
      width: 100%;
      border-collapse: collapse;
    }

    .transactions-table thead {
      background: #1e293b;
    }

    .transactions-table th {
      padding: 16px;
      text-align: left;
      font-size: 11px;
      font-weight: 700;
      color: #94a3b8;
      text-transform: uppercase;
      letter-spacing: 1px;
      border-bottom: 1px solid #334155;
    }

    .transaction-row {
      border-bottom: 1px solid #1e293b;
      transition: background 0.2s;
    }

    .transaction-row:hover {
      background: #1e293b;
    }

    .transactions-table td {
      padding: 16px;
      font-size: 14px;
      color: #e2e8f0;
    }

    .type-badge {
      padding: 4px 12px;
      border-radius: 6px;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
    }

    .badge-buy {
      background: rgba(59, 130, 246, 0.1);
      color: #3b82f6;
      border: 1px solid rgba(59, 130, 246, 0.2);
    }

    .badge-sell {
      background: rgba(34, 197, 94, 0.1);
      color: #22c55e;
      border: 1px solid rgba(34, 197, 94, 0.2);
    }

    .badge-trade {
      background: rgba(168, 85, 247, 0.1);
      color: #a855f7;
      border: 1px solid rgba(168, 85, 247, 0.2);
    }

    .condition-badge {
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 11px;
      font-weight: 600;
      background: rgba(100, 116, 139, 0.1);
      color: #94a3b8;
      border: 1px solid rgba(100, 116, 139, 0.2);
    }

    .carta-cell {
      font-weight: 600;
      color: #f1f5f9;
    }

    .total-cell {
      font-weight: 700;
      color: #22c55e;
    }

    .notas-cell {
      font-size: 13px;
      color: #94a3b8;
      font-style: italic;
      max-width: 200px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .pagination {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 16px;
      padding: 24px;
      border-top: 1px solid #1e293b;
    }

    .page-btn {
      background: #1e293b;
      border: 1px solid #334155;
      border-radius: 8px;
      padding: 8px 16px;
      color: #f8fafc;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
    }

    .page-btn:hover:not(:disabled) {
      background: #334155;
      border-color: #475569;
    }

    .page-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .page-info {
      color: #94a3b8;
      font-size: 14px;
      font-weight: 500;
    }

    @media (max-width: 1024px) {
      .kpis-row {
        grid-template-columns: repeat(2, 1fr);
      }

      .filters-section {
        grid-template-columns: 1fr;
      }

      .table-wrapper {
        overflow-x: auto;
      }

      .transactions-table {
        min-width: 800px;
      }
    }
  `]
})
export class TransactionHistoryComponent implements OnInit {
  Math = Math;

  // Signals
  loading = signal(true);
  allTransactions = signal<Transaction[]>([]);
  filters = signal<TransactionFilters>({
    type: 'ALL',
    carta: '',
    dateStart: '',
    dateEnd: ''
  });
  currentPage = signal(1);
  itemsPerPage = 20;

  // Computed
  filteredTransactions = computed(() => {
    let transactions = this.allTransactions();
    const f = this.filters();

    // Filter by type
    if (f.type !== 'ALL') {
      transactions = transactions.filter(t => t.tipo === f.type);
    }

    // Filter by carta
    if (f.carta) {
      const searchTerm = f.carta.toLowerCase();
      transactions = transactions.filter(t => t.carta.toLowerCase().includes(searchTerm));
    }

    // Filter by date range
    if (f.dateStart) {
      transactions = transactions.filter(t => t.data >= f.dateStart);
    }
    if (f.dateEnd) {
      transactions = transactions.filter(t => t.data <= f.dateEnd);
    }

    return transactions;
  });

  summary = computed((): TransactionSummary => {
    const transactions = this.allTransactions();

    const totalGasto = transactions
      .filter(t => t.tipo === 'COMPRA')
      .reduce((sum, t) => sum + t.total, 0);

    const totalVendido = transactions
      .filter(t => t.tipo === 'VENDA')
      .reduce((sum, t) => sum + t.total, 0);

    const lucroLiquido = totalVendido - totalGasto;

    return {
      totalGasto,
      totalVendido,
      lucroLiquido,
      totalTransacoes: transactions.length,
      numCompras: transactions.filter(t => t.tipo === 'COMPRA').length,
      numVendas: transactions.filter(t => t.tipo === 'VENDA').length,
      numTrades: transactions.filter(t => t.tipo === 'TRADE').length
    };
  });

  totalPages = computed(() => {
    return Math.ceil(this.filteredTransactions().length / this.itemsPerPage);
  });

  paginatedTransactions = computed(() => {
    const start = (this.currentPage() - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    return this.filteredTransactions().slice(start, end);
  });

  async ngOnInit() {
    await this.loadTransactions();
  }

  async loadTransactions() {
    console.log('📥 [Transaction History] Carregando transações...');
    this.loading.set(true);
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .order('data', { ascending: false });

      if (error) {
        console.error('❌ [Transaction History] Erro ao carregar transações:', error);
        this.loading.set(false);
        return;
      }

      console.log('✅ [Transaction History] Transações carregadas:', data?.length || 0);
      this.allTransactions.set((data as Transaction[]) || []);
      this.loading.set(false);
    } catch (e) {
      console.error('❌ [Transaction History] Exceção ao carregar transações:', e);
      this.loading.set(false);
    }
  }

  // Método público para recarregar dados (chamado pelo AppComponent)
  async refresh() {
    console.log('🔄 [Transaction History] Refresh solicitado');
    await this.loadTransactions();
  }

  updateFilter(key: keyof TransactionFilters, value: any) {
    this.filters.set({ ...this.filters(), [key]: value });
    this.currentPage.set(1); // Reset to first page when filtering
  }

  formatPrice(value: number): string {
    return value.toFixed(2).replace('.', ',');
  }

  formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString('pt-BR');
  }

  getTypeLabel(type: TransactionType): string {
    const labels = {
      'COMPRA': 'Compra',
      'VENDA': 'Venda',
      'TRADE': 'Trade'
    };
    return labels[type];
  }

  getBadgeClass(type: TransactionType): string {
    const classes = {
      'COMPRA': 'buy',
      'VENDA': 'sell',
      'TRADE': 'trade'
    };
    return classes[type];
  }

  exportCSV() {
    const transactions = this.filteredTransactions();

    const csv = [
      ['Data', 'Tipo', 'Carta', 'Quantidade', 'Preço Unitário', 'Total', 'Estado', 'Idioma', 'Notas'].join(','),
      ...transactions.map(t => [
        this.formatDate(t.data),
        this.getTypeLabel(t.tipo),
        `"${t.carta}"`,
        t.quantidade,
        t.preco_unitario,
        t.total,
        t.estado || '',
        t.idioma || '',
        `"${t.notas || ''}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transacoes-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  }
}
