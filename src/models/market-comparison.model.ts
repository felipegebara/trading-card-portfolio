// Market Comparison Data Models
export interface MarketComparisonData {
    mypMarket: MypMarketData;
    priceChartingMarket: PriceChartingMarketData;
    trends: MarketTrends;
}

export interface MypMarketData {
    totalSales: number;
    totalVolume: number;  // BRL
    avgPrice: number;     // BRL
    priceChange7d: number; // %
    lastUpdate: string;
}

export interface PriceChartingMarketData {
    currentPrice: number;  // USD
    currentPriceBRL: number; // converted
    priceChange30d: number; // %
    lastSalePrice?: number; // USD
    lastUpdate: string;

    // Sales volume data
    rawSalesCount: number;
    rawAvgPrice: number;
    psaSalesCount: number;
    psaAvgPrice: number;
    totalSales: number;
}

export interface MarketTrends {
    arbitrageOpportunity: number; // % difference MYP vs PC
    arbitrageValueBRL: number;    // R$ per card
    priceGap: 'widening' | 'narrowing' | 'stable';
    recommendation: string;
    insights: string[];
}
