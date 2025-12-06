export type TransactionType = 'COMPRA' | 'VENDA' | 'TRADE';

export interface Transaction {
    id: string;
    user_id: string;
    tipo: TransactionType;
    carta: string;
    quantidade: number;
    preco_unitario: number;
    total: number;
    idioma?: string;
    estado?: string;
    data: string;
    notas?: string;
    created_at: string;
    updated_at?: string;
}

export interface TransactionSummary {
    totalGasto: number;      // Soma de todas as compras (BUY)
    totalVendido: number;    // Soma de todas as vendas (SELL)
    lucroLiquido: number;    // totalVendido - totalGasto
    totalTransacoes: number; // Contagem total
    numCompras: number;      // Apenas BUY
    numVendas: number;       // Apenas SELL
    numTrades: number;       // Apenas TRADE
}

export interface TransactionFilters {
    type: TransactionType | 'ALL';
    carta: string;
    dateStart: string;
    dateEnd: string;
}
