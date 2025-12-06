import { PriceEvolution } from './market-analysis.types';

export class ChartRenderer {

    /**
     * Render price evolution chart with forecast
     */
    static renderPriceChart(
        canvas: HTMLCanvasElement,
        evolution: PriceEvolution[]
    ): void {
        if (evolution.length === 0) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const padding = 30;
        const width = canvas.width - padding * 2;
        const height = canvas.height - padding * 2;

        const allPrices = evolution.flatMap(e => [e.minPrice, e.avgPrice, e.maxPrice]);
        const minPrice = Math.min(...allPrices);
        const maxPrice = Math.max(...allPrices);
        const priceRange = maxPrice - minPrice || 1;

        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw grid
        this.drawGrid(ctx, padding, width, height);

        // Draw price bands
        this.drawPriceBands(ctx, evolution, padding, width, height, minPrice, priceRange);

        // Draw average line
        this.drawAverageLine(ctx, evolution, padding, width, height, minPrice, priceRange);

        // Draw forecast
        this.drawForecast(ctx, evolution, padding, width, height, minPrice, priceRange);

        // Draw points
        this.drawPoints(ctx, evolution, padding, width, height, minPrice, priceRange);

        // Draw labels
        this.drawLabels(ctx, evolution, canvas, padding, width, height, minPrice, priceRange);

        // Draw legend
        this.drawLegend(ctx, padding);
    }

    private static drawGrid(
        ctx: CanvasRenderingContext2D,
        padding: number,
        width: number,
        height: number
    ): void {
        ctx.strokeStyle = '#1f2937';
        ctx.lineWidth = 1;

        for (let i = 0; i <= 5; i++) {
            const y = padding + (height / 5) * i;
            ctx.beginPath();
            ctx.moveTo(padding, y);
            ctx.lineTo(padding + width, y);
            ctx.stroke();
        }
    }

    private static getXPosition(i: number, length: number, width: number, padding: number): number {
        if (length <= 1) return padding + width / 2;
        return padding + (width / (length - 1)) * i;
    }

    private static drawPriceBands(
        ctx: CanvasRenderingContext2D,
        evolution: PriceEvolution[],
        padding: number,
        width: number,
        height: number,
        minPrice: number,
        priceRange: number
    ): void {
        if (evolution.length < 2) return; // Need at least 2 points for bands

        // Max area (red)
        ctx.fillStyle = 'rgba(239, 68, 68, 0.1)';
        ctx.beginPath();
        evolution.forEach((point, i) => {
            const x = this.getXPosition(i, evolution.length, width, padding);
            const y = padding + height - ((point.maxPrice - minPrice) / priceRange) * height;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        });
        ctx.lineTo(padding + width, padding + height);
        ctx.lineTo(padding, padding + height);
        ctx.closePath();
        ctx.fill();

        // Min area (green)
        ctx.fillStyle = 'rgba(34, 197, 94, 0.1)';
        ctx.beginPath();
        evolution.forEach((point, i) => {
            const x = this.getXPosition(i, evolution.length, width, padding);
            const y = padding + height - ((point.minPrice - minPrice) / priceRange) * height;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        });
        ctx.lineTo(padding + width, padding + height);
        ctx.lineTo(padding, padding + height);
        ctx.closePath();
        ctx.fill();
    }

    private static drawAverageLine(
        ctx: CanvasRenderingContext2D,
        evolution: PriceEvolution[],
        padding: number,
        width: number,
        height: number,
        minPrice: number,
        priceRange: number
    ): void {
        ctx.strokeStyle = '#22c55e';
        ctx.lineWidth = 3;
        ctx.beginPath();

        evolution.forEach((point, i) => {
            const x = this.getXPosition(i, evolution.length, width, padding);
            const y = padding + height - ((point.avgPrice - minPrice) / priceRange) * height;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        });

        ctx.stroke();
    }

    private static drawForecast(
        ctx: CanvasRenderingContext2D,
        evolution: PriceEvolution[],
        padding: number,
        width: number,
        height: number,
        minPrice: number,
        priceRange: number
    ): void {
        if (evolution.length < 3) return;

        const lastPoints = evolution.slice(-3);
        const avgTrend = (lastPoints[2].avgPrice - lastPoints[0].avgPrice) / 2;

        ctx.strokeStyle = '#22c55e';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();

        const lastX = padding + width;
        const lastY = padding + height - ((evolution[evolution.length - 1].avgPrice - minPrice) / priceRange) * height;
        ctx.moveTo(lastX, lastY);

        const forecastPrice = evolution[evolution.length - 1].avgPrice + avgTrend;
        const forecastY = padding + height - ((forecastPrice - minPrice) / priceRange) * height;
        ctx.lineTo(lastX + 50, forecastY);
        ctx.stroke();
        ctx.setLineDash([]);
    }

    private static drawPoints(
        ctx: CanvasRenderingContext2D,
        evolution: PriceEvolution[],
        padding: number,
        width: number,
        height: number,
        minPrice: number,
        priceRange: number
    ): void {
        ctx.fillStyle = '#22c55e';

        evolution.forEach((point, i) => {
            const x = this.getXPosition(i, evolution.length, width, padding);
            const y = padding + height - ((point.avgPrice - minPrice) / priceRange) * height;
            ctx.beginPath();
            ctx.arc(x, y, 4, 0, Math.PI * 2);
            ctx.fill();
        });
    }

    private static drawLabels(
        ctx: CanvasRenderingContext2D,
        evolution: PriceEvolution[],
        canvas: HTMLCanvasElement,
        padding: number,
        width: number,
        height: number,
        minPrice: number,
        priceRange: number
    ): void {
        ctx.fillStyle = '#9ca3af';
        ctx.font = '10px sans-serif';

        // X-axis labels (dates)
        ctx.textAlign = 'center';
        const step = Math.max(1, Math.ceil(evolution.length / 6));
        evolution.forEach((point, i) => {
            if (i % step === 0 || i === evolution.length - 1) {
                const x = this.getXPosition(i, evolution.length, width, padding);
                const date = new Date(point.date).toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: '2-digit'
                });
                ctx.fillText(date, x, canvas.height - 10);
            }
        });


        // Y-axis labels (prices)
        ctx.textAlign = 'right';
        for (let i = 0; i <= 5; i++) {
            const price = minPrice + (priceRange / 5) * (5 - i);
            const y = padding + (height / 5) * i;
            ctx.fillText(`R$ ${price.toFixed(0)}`, padding - 10, y + 4);
        }
    }

    private static drawLegend(ctx: CanvasRenderingContext2D, padding: number): void {
        ctx.textAlign = 'left';
        ctx.font = '10px sans-serif';

        ctx.fillStyle = '#22c55e';
        ctx.fillText('— Média', padding, 20);

        ctx.fillStyle = '#3b82f6';
        ctx.fillText('- - Previsão', padding + 80, 20);
    }
}
