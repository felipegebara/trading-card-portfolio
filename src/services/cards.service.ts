import { Injectable } from '@angular/core';
import { supabase } from '../supabaseClient';

@Injectable({ providedIn: 'root' })
export class CardsService {
    async listCardNames(): Promise<string[]> {
        console.log('CardsService: Buscando cartas no Supabase...');

        const { data, error } = await supabase
            .from('myp_cards_meg')
            .select('carta')
            .order('carta', { ascending: true });

        console.log('CardsService: data =', data);
        console.log('CardsService: error =', error);

        if (error || !data) {
            console.error('CardsService: erro ao carregar cartas', error);
            return [];
        }

        // dedup + filtra nulos
        const names = Array.from(
            new Set(
                data
                    .map((row: any) => row.carta as string | null)
                    .filter((name): name is string => !!name && name.trim().length > 0),
            ),
        );

        console.log(`CardsService: ${names.length} cartas encontradas após mapeamento.`, names);
        return names;
    }
}
