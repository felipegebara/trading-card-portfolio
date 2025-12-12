import { Injectable } from '@angular/core';
import { createClient, SupabaseClient, User, Session } from '@supabase/supabase-js';
import { environment } from '../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class SupabaseService {
    private supabase: SupabaseClient;

    constructor() {
        this.supabase = createClient(environment.supabase.url, environment.supabase.anonKey);
    }

    // --- Auth Methods ---

    async signUp(email: string, password: string) {
        const { data, error } = await this.supabase.auth.signUp({
            email,
            password,
        });
        if (error) throw error;
        return data;
    }

    async signIn(email: string, password: string) {
        const { data, error } = await this.supabase.auth.signInWithPassword({
            email,
            password,
        });
        if (error) throw error;
        return data;
    }

    async signOut() {
        const { error } = await this.supabase.auth.signOut();
        if (error) throw error;
    }

    async getUser(): Promise<User | null> {
        const { data: { user } } = await this.supabase.auth.getUser();
        return user;
    }

    async getSession(): Promise<Session | null> {
        const { data: { session } } = await this.supabase.auth.getSession();
        return session;
    }

    // --- Portfolio Cards Methods ---

    async getPortfolioCards() {
        // Get current user to filter data
        const user = await this.getUser();

        let query = this.supabase
            .from('portfolio_cards')
            .select('*')
            .order('data_compra', { ascending: false });

        // If user is logged in, filter by their ID
        if (user) {
            query = query.eq('user_id', user.id);
        }

        const { data, error } = await query;

        if (error) {
            console.error('Error fetching portfolio cards:', error);
            throw error;
        }

        return data;
    }

    async addPortfolioCard(card: any) {
        // Add user_id to the card
        const user = await this.getUser();
        const cardWithUser = { ...card };

        // If user is logged in, use their ID. 
        // If not (or if undefined), the DB default (auth.uid()) will handle it if authenticated.
        if (user?.id) {
            cardWithUser.user_id = user.id;
        }

        console.log('Adding card:', cardWithUser);
        console.log('Current User:', user);

        const { data, error } = await this.supabase
            .from('portfolio_cards')
            .insert([cardWithUser])
            .select();

        if (error) {
            console.error('Error adding portfolio card:', error);
            throw error;
        }

        return data;
    }

    async removePortfolioCard(id: number) {
        const { error } = await this.supabase
            .from('portfolio_cards')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Error removing portfolio card:', error);
            throw error;
        }

        return true;
    }

    async updatePortfolioCard(id: number, updates: any) {
        const { data, error } = await this.supabase
            .from('portfolio_cards')
            .update(updates)
            .eq('id', id)
            .select();

        if (error) {
            console.error('Error updating portfolio card:', error);
            throw error;
        }

        return data;
    }

    async getAvailableCards() {
        console.log('Fetching available cards from Supabase...');
        const { data, error } = await this.supabase
            .from('myp_cards_meg')
            .select('carta')
            .order('carta', { ascending: true });

        if (error) {
            console.error('Error fetching available cards:', error);
            throw error;
        }

        console.log(`Fetched ${data?.length} cards from DB`);
        const uniqueCards = [...new Set(data.map((card: any) => card.carta))];
        console.log(`Unique cards: ${uniqueCards.length}`);
        return uniqueCards;
    }

    async searchCards(term: string) {
        if (!term || term.length < 2) return [];

        const { data, error } = await this.supabase
            .from('myp_cards_meg')
            .select('carta')
            .ilike('carta', `%${term}%`)
            .limit(20)
            .order('carta', { ascending: true });

        if (error) {
            console.error('Error searching cards:', error);
            return [];
        }

        // Return unique card names
        return [...new Set(data.map((card: any) => card.carta))];
    }

    async getLanguages() {
        const { data, error } = await this.supabase
            .from('myp_cards_meg')
            .select('idioma')
            .order('idioma', { ascending: true });

        if (error) {
            console.error('Error fetching languages:', error);
            return [];
        }
        return [...new Set(data.map((item: any) => item.idioma))].filter(Boolean);
    }

    async getConditions() {
        const { data, error } = await this.supabase
            .from('myp_cards_meg')
            .select('estado')
            .order('estado', { ascending: true });

        if (error) {
            console.error('Error fetching conditions:', error);
            return [];
        }
        return [...new Set(data.map((item: any) => item.estado))].filter(Boolean);
    }

    async getArbitrageOpportunities() {
        console.log('🔄 Calculating Arbitrage Opportunities (MYP vs PriceCharting)...');

        try {
            // Exchange rate: 1 USD = 5.3 BRL
            const EXCHANGE_RATE = 5.3;

            // Step 1: Get latest PriceCharting data (RAW ungraded prices)
            // Mimics: pc_latest CTE
            const { data: pcLatestDate, error: pcDateError } = await this.supabase
                .from('pricecharting_overview')
                .select('data_coleta')
                .order('data_coleta', { ascending: false })
                .limit(1)
                .single();

            if (pcDateError) {
                console.error('Error fetching PC latest date:', pcDateError);
                return [];
            }

            const latestPcDate = pcLatestDate.data_coleta;

            // Get all PC data for that date
            const { data: pcData, error: pcError } = await this.supabase
                .from('pricecharting_overview')
                .select('card_name, ungraded_price, psa10_price, data_coleta')
                .eq('data_coleta', latestPcDate)
                .gt('ungraded_price', 0);

            if (pcError) {
                console.error('Error fetching PC data:', pcError);
                return [];
            }

            console.log(`📊 PC Data: ${pcData.length} cards loaded from ${latestPcDate}`);

            // Step 2: Get latest MYP data (ING + NM only)
            // Mimics: myp_en_nm CTE with DISTINCT ON (carta) logic
            const { data: mypLatestDate, error: mypDateError } = await this.supabase
                .from('myp_cards_meg')
                .select('data_coleta')
                .order('data_coleta', { ascending: false })
                .limit(1)
                .single();

            if (mypDateError) {
                console.error('Error fetching MYP latest date:', mypDateError);
                return [];
            }

            const latestMypDate = mypLatestDate.data_coleta;

            // Fetch ALL MYP data for latest date (ING + NM)
            const { data: mypRawData, error: mypError } = await this.supabase
                .from('myp_cards_meg')
                .select('carta, valor, idioma, estado, data_coleta, user_id')
                .eq('idioma', 'ING')
                .eq('estado', 'NM')
                .eq('data_coleta', latestMypDate)
                .order('carta', { ascending: true })
                .order('valor', { ascending: true }); // Crucial: order by price ASC

            if (mypError) {
                console.error('Error fetching MYP data:', mypError);
                return [];
            }

            console.log(`📊 MYP Data: ${mypRawData.length} offers loaded from ${latestMypDate}`);

            // Step 3: Aggregate MYP data to get DISTINCT ON (carta) - lowest price per card
            // This mimics SQL: DISTINCT ON (m.carta) ... ORDER BY m.carta, m.valor ASC
            const mypByCard = new Map<string, {
                carta: string;
                valor: number;
                data_coleta: string;
                allPrices: number[]; // For liquidity calculation
            }>();

            mypRawData.forEach(item => {
                const cardName = item.carta;
                const price = parseFloat(item.valor);

                if (!mypByCard.has(cardName)) {
                    // First occurrence = lowest price (already sorted)
                    mypByCard.set(cardName, {
                        carta: cardName,
                        valor: price, // This is the MIN price
                        data_coleta: item.data_coleta,
                        allPrices: []
                    });
                }
                // Collect all prices for liquidity metric
                mypByCard.get(cardName)!.allPrices.push(price);
            });

            console.log(`🎴 Unique MYP cards: ${mypByCard.size}`);

            // Step 4: Create PC lookup map
            const pcMap = new Map<string, { ungraded_price: number; psa10_price: number; data_pc: string }>();
            pcData.forEach(pc => {
                pcMap.set(pc.card_name.toLowerCase().trim(), {
                    ungraded_price: pc.ungraded_price,
                    psa10_price: pc.psa10_price,
                    data_pc: pc.data_coleta
                });
            });

            // Step 5: JOIN logic + Calculate metrics
            const opportunities = [];

            for (const [cardName, mypInfo] of mypByCard.entries()) {
                const normalizedName = cardName.toLowerCase().trim();
                const pcInfo = pcMap.get(normalizedName);

                if (pcInfo) {
                    // We have a match between MYP and PC!
                    const preco_compra_myp_brl = mypInfo.valor;
                    const preco_venda_raw_usd = pcInfo.ungraded_price;
                    const preco_venda_raw_brl = preco_venda_raw_usd * EXCHANGE_RATE;

                    const lucro_potencial_brl = preco_venda_raw_brl - preco_compra_myp_brl;
                    const roi_percent = ((preco_venda_raw_brl / preco_compra_myp_brl) - 1) * 100;

                    // Calculate liquidity (number of offers for this card)
                    const liquidity = mypInfo.allPrices.length;

                    // Calculate avg of top 3 lowest prices
                    const lowest3 = mypInfo.allPrices.slice(0, 3);
                    const avg_myp_3 = lowest3.reduce((a, b) => a + b, 0) / lowest3.length;

                    // Only include if it's actually an opportunity (profit > 0)
                    if (lucro_potencial_brl > 0) {
                        opportunities.push({
                            card_name: cardName,
                            card_slug: cardName, // Using name as slug
                            preco_compra_myp: preco_compra_myp_brl,
                            avg_myp_3: avg_myp_3,
                            liquidity: liquidity,
                            preco_raw_usd: preco_venda_raw_usd,
                            preco_venda_raw: preco_venda_raw_brl,
                            lucro_potencial: lucro_potencial_brl,
                            roi_percent: Math.round(roi_percent * 100) / 100, // 2 decimals
                            data_myp: mypInfo.data_coleta,
                            data_pc: pcInfo.data_pc,
                            eh_oportunidade: true
                        });
                    }
                }
            }

            // Step 6: Sort by ROI DESC (highest ROI first)
            opportunities.sort((a, b) => b.roi_percent - a.roi_percent);

            console.log(`✅ Found ${opportunities.length} arbitrage opportunities`);
            if (opportunities.length > 0) {
                console.log(`🚀 Top opportunity: ${opportunities[0].card_name} with ${opportunities[0].roi_percent}% ROI`);
            }

            return opportunities;

        } catch (error) {
            console.error('❌ Error calculating arbitrage opportunities:', error);
            return [];
        }
    }
}

