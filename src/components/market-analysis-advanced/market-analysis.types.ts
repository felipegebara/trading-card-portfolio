export interface MarketOffer {
    id: number;
    carta: string;
    idioma: string;
    estado: string;
    valor: number;
    qtd: string;
    vendedor: string;
    url: string;
    data_coleta: string;
}

export interface OpportunityScore {
    score: number;
    label: string;
    color: string;
    icon: string;
}

export interface MarketKPIs {
    minPrice: number;
    avgPrice: number;
    totalOffers: number;
    dispersion: number;
    minPriceTrend: number;
    avgPriceTrend: number;
    liquidityLabel: string;
    offersPerDay: number;
    totalVolume: number;
    newListings: number;
}

export interface DistributionItem {
    name: string;
    count: number;
    percentage: number;
    avgPrice: number;
}

export interface PriceEvolution {
    date: string;
    avgPrice: number;
    minPrice: number;
    maxPrice: number;
}

export interface FilterState {
    card: string;
    language: string;
    condition: string;
    period: string;
}
