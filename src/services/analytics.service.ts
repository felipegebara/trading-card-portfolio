import { Injectable, computed } from '@angular/core';
import { TransactionService, Transaction } from './transaction.service';

export interface CardAnalytics {
    carta: string;
    totalComprado: number;
    totalVendido: number;
    lucro: number;
    roi: number;
    quantidade: number;
    precoMedio: number;
    tempoMedioPosse?: number; // em dias
}

export interface MonthlyData {
    mes: string;
    compras: number;
    vendas: number;
    lucro: number;
}

@Injectable({
    providedIn: 'root'
})
export class AnalyticsService {

    constructor(private transactionService: TransactionService) { }

    /**
     * Análise por carta individual
     */
    cardAnalytics = computed((): CardAnalytics[] => {
        const transactions = this.transactionService.transactions();
        const cartasMap = new Map<string, Transaction[]>();

        // Agrupar por carta
        transactions.forEach(t => {
            if (!cartasMap.has(t.carta)) {
                cartasMap.set(t.carta, []);
            }
            cartasMap.get(t.carta)!.push(t);
        });

        // Calcular analytics para cada carta
        const analytics: CardAnalytics[] = [];

        cartasMap.forEach((trans, carta) => {
            const compras = trans.filter(t => t.tipo === 'COMPRA');
            const vendas = trans.filter(t => t.tipo === 'VENDA');

            const totalComprado = compras.reduce((sum, t) => sum + t.total, 0);
            const totalVendido = vendas.reduce((sum, t) => sum + t.total, 0);
            const lucro = totalVendido - totalComprado;
            const roi = totalComprado > 0 ? (lucro / totalComprado) * 100 : 0;

            const quantidade = compras.reduce((sum, t) => sum + t.quantidade, 0) -
                vendas.reduce((sum, t) => sum + t.quantidade, 0);

            const precoMedio = compras.length > 0
                ? compras.reduce((sum, t) => sum + t.preco_unitario, 0) / compras.length
                : 0;

            analytics.push({
                carta,
                totalComprado,
                totalVendido,
                lucro,
                roi,
                quantidade,
                precoMedio
            });
        });

        return analytics.sort((a, b) => b.lucro - a.lucro);
    });

    /**
     * Carta mais lucrativa
     */
    cartaMaisLucrativa = computed((): CardAnalytics | null => {
        const analytics = this.cardAnalytics();
        return analytics.length > 0 ? analytics[0] : null;
    });

    /**
     * Carta com maior prejuízo
     */
    cartaMaiorPrejuizo = computed((): CardAnalytics | null => {
        const analytics = this.cardAnalytics();
        const comPrejuizo = analytics.filter(c => c.lucro < 0);
        return comPrejuizo.length > 0
            ? comPrejuizo[comPrejuizo.length - 1]
            : null;
    });

    /**
     * Ticket médio por compra
     */
    ticketMedioCompra = computed((): number => {
        const compras = this.transactionService.transactions()
            .filter(t => t.tipo === 'COMPRA');

        if (compras.length === 0) return 0;

        const totalGasto = compras.reduce((sum, t) => sum + t.total, 0);
        return totalGasto / compras.length;
    });

    /**
     * Evolução mensal (para gráfico)
     */
    evolucaoMensal = computed((): MonthlyData[] => {
        const transactions = this.transactionService.transactions();
        const monthlyMap = new Map<string, { compras: number; vendas: number }>();

        transactions.forEach(t => {
            const mes = t.data.substring(0, 7); // YYYY-MM

            if (!monthlyMap.has(mes)) {
                monthlyMap.set(mes, { compras: 0, vendas: 0 });
            }

            const data = monthlyMap.get(mes)!;
            if (t.tipo === 'COMPRA') {
                data.compras += t.total;
            } else if (t.tipo === 'VENDA') {
                data.vendas += t.total;
            }
        });

        // Converter para array e ordenar
        const result: MonthlyData[] = [];
        let lucroAcumulado = 0;

        Array.from(monthlyMap.entries())
            .sort((a, b) => a[0].localeCompare(b[0]))
            .forEach(([mes, data]) => {
                lucroAcumulado += data.vendas - data.compras;
                result.push({
                    mes: this.formatarMes(mes),
                    compras: data.compras,
                    vendas: data.vendas,
                    lucro: lucroAcumulado
                });
            });

        return result;
    });

    /**
     * Distribuição por tipo
     */
    distribuicaoPorTipo = computed(() => {
        const transactions = this.transactionService.transactions();
        const total = transactions.length;

        if (total === 0) {
            return { compra: 0, venda: 0, trade: 0 };
        }

        const compras = transactions.filter(t => t.tipo === 'COMPRA').length;
        const vendas = transactions.filter(t => t.tipo === 'VENDA').length;
        const trades = transactions.filter(t => t.tipo === 'TRADE').length;

        return {
            compra: (compras / total) * 100,
            venda: (vendas / total) * 100,
            trade: (trades / total) * 100
        };
    });

    /**
     * Top 5 cartas mais negociadas
     */
    top5CartasNegociadas = computed((): { carta: string; transacoes: number }[] => {
        const transactions = this.transactionService.transactions();
        const countMap = new Map<string, number>();

        transactions.forEach(t => {
            countMap.set(t.carta, (countMap.get(t.carta) || 0) + 1);
        });

        return Array.from(countMap.entries())
            .map(([carta, transacoes]) => ({ carta, transacoes }))
            .sort((a, b) => b.transacoes - a.transacoes)
            .slice(0, 5);
    });

    /**
     * Helpers
     */
    private formatarMes(mesISO: string): string {
        const [ano, mes] = mesISO.split('-');
        const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
            'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
        return `${meses[parseInt(mes) - 1]}/${ano.substring(2)}`;
    }

    /**
     * Calcular ROI de uma carta específica
     */
    calcularROICarta(cardName: string): number {
        const analytics = this.cardAnalytics().find(c => c.carta === cardName);
        return analytics?.roi || 0;
    }

    /**
     * Obter transações de uma carta
     */
    getTransacoesCarta(cardName: string): Transaction[] {
        return this.transactionService.transactions()
            .filter(t => t.carta === cardName)
            .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());
    }
}
