// sales-flow.model.ts
export interface SalesFlowSummary {
    totalSales: number;        // qtd vendida hoje
    totalVolume: number;       // volume R$ hoje
    avgTicket: number;         // ticket médio
    activeSellers: number;     // vendedores com pelo menos 1 venda

    diffSalesPct: number;      // % vs ontem
    diffVolumePct: number;     // % vs ontem

    newSellers: number;        // nunca tinham vendido e venderam hoje
    returningSellers: number;  // venderam no passado, estavam X dias sem vender
    lostSellers: number;       // venderam ontem e hoje 0 vendas
}

export interface SalesFlowPoint {
    date: string;   // '2025-12-05'
    sales: number;  // qtd vendida no dia
}

export interface SalesFlowData {
    summary: SalesFlowSummary;
    history: SalesFlowPoint[];  // últimos 7–14 dias
}
