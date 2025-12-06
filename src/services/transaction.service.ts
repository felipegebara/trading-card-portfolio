import { Injectable, signal, computed } from '@angular/core';
import { supabase } from '../supabaseClient';

export interface Transaction {
    id: string;
    user_id: string;
    card_id?: string | null;
    tipo: 'COMPRA' | 'VENDA' | 'TRADE';
    carta: string;
    quantidade: number;
    preco_unitario: number;
    total: number;
    estado?: string;
    idioma?: string;
    notas?: string;
    data: string;
    created_at?: string;
    updated_at?: string;
}

export interface TransactionFilters {
    tipo?: 'COMPRA' | 'VENDA' | 'TRADE' | '';
    carta?: string;
    dataInicio?: string;
    dataFim?: string;
}

@Injectable({
    providedIn: 'root'
})
export class TransactionService {
    // Signals
    transactions = signal<Transaction[]>([]);
    loading = signal(false);
    error = signal<string | null>(null);

    // Computed - KPIs
    totalInvestido = computed(() => {
        return this.transactions()
            .filter(t => t.tipo === 'COMPRA')
            .reduce((sum, t) => sum + t.total, 0);
    });

    totalVendido = computed(() => {
        return this.transactions()
            .filter(t => t.tipo === 'VENDA')
            .reduce((sum, t) => sum + t.total, 0);
    });

    lucroLiquido = computed(() => {
        return this.totalVendido() - this.totalInvestido();
    });

    roi = computed(() => {
        const investido = this.totalInvestido();
        if (investido === 0) return 0;
        return ((this.lucroLiquido() / investido) * 100);
    });

    numeroTransacoes = computed(() => {
        return this.transactions().length;
    });

    // Computed - Análises
    porTipo = computed(() => {
        const transactions = this.transactions();
        return {
            compras: transactions.filter(t => t.tipo === 'COMPRA').length,
            vendas: transactions.filter(t => t.tipo === 'VENDA').length,
            trades: transactions.filter(t => t.tipo === 'TRADE').length
        };
    });

    cartasUnicas = computed(() => {
        const cartas = new Set(this.transactions().map(t => t.carta));
        return Array.from(cartas);
    });

    /**
     * Carregar todas as transações do usuário
     */
    async load(): Promise<void> {
        this.loading.set(true);
        this.error.set(null);

        try {
            console.log('📊 [TransactionService] Carregando transações...');

            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                throw new Error('Usuário não autenticado');
            }

            const { data, error } = await supabase
                .from('transactions')
                .select('*')
                .eq('user_id', user.id)
                .order('data', { ascending: false });

            if (error) throw error;

            this.transactions.set(data || []);
            console.log(`✅ [TransactionService] ${data?.length || 0} transações carregadas`);

        } catch (e: any) {
            console.error('❌ [TransactionService] Erro ao carregar:', e);
            this.error.set(e.message || 'Erro ao carregar transações');
            this.transactions.set([]);
        } finally {
            this.loading.set(false);
        }
    }

    /**
     * Criar nova transação
     */
    async create(transaction: Omit<Transaction, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<Transaction | null> {
        try {
            console.log('➕ [TransactionService] Criando transação:', transaction);

            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Usuário não autenticado');

            const { data, error } = await supabase
                .from('transactions')
                .insert([{ ...transaction, user_id: user.id }])
                .select()
                .single();

            if (error) throw error;

            await this.load(); // Recarregar lista
            console.log('✅ [TransactionService] Transação criada:', data);
            return data;

        } catch (e: any) {
            console.error('❌ [TransactionService] Erro ao criar:', e);
            this.error.set(e.message);
            return null;
        }
    }

    /**
     * Atualizar transação existente
     */
    async update(id: string, updates: Partial<Transaction>): Promise<boolean> {
        try {
            console.log('📝 [TransactionService] Atualizando:', id, updates);

            const { error } = await supabase
                .from('transactions')
                .update(updates)
                .eq('id', id);

            if (error) throw error;

            await this.load(); // Recarregar
            console.log('✅ [TransactionService] Transação atualizada');
            return true;

        } catch (e: any) {
            console.error('❌ [TransactionService] Erro ao atualizar:', e);
            this.error.set(e.message);
            return false;
        }
    }

    /**
     * Deletar transação
     */
    async delete(id: string): Promise<boolean> {
        try {
            console.log('🗑️ [TransactionService] Deletando:', id);

            const { error } = await supabase
                .from('transactions')
                .delete()
                .eq('id', id);

            if (error) throw error;

            await this.load(); // Recarregar
            console.log('✅ [TransactionService] Transação deletada');
            return true;

        } catch (e: any) {
            console.error('❌ [TransactionService] Erro ao deletar:', e);
            this.error.set(e.message);
            return false;
        }
    }

    /**
     * Buscar transações de uma carta específica
     */
    async getByCard(cardName: string): Promise<Transaction[]> {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return [];

            const { data, error } = await supabase
                .from('transactions')
                .select('*')
                .eq('user_id', user.id)
                .eq('carta', cardName)
                .order('data', { ascending: false });

            if (error) throw error;
            return data || [];

        } catch (e) {
            console.error('❌ [TransactionService] Erro ao buscar por carta:', e);
            return [];
        }
    }

    /**
     * Filtrar transações
     */
    filter(filters: TransactionFilters): Transaction[] {
        let filtered = this.transactions();

        if (filters.tipo) {
            filtered = filtered.filter(t => t.tipo === filters.tipo);
        }

        if (filters.carta) {
            filtered = filtered.filter(t =>
                t.carta.toLowerCase().includes(filters.carta!.toLowerCase())
            );
        }

        if (filters.dataInicio) {
            filtered = filtered.filter(t => t.data >= filters.dataInicio!);
        }

        if (filters.dataFim) {
            filtered = filtered.filter(t => t.data <= filters.dataFim!);
        }

        return filtered;
    }

    /**
     * Exportar para CSV
     */
    exportToCSV(transactions: Transaction[]): void {
        const headers = ['Data', 'Tipo', 'Carta', 'Quantidade', 'Preço Unit.', 'Total', 'Estado', 'Idioma', 'Notas'];
        const rows = transactions.map(t => [
            t.data,
            t.tipo,
            t.carta,
            t.quantidade,
            t.preco_unitario.toFixed(2),
            t.total.toFixed(2),
            t.estado || '',
            t.idioma || '',
            t.notas || ''
        ]);

        const csv = [
            headers.join(','),
            ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
        ].join('\n');

        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `transacoes_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();

        console.log('📥 [TransactionService] CSV exportado');
    }
}
