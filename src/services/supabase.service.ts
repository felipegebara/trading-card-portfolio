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
}
