import { Component, OnInit, signal, computed, effect, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { supabase } from '../../supabaseClient';

declare const d3: any;

interface ConversionFactors {
  idioma: Map<string, number>;
  estado: Map<string, number>;
}

interface PortfolioPosition {
  carta: string;
  quantidade: number;
  idioma: string;
  estado: string;
  data_compra: string;
}

interface DailyValue {
  date: Date;
  value: number;
  breakdown: { carta: string; value: number }[];
}

@Component({
  selector: 'app-portfolio-consolidated',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="consolidated-container">
      <div class="header">
        <h2 class="title">💼 Performance Consolidada do Portfólio</h2>
        <p class="subtitle">Valor total de todas as suas cartas ao longo do tempo</p>
      </div>

      <!-- Period Filter -->
      <div class="filter-row">
        <div class="filter-group">
          <label>PERÍODO</label>
          <select [ngModel]="selectedPeriod()" (ngModelChange)="selectedPeriod.set($event)" class="filter-select">
            <option value="7">7 dias</option>
            <option value="30">30 dias</option>
            <option value="90">90 dias</option>
            <option value="180">6 meses</option>
            <option value="365">1 ano</option>
            <option value="ALL">Todo período</option>
          </select>
        </div>
      </div>

      <!-- KPIs -->
      <div class="kpis-row" *ngIf="!loading() && kpis()">
        <div class="kpi-card highlight">
          <div class="kpi-icon">💰</div>
          <div class="kpi-content">
            <p class="kpi-label">VALOR ATUAL</p>
            <p class="kpi-value">R$ {{ kpis().currentValue | number:'1.2-2' }}</p>
          </div>
        </div>

        <div class="kpi-card" [class.positive]="kpis().percentChange >= 0" [class.negative]="kpis().percentChange < 0">
          <div class="kpi-icon">{{ kpis().percentChange >= 0 ? '📈' : '📉' }}</div>
          <div class="kpi-content">
            <p class="kpi-label">VARIAÇÃO NO PERÍODO</p>
            <p class="kpi-value" [class.positive]="kpis().percentChange >= 0" [class.negative]="kpis().percentChange < 0">
              {{ kpis().percentChange >= 0 ? '+' : '' }}{{ kpis().percentChange | number:'1.2-2' }}%
            </p>
          </div>
        </div>

        <div class="kpi-card">
          <div class="kpi-icon">🚀</div>
          <div class="kpi-content">
            <p class="kpi-label">MAIOR VALOR</p>
            <p class="kpi-value">R$ {{ kpis().maxValue | number:'1.2-2' }}</p>
          </div>
        </div>

        <div class="kpi-card">
          <div class="kpi-icon">⬇️</div>
          <div class="kpi-content">
            <p class="kpi-label">MENOR VALOR</p>
            <p class="kpi-value">R$ {{ kpis().minValue | number:'1.2-2' }}</p>
          </div>
        </div>
      </div>

      <!-- Chart -->
      <div class="chart-wrapper">
        <div *ngIf="loading()" class="loading-state">
          <div class="spinner"></div>
          <p>Calculando valor do portfólio...</p>
        </div>
        
        <div *ngIf="!loading() && chartData().length === 0" class="empty-state">
          <p>Adicione cartas ao seu portfólio para ver a performance</p>
        </div>

        <div #chartContainer class="chart-container" [class.hidden]="loading() || chartData().length === 0"></div>
      </div>
    </div>
  `,
  styles: [`
    .consolidated-container {
      background: #0f172a;
      border: 1px solid #1e293b;
      border-radius: 16px;
      padding: 24px;
      color: #fff;
    }

    .header { margin-bottom: 24px; }
    .title { font-size: 22px; font-weight: 700; color: #fff; margin: 0 0 4px 0; }
    .subtitle { font-size: 14px; color: #94a3b8; margin: 0; }

    .filter-row {
      display: flex;
      gap: 16px;
      margin-bottom: 24px;
    }

    .filter-group { display: flex; flex-direction: column; gap: 8px; min-width: 150px; }
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
      transition: all 0.2s;
    }

    .kpi-card.highlight { background: rgba(34, 197, 94, 0.1); border-color: rgba(34, 197, 94, 0.3); }
    .kpi-card.positive { background: rgba(34, 197, 94, 0.05); border-color: rgba(34, 197, 94, 0.2); }
    .kpi-card.negative { background: rgba(239, 68, 68, 0.05); border-color: rgba(239, 68, 68, 0.2); }
    
    .kpi-icon { font-size: 28px; }
    .kpi-content { flex: 1; }
    .kpi-label { font-size: 11px; color: #94a3b8; margin: 0 0 4px 0; font-weight: 700; }
    .kpi-value { font-size: 20px; font-weight: 700; color: #fff; margin: 0; }
    .kpi-value.positive { color: #22c55e; }
    .kpi-value.negative { color: #ef4444; }

    .chart-wrapper {
      background: #0b1120;
      border-radius: 12px;
      border: 1px solid #1e293b;
      height: 450px;
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
      width: 40px;
      height: 40px;
      border: 4px solid #1e293b;
      border-top-color: #22c55e;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin-bottom: 16px;
    }

    @keyframes spin { to { transform: rotate(360deg); } }

    ::ng-deep .chart-tooltip {
      position: absolute;
      background: rgba(15, 23, 42, 0.98);
      border: 1px solid #334155;
      border-radius: 8px;
      padding: 12px;
      color: #fff;
      font-size: 12px;
      pointer-events: none;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
      z-index: 100;
      backdrop-filter: blur(8px);
      min-width: 200px;
    }
  `]
})
export class PortfolioConsolidatedComponent implements OnInit {
  @ViewChild('chartContainer') chartContainer!: ElementRef;

  // Signals
  selectedPeriod = signal<string>('30');
  loading = signal(false);
  chartData = signal<DailyValue[]>([]);
  conversionFactors = signal<ConversionFactors>({ idioma: new Map(), estado: new Map() });

  // Computed KPIs
  kpis = computed(() => {
    const data = this.chartData();
    if (data.length === 0) return null;

    const currentValue = data[data.length - 1].value;
    const startValue = data[0].value;
    const percentChange = ((currentValue - startValue) / startValue) * 100;
    const maxValue = Math.max(...data.map(d => d.value));
    const minValue = Math.min(...data.map(d => d.value));

    return { currentValue, percentChange, maxValue, minValue };
  });

  constructor() {
    effect(() => {
      const period = this.selectedPeriod();
      this.loadConsolidatedData(period);
    });

    effect(() => {
      const data = this.chartData();
      if (data.length > 0 && this.chartContainer) {
        setTimeout(() => this.drawChart(), 0);
      }
    });
  }

  async ngOnInit() {
    await this.loadConversionFactors();
  }

  async loadConversionFactors() {
    console.log('📊 [Consolidated] Usando fatores de conversão hardcoded...');

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

    this.conversionFactors.set({ idioma: idiomaMap, estado: estadoMap });

    console.log('✅ [Consolidated] Fatores carregados (Hardcoded):', {
      idioma: Array.from(idiomaMap.entries()),
      estado: Array.from(estadoMap.entries())
    });
  }

  async loadConsolidatedData(period: string) {
    this.loading.set(true);
    try {
      // 1. Get all user positions
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        this.loading.set(false);
        return;
      }

      const { data: positions, error: posError } = await supabase
        .from('portfolio_cards')
        .select('carta, qtd, idioma, estado, data_compra')
        .eq('user_id', user.id);

      if (posError) throw posError;
      if (!positions || positions.length === 0) {
        this.chartData.set([]);
        this.loading.set(false);
        return;
      }

      console.log(`📊 Loading data for ${positions.length} positions`);

      // 2. Calculate date range
      const endDate = new Date();
      let startDate = new Date();

      if (period !== 'ALL') {
        startDate.setDate(endDate.getDate() - parseInt(period));
      } else {
        // Get earliest purchase date
        const earliestPurchase = positions.reduce((min, p) => {
          const pDate = new Date(p.data_compra);
          return pDate < min ? pDate : min;
        }, new Date());
        startDate = earliestPurchase;
      }

      // 3. For each position, get price history
      const dailyValues = new Map<string, number>();
      const factors = this.conversionFactors();

      for (const position of positions) {
        const priceHistory = await this.getPriceHistory(
          position.carta,
          startDate.toISOString().split('T')[0],
          endDate.toISOString().split('T')[0]
        );

        // For each date in the period, calculate value
        priceHistory.forEach((priceData) => {
          const dateKey = priceData.data_coleta.split('T')[0];
          const adjustedPrice = this.getAdjustedPrice(
            priceData,
            position.idioma,
            position.estado,
            factors
          );

          const positionValue = position.qtd * adjustedPrice;
          dailyValues.set(dateKey, (dailyValues.get(dateKey) || 0) + positionValue);
        });
      }

      // 4. Convert to array and sort
      const consolidated: DailyValue[] = Array.from(dailyValues.entries())
        .map(([dateStr, value]) => ({
          date: new Date(dateStr),
          value,
          breakdown: [] // TODO: Add card breakdown if needed
        }))
        .sort((a, b) => a.date.getTime() - b.date.getTime());

      console.log(`✅ Consolidated ${consolidated.length} daily values`);
      this.chartData.set(consolidated);

    } catch (e) {
      console.error('❌ Error loading consolidated data:', e);
      this.chartData.set([]);
    } finally {
      this.loading.set(false);
    }
  }

  async getPriceHistory(carta: string, startDate: string, endDate: string) {
    const cleanName = carta.trim();
    console.log(`📊 [Chart] Buscando histórico para: "${cleanName}"`);

    try {
      // 1. Tentativa Exata
      let { data, error } = await supabase
        .from('myp_cards_meg')
        .select('data_coleta, preco_minimo_carta, idioma, estado, carta')
        .eq('carta', cleanName)
        .gte('data_coleta', startDate)
        .lte('data_coleta', endDate)
        .order('data_coleta', { ascending: true });

      if (data && data.length > 0) {
        console.log(`✅ [Chart] Histórico EXATO encontrado: ${data.length} pontos`);
        return data;
      }

      console.warn(`⚠️ [Chart] Histórico exato vazio para "${cleanName}". Tentando ILIKE...`);

      // 2. Tentativa Case Insensitive
      const { data: ilikeData } = await supabase
        .from('myp_cards_meg')
        .select('data_coleta, preco_minimo_carta, idioma, estado, carta')
        .ilike('carta', cleanName)
        .gte('data_coleta', startDate)
        .lte('data_coleta', endDate)
        .order('data_coleta', { ascending: true });

      if (ilikeData && ilikeData.length > 0) {
        console.log(`✅ [Chart] Histórico ILIKE encontrado: ${ilikeData.length} pontos`);
        return ilikeData;
      }

      console.warn(`⚠️ [Chart] Histórico ILIKE vazio. Tentando parcial...`);

      // 3. Tentativa Parcial (primeiros 15 chars)
      const partialName = cleanName.substring(0, 15) + '%';
      const { data: partialData } = await supabase
        .from('myp_cards_meg')
        .select('data_coleta, preco_minimo_carta, idioma, estado, carta')
        .ilike('carta', partialName)
        .gte('data_coleta', startDate)
        .lte('data_coleta', endDate)
        .order('data_coleta', { ascending: true });

      if (partialData && partialData.length > 0) {
        console.log(`✅ [Chart] Histórico PARCIAL encontrado: ${partialData.length} pontos para "${partialName}"`);
        return partialData;
      }

      console.error(`❌ [Chart] NENHUM histórico encontrado para "${cleanName}"`);
      return [];

    } catch (e) {
      console.error(`❌ [Chart] Erro ao buscar histórico para ${carta}:`, e);
      return [];
    }
  }

  getAdjustedPrice(priceData: any, targetIdioma: string, targetEstado: string, factors: ConversionFactors): number {
    const basePrice = parseFloat(priceData.preco_minimo_carta);

    // Check if exact match
    if (priceData.idioma === targetIdioma && priceData.estado === targetEstado) {
      return basePrice;
    }

    // Apply conversion factors
    let adjustedPrice = basePrice;

    const sourceIdiomaFactor = factors.idioma.get(priceData.idioma) || 1.0;
    const targetIdiomaFactor = factors.idioma.get(targetIdioma) || 1.0;
    adjustedPrice *= (targetIdiomaFactor / sourceIdiomaFactor);

    const sourceEstadoFactor = factors.estado.get(priceData.estado) || 1.0;
    const targetEstadoFactor = factors.estado.get(targetEstado) || 1.0;
    adjustedPrice *= (targetEstadoFactor / sourceEstadoFactor);

    return adjustedPrice;
  }

  drawChart() {
    const element = this.chartContainer.nativeElement;
    const data = this.chartData();

    d3.select(element).selectAll('*').remove();

    const margin = { top: 20, right: 30, bottom: 40, left: 70 };
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

    // Grid
    svg.append('g')
      .attr('class', 'grid')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(x).ticks(6).tickSize(-height).tickFormat(''))
      .style('stroke', '#1e293b')
      .style('stroke-dasharray', '3,3');

    svg.append('g')
      .attr('class', 'grid')
      .call(d3.axisLeft(y).ticks(6).tickSize(-width).tickFormat(''))
      .style('stroke', '#1e293b')
      .style('stroke-dasharray', '3,3');

    // Axes
    svg.append('g')
      .attr('transform', `translate(0, ${height})`)
      .call(d3.axisBottom(x).ticks(6).tickFormat(d3.timeFormat('%d/%m')))
      .style('color', '#94a3b8');

    svg.append('g')
      .call(d3.axisLeft(y).ticks(6).tickFormat((d: number) => `R$ ${d3.format(',.0f')(d)} `))
      .style('color', '#94a3b8');

    // Gradient
    const gradient = svg.append('defs')
      .append('linearGradient')
      .attr('id', 'area-gradient-consolidated')
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '0%')
      .attr('y2', '100%');

    gradient.append('stop')
      .attr('offset', '0%')
      .attr('stop-color', '#22c55e')
      .attr('stop-opacity', 0.3);

    gradient.append('stop')
      .attr('offset', '100%')
      .attr('stop-color', '#22c55e')
      .attr('stop-opacity', 0);

    // Area
    const area = d3.area()
      .x((d: any) => x(d.date))
      .y0(height)
      .y1((d: any) => y(d.value))
      .curve(d3.curveMonotoneX);

    svg.append('path')
      .datum(data)
      .attr('fill', 'url(#area-gradient-consolidated)')
      .attr('d', area);

    // Line
    const line = d3.line()
      .x((d: any) => x(d.date))
      .y((d: any) => y(d.value))
      .curve(d3.curveMonotoneX);

    const path = svg.append('path')
      .datum(data)
      .attr('fill', 'none')
      .attr('stroke', '#22c55e')
      .attr('stroke-width', 3)
      .attr('d', line);

    // Animate
    const totalLength = path.node().getTotalLength();
    path
      .attr('stroke-dasharray', totalLength + ' ' + totalLength)
      .attr('stroke-dashoffset', totalLength)
      .transition()
      .duration(1500)
      .ease(d3.easeCubicOut)
      .attr('stroke-dashoffset', 0);

    // Tooltip
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
      .attr('stroke-width', 2)
      .attr('r', 6)
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
  < div style = "font-weight:bold; margin-bottom:8px; font-size:13px" > ${d.date.toLocaleDateString('pt-BR')} </div>
    < div style = "color:#22c55e; font-size:16px; font-weight:bold; margin-bottom:4px" > R$ ${d.value.toFixed(2)} </div>
      < div style = "color:#64748b; font-size:11px" > Valor total do portfólio </div>
        `)
        .style('left', (event.pageX - element.getBoundingClientRect().left + 15) + 'px')
        .style('top', (event.pageY - element.getBoundingClientRect().top - 15) + 'px');
    })
      .on('mouseout', () => {
        focus.style('opacity', 0);
        tooltip.transition().duration(200).style('opacity', 0);
      });
  }
}
