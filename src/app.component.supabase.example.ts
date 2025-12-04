import { Component, ChangeDetectionStrategy, signal, computed, effect, OnInit } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe, DecimalPipe } from '@angular/common';
import { PortfolioChartComponent } from './components/portfolio-chart/portfolio-chart.component';
import { MarketAnalysisComponent } from './components/market-analysis/market-analysis.component';
import { SupabaseService } from './services/supabase.service';

export interface PortfolioItem {
    id: number;
    name: string;
    code: string;
    condition: string;
    language: string;
    quantity: number;
    purchaseDate: string;
    purchasePrice: number;
    currentPrice: number;
}

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [CommonModule, PortfolioChartComponent, MarketAnalysisComponent, CurrencyPipe, DatePipe, DecimalPipe],
})
export class AppComponent implements OnInit {
    // --- View State Signal ---
    activeView = signal<'portfolio' | 'market'>('portfolio');

    // --- State Signals ---
    portfolio = signal<PortfolioItem[]>([]);
    chartData = signal<{ date: string; value: number; }[]>([]);
    isAddModalOpen = signal(false);
    searchTerm = signal('');
    isLoading = signal(false);
    errorMessage = signal('');

    // --- Form Input Signals ---
    newCardName = signal('Mega Gardevoir EX');
    newPurchaseDate = signal(new Date().toISOString().split('T')[0]);
    newPurchasePrice = signal(0);
    newLanguage = signal('PT-BR');
    newCondition = signal('NM');
    newQuantity = signal(1);

    // --- Mock Dropdown Data ---
    cardOptions = ['Mega Gardevoir EX', 'Charizard VMAX', 'Pikachu Illustrator', 'Umbreon VMAX Alt Art'];
    languageOptions = ['PT-BR', 'EN', 'JP'];
    conditionOptions = ['NM', 'LP', 'MP', 'HP'];

    // --- Computed Signals for KPIs ---
    totalInvested = computed(() =>
        this.portfolio().reduce((acc, item) => acc + (item.purchasePrice * item.quantity), 0)
    );

    currentValue = computed(() =>
        this.portfolio().reduce((acc, item) => acc + (item.currentPrice * item.quantity), 0)
    );

    pnl = computed(() => this.currentValue() - this.totalInvested());

    averageRoi = computed(() => {
        const totalInvested = this.totalInvested();
        if (totalInvested === 0) return 0;
        return (this.pnl() / totalInvested);
    });

    filteredPortfolio = computed(() => {
        const term = this.searchTerm().toLowerCase();
        if (!term) {
            return this.portfolio();
        }
        return this.portfolio().filter(item =>
            item.name.toLowerCase().includes(term) ||
            item.code.toLowerCase().includes(term)
        );
    });

    constructor(private supabaseService: SupabaseService) {
        effect(() => {
            this.updateChartData(this.currentValue());
        });
    }

    async ngOnInit() {
        await this.loadPortfolioFromSupabase();
    }

    // --- Supabase Methods ---
    async loadPortfolioFromSupabase() {
        try {
            this.isLoading.set(true);
            this.errorMessage.set('');

            const data = await this.supabaseService.getPortfolioCards();

            // Map Supabase data to PortfolioItem format
            const portfolioItems: PortfolioItem[] = data.map((card: any) => ({
                id: card.id,
                name: card.name,
                code: card.code || '',
                condition: card.condition || 'NM',
                language: card.language || 'PT-BR',
                quantity: card.quantity || 1,
                purchaseDate: card.purchase_date,
                purchasePrice: parseFloat(card.purchase_price) || 0,
                currentPrice: parseFloat(card.current_price) || 0,
            }));

            this.portfolio.set(portfolioItems);
        } catch (error) {
            console.error('Error loading portfolio:', error);
            this.errorMessage.set('Failed to load portfolio from database');

            // Fallback to mock data if Supabase fails
            this.portfolio.set([
                { id: 1, name: 'Mega Gardevoir EX', code: '(117/112)- MEG', condition: 'NM', language: 'PT-BR', quantity: 1, purchaseDate: '2025-11-21', purchasePrice: 350.00, currentPrice: 780.00 },
                { id: 2, name: 'Mega Gardevoir EX', code: '(117/112)- MEG', condition: 'NM', language: 'PT-BR', quantity: 1, purchaseDate: '2024-07-11', purchasePrice: 500.00, currentPrice: 780.00 }
            ]);
        } finally {
            this.isLoading.set(false);
        }
    }

    // --- Methods ---
    setView(view: 'portfolio' | 'market') {
        this.activeView.set(view);
    }

    openModal() {
        this.isAddModalOpen.set(true);
    }

    closeModal() {
        this.isAddModalOpen.set(false);
    }

    async addPosition(event: Event) {
        event.preventDefault();
        if (this.newPurchasePrice() <= 0 || this.newQuantity() <= 0) {
            alert("Price and quantity must be positive numbers.");
            return;
        }

        try {
            this.isLoading.set(true);

            const newCard = {
                name: this.newCardName(),
                code: '(117/112)- MEG', // Mock code - you might want to make this dynamic
                condition: this.newCondition(),
                language: this.newLanguage(),
                quantity: this.newQuantity(),
                purchase_date: this.newPurchaseDate(),
                purchase_price: this.newPurchasePrice(),
                current_price: 780.00, // Mock current price - you might want to fetch this from an API
            };

            await this.supabaseService.addPortfolioCard(newCard);

            // Reload portfolio from database
            await this.loadPortfolioFromSupabase();

            // Reset form fields
            this.newPurchasePrice.set(0);
            this.newQuantity.set(1);
            this.newPurchaseDate.set(new Date().toISOString().split('T')[0]);
            this.closeModal();
        } catch (error) {
            console.error('Error adding position:', error);
            alert('Failed to add position to database');
        } finally {
            this.isLoading.set(false);
        }
    }

    async removePosition(id: number) {
        if (!confirm('Are you sure you want to remove this card from your portfolio?')) {
            return;
        }

        try {
            this.isLoading.set(true);
            await this.supabaseService.removePortfolioCard(id);

            // Reload portfolio from database
            await this.loadPortfolioFromSupabase();
        } catch (error) {
            console.error('Error removing position:', error);
            alert('Failed to remove position from database');
        } finally {
            this.isLoading.set(false);
        }
    }

    updateChartData(currentValue: number) {
        const data = [];
        const today = new Date();
        for (let i = 6; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(today.getDate() - i);
            // Simulate slight variations for a more dynamic look, ending with the current value
            const randomFactor = (i === 0) ? 1 : 1 - (Math.random() * 0.05);
            data.push({
                date: `${date.getDate()}/${date.getMonth() + 1}`,
                value: currentValue * randomFactor
            });
        }
        this.chartData.set(data);
    }

    onSearch(event: Event) {
        const target = event.target as HTMLInputElement;
        this.searchTerm.set(target.value);
    }

    // Helper for template binding
    handleSelectChange(signal: any, event: any) {
        signal.set(event.target.value);
    }

    handleInputChange(signal: any, event: any) {
        const value = event.target.value;
        signal.set(signal === this.newPurchasePrice || signal === this.newQuantity ? parseFloat(value) : value);
    }
}
