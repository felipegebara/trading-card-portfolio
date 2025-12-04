import { Component, OnInit, signal, computed, effect, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { supabase } from '../../supabaseClient';

declare const d3: any;

@Component({
  selector: 'app-portfolio-performance',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="performance-container">
      <div class="header">
        <h2 class="title">📈 Performance do Portfólio</h2>
        <p class="subtitle">Acompanhe a valorização das suas cartas ao longo do tempo</p>
      </div>

      <!-- Filters -->
      <div class="filters-row">
        <div class="filter-group">
          <label>CARTA</label>
          <select [ngModel]="selectedCard()" (ngModelChange)="selectedCard.set($event)" class="filter-select">
            <option value="" disabled>Selecione uma carta</option>
            <option *ngFor="let card of availableCards()" [value]="card">{{ card }}</option>
          </select>
        </div>

        <div class="filter-group">
          <label>ESTADO</label>
          <select [ngModel]="selectedCondition()" (ngModelChange)="selectedCondition.set($event)" class="filter-select">
            <option value="ALL">Todos</option>
            <option *ngFor="let cond of conditions" [value]="cond">{{ cond }}</option>
          </select>
        </div>

        <div class="filter-group">
          <label>IDIOMA</label>
          <select [ngModel]="selectedLanguage()" (ngModelChange)="selectedLanguage.set($event)" class="filter-select">
            <option value="ALL">Todos</option>
            <option *ngFor="let lang of languages" [value]="lang">{{ lang }}</option>
          </select>
        </div>

        <div class="filter-group">
          <label>PERÍODO</label>
          <select [ngModel]="selectedPeriod()" (ngModelChange)="selectedPeriod.set($event)" class="filter-select">
            <option value="7">7 dias</option>
            <option value="30">30 dias</option>
            <option value="90">90 dias</option>
            <option value="365">1 ano</option>
            <option value="ALL">Tudo</option>
          </select>
        </div>
      </div>

      <!-- KPIs -->
      <div class="kpis-row" *ngIf="!loading() && chartData().length > 0">
        <div class="kpi-card highlight">
          <div class="kpi-icon">🚀</div>
          <div class="kpi-content">
            <p class="kpi-label">VALORIZAÇÃO</p>
            <p class="kpi-value" [class.positive]="kpis().appreciation >= 0" [class.negative]="kpis().appreciation < 0">
              {{ kpis().appreciation >= 0 ? '+' : '' }}{{ kpis().appreciation | number:'1.2-2' }}%
            </p>
          </div>
        </div>

        <div class="kpi-card">
          <div class="kpi-icon">📉</div>
          <div class="kpi-content">
            <p class="kpi-label">MENOR PREÇO</p>
            <p class="kpi-value">R$ {{ kpis().minPrice | number:'1.2-2' }}</p>
          </div>
        </div>

        <div class="kpi-card">
          <div class="kpi-icon">💰</div>
          <div class="kpi-content">
            <p class="kpi-label">PREÇO ATUAL</p>
            <p class="kpi-value">R$ {{ kpis().currentPrice | number:'1.2-2' }}</p>
          </div>
        </div>
      </div>

      <!-- Chart -->
      <div class="chart-wrapper">
        <div *ngIf="loading()" class="loading-state">
          <div class="spinner"></div>
          <p>Carregando histórico...</p>
        </div>
        
        <div *ngIf="!loading() && chartData().length === 0" class="empty-state">
          <p>Selecione uma carta para ver o histórico</p>
        </div>

        <div #chartContainer class="chart-container" [class.hidden]="loading() || chartData().length === 0"></div>
      </div>
    </div>
  `,
  styles: [`
    .performance-container {
      background: #0f172a;
      border: 1px solid #1e293b;
      border-radius: 16px;
      padding: 24px;
      margin-top: 32px;
      color: #fff;
    }

    .header { margin-bottom: 24px; }
    .title { font-size: 20px; font-weight: 700; color: #fff; margin: 0 0 4px 0; }
    .subtitle { font-size: 14px; color: #94a3b8; margin: 0; }

    .filters-row {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 16px;
      margin-bottom: 24px;
    }

    .filter-group { display: flex; flex-direction: column; gap: 8px; }
    .filter-group label { font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 1px; }
    
    .filter-select {
      background: #1e293b;
      border: 1px solid #334155;
      border-radius: 8px;
      padding: 10px 12px;
      color: #f8fafc;
      font-size: 14px;
      outline: none;
      transition: all 0.2s;
    }
    .filter-select:focus { border-color: #22c55e; box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.1); }

    .kpis-row {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 16px;
      margin-bottom: 24px;
    }

    .kpi-card {
      background: #1e293b;
      border: 1px solid #334155;
      border-radius: 12px;
      padding: 16px;
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .kpi-card.highlight { background: rgba(34, 197, 94, 0.1); border-color: rgba(34, 197, 94, 0.3); }
    .kpi-icon { font-size: 24px; }
    .kpi-content { flex: 1; }
    .kpi-label { font-size: 11px; color: #94a3b8; margin: 0 0 4px 0; font-weight: 700; }
    .kpi-value { font-size: 18px; font-weight: 700; color: #fff; margin: 0; }
    .kpi-value.positive { color: #22c55e; }
    .kpi-value.negative { color: #ef4444; }

    .chart-wrapper {
      background: #0b1120;
      border-radius: 12px;
      border: 1px solid #1e293b;
      height: 400px;
      position: relative;
      overflow: hidden;
    }

    .chart-container { width: 100%; height: 100%; }
    .hidden { display: none; }

    .loading-state, .empty-state {
      height: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      color: #64748b;
    }

    .spinner {
      width: 32px;
      height: 32px;
      border: 3px solid #1e293b;
      border-top-color: #22c55e;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin-bottom: 12px;
    }

    @keyframes spin { to { transform: rotate(360deg); } }

    /* D3 Tooltip */
    ::ng-deep .chart-tooltip {
      position: absolute;
      background: rgba(15, 23, 42, 0.95);
      border: 1px solid #334155;
      border-radius: 8px;
      padding: 12px;
      color: #fff;
      font-size: 12px;
      pointer-events: none;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
      z-index: 100;
      backdrop-filter: blur(4px);
    }
  `]
})
export class PortfolioPerformanceComponent implements OnInit {
  @ViewChild('chartContainer') chartContainer!: ElementRef;

  // Static Data
  conditions = ['NM', 'SP', 'MP', 'HP', 'D'];
  languages = ['PT-BR', 'EN', 'JPN'];

  // Signals
  availableCards = signal<string[]>([]);
  selectedCard = signal<string>('');
  selectedCondition = signal<string>('ALL');
  selectedLanguage = signal<string>('ALL');
  selectedPeriod = signal<string>('30');

  loading = signal(false);
  chartData = signal<{ date: Date, value: number, condition: string, language: string }[]>([]);

  // Computed KPIs
  kpis = computed(() => {
    const data = this.chartData();
    if (data.length === 0) return { appreciation: 0, minPrice: 0, currentPrice: 0 };

    const currentPrice = data[data.length - 1].value;
    const minPrice = Math.min(...data.map(d => d.value));

    // Calculate appreciation based on the first point in the period vs current
    const startPrice = data[0].value;
    const appreciation = ((currentPrice - startPrice) / startPrice) * 100;

    return { appreciation, minPrice, currentPrice };
  });

  constructor() {
    // Effect to reload data when filters change
    effect(() => {
      const card = this.selectedCard();
      const cond = this.selectedCondition();
      const lang = this.selectedLanguage();
      const period = this.selectedPeriod();

      if (card) {
        this.loadHistorico(card, cond, lang, period);
      }
    });

    // Effect to redraw chart when data changes
    effect(() => {
      const data = this.chartData();
      if (data.length > 0 && this.chartContainer) {
        setTimeout(() => this.drawChart(), 0);
      }
    });
  }

  async ngOnInit() {
    await this.loadAvailableCards();
  }

  async loadAvailableCards() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('portfolio_cards')
        .select('carta')
        .eq('user_id', user.id);

      if (error) throw error;

      const uniqueCards = [...new Set(data.map((d: any) => d.carta))].sort();
      this.availableCards.set(uniqueCards);

      if (uniqueCards.length > 0) {
        this.selectedCard.set(uniqueCards[0]);
      }
    } catch (e) {
      console.error('Error loading available cards:', e);
    }
  }

  async loadHistorico(card: string, condition: string, language: string, period: string) {
    this.loading.set(true);
    try {
      let query = supabase
        .from('myp_cards_meg')
        .select('data_coleta, preco_min, condicao, idioma')
        .eq('carta', card)
        .order('data_coleta', { ascending: true });

      if (condition !== 'ALL') {
        query = query.ilike('condicao', condition);
      }

      if (language !== 'ALL') {
        query = query.ilike('idioma', language);
      }

      if (period !== 'ALL') {
        const days = parseInt(period);
        const date = new Date();
        date.setDate(date.getDate() - days);
        query = query.gte('data_coleta', date.toISOString().split('T')[0]);
      }

      const { data, error } = await query;

      if (error) throw error;

      if (!data || data.length === 0) {
        this.chartData.set([]);
        this.loading.set(false);
        return;
      }

      const processed = this.processData(data);
      this.chartData.set(processed);

    } catch (e) {
      console.error('Error loading history:', e);
      this.chartData.set([]);
    } finally {
      this.loading.set(false);
    }
  }

  processData(data: any[]) {
    const grouped = new Map<string, { min: number, item: any }>();

    data.forEach(item => {
      const date = item.data_coleta.split('T')[0];
      const price = parseFloat(item.preco_min);

      if (!grouped.has(date) || price < grouped.get(date)!.min) {
        grouped.set(date, { min: price, item });
      }
    });

    return Array.from(grouped.entries())
      .map(([date, val]) => ({
        date: new Date(date),
        value: val.min,
        condition: val.item.condicao,
        language: val.item.idioma
      }))
      .sort((a, b) => a.date.getTime() - b.date.getTime());
  }

  drawChart() {
    const element = this.chartContainer.nativeElement;
    const data = this.chartData();

    d3.select(element).selectAll('*').remove();

    const margin = { top: 20, right: 30, bottom: 30, left: 60 };
    const width = element.offsetWidth - margin.left - margin.right;
    const height = element.offsetHeight - margin.top - margin.bottom;

    const svg = d3.select(element)
      .append('svg')
      .attr('width', '100%')
      .attr('height', '100%')
      .attr('viewBox', `0 0 ${element.offsetWidth} ${element.offsetHeight}`)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    const x = d3.scaleTime()
      .domain(d3.extent(data, (d: any) => d.date))
      .range([0, width]);

    const yMin = d3.min(data, (d: any) => d.value);
    const yMax = d3.max(data, (d: any) => d.value);
    const yPadding = (yMax - yMin) * 0.1;

    const y = d3.scaleLinear()
      .domain([yMin - yPadding, yMax + yPadding])
      .range([height, 0]);

    const xAxis = d3.axisBottom(x).ticks(5).tickFormat(d3.timeFormat('%d/%m'));
    const yAxis = d3.axisLeft(y).ticks(5).tickFormat((d: number) => `R$ ${d}`);

    svg.append('g')
      .attr('class', 'grid')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(x).ticks(5).tickSize(-height).tickFormat(''))
      .style('stroke-dasharray', '3,3')
      .style('stroke-opacity', 0.1);

    svg.append('g')
      .attr('class', 'grid')
      .call(d3.axisLeft(y).ticks(5).tickSize(-width).tickFormat(''))
      .style('stroke-dasharray', '3,3')
      .style('stroke-opacity', 0.1);

    svg.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(xAxis)
      .style('color', '#94a3b8');

    svg.append('g')
      .call(yAxis)
      .style('color', '#94a3b8');

    const line = d3.line()
      .x((d: any) => x(d.date))
      .y((d: any) => y(d.value))
      .curve(d3.curveMonotoneX);

    const gradient = svg.append('defs')
      .append('linearGradient')
      .attr('id', 'area-gradient')
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '0%')
      .attr('y2', '100%');

    gradient.append('stop')
      .attr('offset', '0%')
      .attr('stop-color', '#22c55e')
      .attr('stop-opacity', 0.2);

    gradient.append('stop')
      .attr('offset', '100%')
      .attr('stop-color', '#22c55e')
      .attr('stop-opacity', 0);

    const area = d3.area()
      .x((d: any) => x(d.date))
      .y0(height)
      .y1((d: any) => y(d.value))
      .curve(d3.curveMonotoneX);

    svg.append('path')
      .datum(data)
      .attr('fill', 'url(#area-gradient)')
      .attr('d', area);

    const path = svg.append('path')
      .datum(data)
      .attr('fill', 'none')
      .attr('stroke', '#22c55e')
      .attr('stroke-width', 3)
      .attr('d', line);

    const totalLength = path.node().getTotalLength();
    path
      .attr('stroke-dasharray', totalLength + ' ' + totalLength)
      .attr('stroke-dashoffset', totalLength)
      .transition()
      .duration(1500)
      .ease(d3.easeCubicOut)
      .attr('stroke-dashoffset', 0);

    const tooltip = d3.select(element)
      .append('div')
      .attr('class', 'chart-tooltip')
      .style('opacity', 0);

    const overlay = svg.append('rect')
      .attr('width', width)
      .attr('height', height)
      .style('fill', 'none')
      .style('pointer-events', 'all');

    const bisect = d3.bisector((d: any) => d.date).left;

    const focus = svg.append('g')
      .append('circle')
      .style('fill', '#22c55e')
      .attr('stroke', '#fff')
      .attr('r', 5)
      .style('opacity', 0);

    overlay.on('mousemove', (event: any) => {
      const x0 = x.invert(d3.pointer(event)[0]);
      const i = bisect(data, x0, 1);
      const d0 = data[i - 1];
      const d1 = data[i];
      const d = x0.getTime() - d0.date.getTime() > d1.date.getTime() - x0.getTime() ? d1 : d0;

      focus
        .attr('cx', x(d.date))
        .attr('cy', y(d.value))
        .style('opacity', 1);

      tooltip
        .transition()
        .duration(100)
        .style('opacity', 1);

      tooltip
        .html(`
          <div style="font-weight:bold; margin-bottom:4px">${d.date.toLocaleDateString('pt-BR')}</div>
          <div style="color:#22c55e; font-size:14px; font-weight:bold">R$ ${d.value.toFixed(2)}</div>
          <div style="color:#94a3b8; font-size:10px; margin-top:4px">${d.condition} • ${d.language}</div>
        `)
        .style('left', (event.pageX - element.getBoundingClientRect().left + 10) + 'px')
        .style('top', (event.pageY - element.getBoundingClientRect().top - 10) + 'px');
    })
      .on('mouseout', () => {
        focus.style('opacity', 0);
        tooltip.transition().duration(200).style('opacity', 0);
      });
  }
}
