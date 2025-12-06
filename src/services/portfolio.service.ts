import { Injectable } from '@angular/core';
import { supabase } from '../supabaseClient';
import { Subject } from 'rxjs';

export type CondicaoCarta = 'NM' | 'SP' | 'MP' | 'HP' | 'D';
export type IdiomaCarta = 'PT-BR' | 'ING' | 'JPN';

export interface NovaPosicao {
    carta: string;
    preco_compra: number;
    qtd: number;
    idioma: IdiomaCarta;
    condicao: CondicaoCarta;
    data_compra: string; // ISO date (yyyy-MM-dd)
}

@Injectable({ providedIn: 'root' })
export class PortfolioService {
    private refreshSubject = new Subject<void>();
    refresh$ = this.refreshSubject.asObservable();

    notifyUpdate() {
        this.refreshSubject.next();
    }

    async addPosicao(data: NovaPosicao): Promise<void> {
        // pega usuário logado
        const { data: userData, error: userError } = await supabase.auth.getUser();
        if (userError || !userData?.user) {
            throw new Error('Usuário não autenticado');
        }

        const user_id = userData.user.id;

        const payload = {
            user_id,
            carta: data.carta,
            preco_compra: data.preco_compra,
            qtd: data.qtd,
            idioma: data.idioma,
            estado: data.condicao, // Mapped to 'estado' as per previous context/schema
            data_compra: data.data_compra,
            created_at: new Date().toISOString()
        };

        const { error } = await supabase.from('portfolio_cards').insert(payload);

        if (error) {
            console.error('Erro ao inserir em portfolio_cards', error);
            throw new Error(error.message);
        }

        this.notifyUpdate();
    }
}
