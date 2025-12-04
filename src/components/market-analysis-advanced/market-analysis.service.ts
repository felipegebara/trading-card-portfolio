import { MarketOffer, OpportunityScore, DistributionItem } from './market-analysis.types';

export class MarketAnalysisService {

    /**
     * Normalize condition names to standard values
     */
    static normalizeCondition(condition: string): string {
        const normalized = condition.trim().toUpperCase();

        const mapping: Record<string, string> = {
            'QUASE NOVA': 'NM',
            'QUASE NOVO': 'NM',
            'NEAR MINT': 'NM',
            'POUCO JOGADA': 'SP',
            'SLIGHTLY PLAYED': 'SP',
            'MODERADAMENTE JOGADA': 'MP',
            'MODERATELY PLAYED': 'MP',
            'MUITO JOGADA': 'HP',
            'HEAVILY PLAYED': 'HP',
            'DANIFICADA': 'D',
            'DAMAGED': 'D'
        };

        return mapping[normalized] || normalized;
    }

    /**
     * Calculate opportunity score for an offer
     */
    static calculateOpportunityScore(offer: MarketOffer, avgPrice: number): OpportunityScore {
        const discount = ((avgPrice - offer.valor) / avgPrice) * 100;

        let conditionFactor = 1;
        const cond = this.normalizeCondition(offer.estado);
        if (cond === 'NM') conditionFactor = 1.2;
        else if (cond === 'SP') conditionFactor = 1.0;
        else if (cond === 'MP') conditionFactor = 0.8;
        else if (cond === 'HP') conditionFactor = 0.6;

        const score = Math.min(100, Math.max(0, (discount * conditionFactor) + 50));

        if (score >= 80) return { score, label: '⭐ TOP PICK', color: 'top', icon: '⭐' };
        if (score >= 60) return { score, label: '👍 Bom', color: 'good', icon: '👍' };
        if (score >= 40) return { score, label: '⚠️ OK', color: 'ok', icon: '⚠️' };
        return { score, label: '🔴 Caro', color: 'bad', icon: '🔴' };
    }

    /**
     * Check if price is an outlier (beyond 2 standard deviations)
     */
    static isPriceOutlier(offer: MarketOffer, offers: MarketOffer[]): boolean {
        const prices = offers.map(o => o.valor);
        const avg = prices.reduce((a, b) => a + b, 0) / prices.length;
        const stdDev = Math.sqrt(
            prices.reduce((sum, price) => sum + Math.pow(price - avg, 2), 0) / prices.length
        );
        return Math.abs(offer.valor - avg) > 2 * stdDev;
    }

    /**
     * Get outlier label
     */
    static getPriceOutlierLabel(offer: MarketOffer, avgPrice: number): string {
        return offer.valor < avgPrice ? '⚡ Muito barato' : '⚠️ Muito caro';
    }

    /**
     * Calculate distribution by condition
     */
    static calculateConditionDistribution(offers: MarketOffer[]): DistributionItem[] {
        const total = offers.length;
        if (total === 0) return [];

        const dist = offers.reduce((acc, offer) => {
            const normalized = this.normalizeCondition(offer.estado);
            if (!acc[normalized]) acc[normalized] = { prices: [], count: 0 };
            acc[normalized].prices.push(offer.valor);
            acc[normalized].count++;
            return acc;
        }, {} as Record<string, { prices: number[]; count: number }>);

        return Object.entries(dist).map(([name, data]) => ({
            name,
            count: data.count,
            percentage: (data.count / total) * 100,
            avgPrice: data.prices.reduce((a, b) => a + b, 0) / data.prices.length
        })).sort((a, b) => b.count - a.count);
    }

    /**
     * Calculate distribution by language
     */
    static calculateLanguageDistribution(offers: MarketOffer[]): DistributionItem[] {
        const total = offers.length;
        if (total === 0) return [];

        const dist = offers.reduce((acc, offer) => {
            if (!acc[offer.idioma]) acc[offer.idioma] = { prices: [], count: 0 };
            acc[offer.idioma].prices.push(offer.valor);
            acc[offer.idioma].count++;
            return acc;
        }, {} as Record<string, { prices: number[]; count: number }>);

        return Object.entries(dist).map(([name, data]) => ({
            name,
            count: data.count,
            percentage: (data.count / total) * 100,
            avgPrice: data.prices.reduce((a, b) => a + b, 0) / data.prices.length
        })).sort((a, b) => b.count - a.count);
    }

    /**
     * Get best value condition insight
     */
    static getBestValueCondition(distribution: DistributionItem[]): string {
        if (distribution.length < 2) return '';

        const nm = distribution.find(d => d.name === 'NM');
        const sp = distribution.find(d => d.name === 'SP');

        if (nm && sp && nm.avgPrice > 0) {
            const discount = ((nm.avgPrice - sp.avgPrice) / nm.avgPrice * 100);
            return `💡 SP oferece ${discount.toFixed(0)}% de desconto vs NM`;
        }
        return '';
    }

    /**
     * Calculate market trend
     */
    static getMarketTrend(avgPriceTrend: number): string {
        if (avgPriceTrend > 5) return '📈 Alta';
        if (avgPriceTrend < -5) return '📉 Baixa';
        return '➡️ Estável';
    }

    /**
     * Determine price zone
     */
    static getPriceZone(currentPrice: number, minPrice: number): string {
        const percentile = ((currentPrice - minPrice) / currentPrice) * 100;

        if (percentile < 20) return '🟢 Zona de Compra';
        if (percentile > 80) return '🔴 Zona de Venda';
        return '🟡 Zona Neutra';
    }

    /**
     * Get recommendation based on price zone
     */
    static getRecommendation(priceZone: string): string {
        if (priceZone.includes('Compra')) return '✅ Bom momento para comprar';
        if (priceZone.includes('Venda')) return '⚠️ Preço elevado';
        return '➡️ Aguardar';
    }

    /**
     * Export offers to CSV
     */
    static exportToCSV(offers: MarketOffer[], cardName: string, avgPrice: number): void {
        const csv = [
            ['Carta', 'Preço', 'Idioma', 'Condição', 'Vendedor', 'Score', 'URL'].join(','),
            ...offers.map(o => [
                o.carta,
                o.valor,
                o.idioma,
                this.normalizeCondition(o.estado),
                o.vendedor,
                this.calculateOpportunityScore(o, avgPrice).score.toFixed(0),
                o.url
            ].join(','))
        ].join('\n');

        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `ofertas-${cardName}-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
    }
}
