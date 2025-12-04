export type TransactionType = 'BUY' | 'SELL' | 'TRADE';

export interface Transaction {
    id: string;
    user_id: string;
    transaction_type: TransactionType;
    carta: string;
    quantidade: number;
    preco_unitario: number;
    valor_total: number;
    idioma?: string;
    estado?: string;
    data_transacao: string;
    notas?: string;
    created_at: string;
    updated_at: string;
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
