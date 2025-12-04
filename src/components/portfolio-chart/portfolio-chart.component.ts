import { Component, ChangeDetectionStrategy, ElementRef, ViewChild, AfterViewInit, input, OnChanges, SimpleChanges } from '@angular/core';

declare const d3: any;

@Component({
  selector: 'app-portfolio-chart',
  template: `<div #chart class="w-full h-80"></div>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PortfolioChartComponent implements AfterViewInit, OnChanges {
  @ViewChild('chart') private chartContainer!: ElementRef;

  data = input<{ date: string; value: number; }[]>([]);

  ngAfterViewInit() {
    this.createChart();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['data'] && this.chartContainer) {
      this.createChart();
    }
  }

  private createChart(): void {
    const data = this.data();
    if (!data || data.length === 0) return;

    const element = this.chartContainer.nativeElement;
    d3.select(element).select('svg').remove();

    const margin = { top: 20, right: 20, bottom: 50, left: 70 };
    const width = element.offsetWidth - margin.left - margin.right;
    const height = element.offsetHeight - margin.top - margin.bottom;

    const svg = d3.select(element)
      .append('svg')
      .attr('width', '100%')
      .attr('height', '100%')
      .attr('viewBox', `0 0 ${element.offsetWidth} ${element.offsetHeight}`)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // --- Scales ---
    const x = d3.scalePoint()
      .domain(data.map((d: any) => d.date))
      .range([0, width]);

    const yDomain = d3.extent(data, (d: any) => d.value as number) as [number, number];
    const yPadding = (yDomain[1] - yDomain[0]) * 0.2 || 100; // Add fallback padding
    const yMin = yDomain[0] - yPadding > 0 ? yDomain[0] - yPadding : 0;
    const yMax = yDomain[1] + yPadding;

    const y = d3.scaleLinear()
      .domain([yMin, yMax])
      .range([height, 0]);

    // --- Axes ---
    const xAxis = svg.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(x));
    
    const yAxis = svg.append('g')
      .call(d3.axisLeft(y).ticks(5).tickFormat((d: number) => `R$ ${d3.format(",.0f")(d)}`));

    // Style axes
    xAxis.selectAll('path, line').attr('stroke', '#4A5568'); // slate-600
    xAxis.selectAll('text').attr('fill', '#94A3B8').style('font-size', '12px'); // slate-400
    yAxis.selectAll('path, line').attr('stroke', '#4A5568'); // slate-600
    yAxis.selectAll('text').attr('fill', '#94A3B8').style('font-size', '12px'); // slate-400

    // --- Gridlines ---
    svg.append('g')
      .attr('class', 'grid')
      .call(d3.axisLeft(y).ticks(5).tickSize(-width).tickFormat(''))
      .selectAll('line')
      .attr('stroke', '#4A5568') // slate-600
      .attr('stroke-opacity', 0.5)
      .attr('stroke-dasharray', '2,2');
    
    svg.select('.domain').remove(); // remove y-axis line from grid

    // --- Line Generator ---
    const line = d3.line()
      .x((d: any) => x(d.date))
      .y((d: any) => y(d.value))
      .curve(d3.curveMonotoneX);

    // --- Draw Line ---
    svg.append('path')
      .datum(data)
      .attr('fill', 'none')
      .attr('stroke', '#22C55E') // green-500
      .attr('stroke-width', 2.5)
      .attr('d', line);

    // --- Draw Points ---
    svg.selectAll('.dot')
      .data(data)
      .enter().append('circle')
      .attr('class', 'dot')
      .attr('cx', (d: any) => x(d.date))
      .attr('cy', (d: any) => y(d.value))
      .attr('r', 5)
      .attr('fill', '#16A34A') // green-600
      .attr('stroke', '#1F2937') // slate-800
      .attr('stroke-width', 2);
  }
}
