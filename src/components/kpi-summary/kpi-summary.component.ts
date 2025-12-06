import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TransactionService } from '../../services/transaction.service';

@Component({
  selector: 'app-kpi-summary',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="kpis-grid">
      <!-- Total Investido -->
      <div class="kpi-card kpi-investido" [@fadeInGrow]>
        <div class="kpi-icon">💰</div>
        <div class="kpi-content">
          <p class="kpi-label">TOTAL INVESTIDO</p>
          <p class="kpi-value">R$ {{ formatCurrency(transactionService.totalInvestido()) }}</p>
        </div>
      </div>

      <!-- Total Vendido -->
      <div class="kpi-card kpi-vendido" [@fadeInGrow]>
        <div class="kpi-icon">💵</div>
        <div class="kpi-content">
          <p class="kpi-label">TOTAL VENDIDO</p>
          <p class="kpi-value">R$ {{ formatCurrency(transactionService.totalVendido()) }}</p>
        </div>
      </div>

      <!-- Lucro Líquido -->
      <div class="kpi-card kpi-lucro" 
           [class.positive]="transactionService.lucroLiquido() >= 0"
           [class.negative]="transactionService.lucroLiquido() < 0"
           [@fadeInGrow]>
        <div class="kpi-icon">{{ transactionService.lucroLiquido() >= 0 ? '📈' : '📉' }}</div>
        <div class="kpi-content">
          <p class="kpi-label">LUCRO LÍQUIDO</p>
          <p class="kpi-value" 
             [class.text-pokemon-green]="transactionService.lucroLiquido() >= 0"
             [class.text-pokeball-red]="transactionService.lucroLiquido() < 0">
            {{ transactionService.lucroLiquido() >= 0 ? '+' : '' }}R$ {{ formatCurrency(Math.abs(transactionService.lucroLiquido())) }}
          </p>
        </div>
      </div>

      <!-- ROI -->
      <div class="kpi-card kpi-roi" 
           [class.positive]="transactionService.roi() >= 0"
           [class.negative]="transactionService.roi() < 0"
           [@fadeInGrow]>
        <div class="kpi-icon">📊</div>
        <div class="kpi-content">
          <p class="kpi-label">ROI</p>
          <p class="kpi-value"
             [class.text-pokemon-green]="transactionService.roi() >= 0"
             [class.text-pokeball-red]="transactionService.roi() < 0">
            {{ transactionService.roi() >= 0 ? '+' : '' }}{{ transactionService.roi().toFixed(2) }}%
          </p>
        </div>
      </div>

      <!-- Número de Transações -->
      <div class="kpi-card kpi-total" [@fadeInGrow]>
        <div class="kpi-icon">🔢</div>
        <div class="kpi-content">
          <p class="kpi-label">TRANSAÇÕES</p>
          <p class="kpi-value">{{ transactionService.numeroTransacoes() }}</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .kpis-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 16px;
      margin-bottom: 32px;
    }

    .kpi-card {
      background: linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(254, 248, 232, 0.8) 100%);
      border: 2px solid rgba(255, 199, 0, 0.2);
      border-radius: 20px;
      padding: 28px 24px;
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      gap: 12px;
      box-shadow: 0 6px 20px rgba(255, 193, 204, 0.15),
                  inset 0 1px 0 rgba(255, 255, 255, 0.9);
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      position: relative;
      overflow: hidden;
    }

    .kpi-card::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 4px;
      background: linear-gradient(90deg, #ffc700 0%, #ffc1cc 50%, #a8d8ea 100%);
      opacity: 0;
      transition: opacity 0.3s;
    }

    .kpi-card:hover {
      transform: translateY(-6px) scale(1.02);
      border-color: rgba(255, 199, 0, 0.4);
      box-shadow: 0 12px 30px rgba(255, 193, 204, 0.25),
                  0 6px 15px rgba(255, 199, 0, 0.2);
    }

    .kpi-card:hover::before {
      opacity: 1;
    }

    .kpi-card.positive {
      background: linear-gradient(135deg, rgba(188, 233, 197, 0.2) 0%, rgba(255, 255, 255, 0.95) 100%);
      border-color: rgba(188, 233, 197, 0.4);
    }

    .kpi-card.negative {
      background: linear-gradient(135deg, rgba(255, 107, 107, 0.15) 0%, rgba(255, 255, 255, 0.95) 100%);
      border-color: rgba(255, 107, 107, 0.3);
    }

    .kpi-icon {
      font-size: 48px;
      filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
      animation: bounce 2s ease-in-out infinite;
    }

    @keyframes bounce {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-6px); }
    }

    .kpi-content {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .kpi-label {
      font-size: 11px;
      color: #9ca3af;
      margin: 0;
      font-weight: 800;
      letter-spacing: 1.2px;
      text-transform: uppercase;
    }

    .kpi-value {
      font-size: 36px;
      font-weight: 900;
      margin: 0;
      letter-spacing: -1.5px;
      color: #1f2937;
      text-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
      font-family: 'Inter', -apple-system, system-ui, sans-serif;
    }

    .text-pokemon-green {
      background: linear-gradient(135deg, #059669 0%, #10b981 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .text-pokeball-red {
      background: linear-gradient(135deg, #dc2626 0%, #ef4444 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    /* Responsive */
    @media (max-width: 768px) {
      .kpis-grid {
        grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
        gap: 12px;
      }

      .kpi-card {
        padding: 16px 12px;
      }

      .kpi-icon {
        font-size: 32px;
      }

      .kpi-value {
        font-size: 24px;
      }
      
      .kpi-label {
        font-size: 10px;
      }
    }
  `]
})
export class KpiSummaryComponent {
  transactionService = inject(TransactionService);
  Math = Math;

  formatCurrency(value: number): string {
    return value.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }
}
