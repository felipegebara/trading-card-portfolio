import { SalesFlowData } from '../models/sales-flow.model';

/**
 * Interface for market offers (matching the component's MarketOffer)
 */
export interface MarketOffer {
    id?: string;
    date: Date;
    price: number;
    source: 'liga' | 'myp';
    condition?: string;
    language?: string;
    seller?: string;
}

/**
 * Creates a unique identifier for an offer based on seller and price
 * This mimics the SQL query logic: url + vendedor
 */
function getOfferKey(offer: MarketOffer): string {
    // Use id if available, otherwise seller + price
    // In the SQL, this would be url + vendedor
    const sellerId = offer.id || offer.seller || 'unknown';
    return `${sellerId}_${offer.price}`;
}

/**
 * Detects real sales by identifying offers that disappeared between consecutive days
 * 
 * Logic:
 * - VENDA REAL = estava no D-1 e sumiu no D
 * - Compares offers from previous day with current day
 * - If an offer (identified by seller + price) existed in D-1 but not in D, it was sold
 * 
 * @param offers - Array of all market offers for a card
 * @returns SalesFlowData with real sales metrics
 */
export function detectRealSales(offers: MarketOffer[]): SalesFlowData | null {
    if (offers.length === 0) return null;

    console.log('🔍 [Sales Detection] Starting real sales detection...');
    console.log(`📊 [Sales Detection] Processing ${offers.length} total offers`);

    // Group offers by day
    const offersByDay = new Map<string, MarketOffer[]>();
    offers.forEach(offer => {
        const dateKey = offer.date.toISOString().split('T')[0];
        if (!offersByDay.has(dateKey)) {
            offersByDay.set(dateKey, []);
        }
        offersByDay.get(dateKey)!.push(offer);
    });

    const sortedDates = Array.from(offersByDay.keys()).sort();
    console.log(`📅 [Sales Detection] Found ${sortedDates.length} unique days`);

    if (sortedDates.length < 2) {
        console.warn('⚠️ [Sales Detection] Need at least 2 days of data');
        return null;
    }

    // Calculate sales for the last 7 days by comparing consecutive days
    const last8Days = sortedDates.slice(-8); // Need 8 days to get 7 days of sales
    const salesHistory: { date: string; sales: number }[] = [];

    let totalSales = 0;
    let totalVolume = 0;
    let todaySellers = new Set<string>();
    let yesterdaySales = 0;
    let yesterdayVolume = 0;

    console.log('🔄 [Sales Detection] Processing daily comparisons...');

    // Process each consecutive pair of days to find sales
    for (let i = 1; i < last8Days.length; i++) {
        const prevDay = last8Days[i - 1];
        const currentDay = last8Days[i];

        const prevDayOffers = offersByDay.get(prevDay) || [];
        const currentDayOffers = offersByDay.get(currentDay) || [];

        console.log(`  📆 Comparing ${prevDay} (${prevDayOffers.length} offers) → ${currentDay} (${currentDayOffers.length} offers)`);

        // Create a Set of unique offer identifiers for current day
        const currentDayKeys = new Set(
            currentDayOffers.map(o => getOfferKey(o))
        );

        // Find offers that existed in prevDay but disappeared in currentDay = SOLD
        const soldOffers = prevDayOffers.filter(o => {
            const key = getOfferKey(o);
            return !currentDayKeys.has(key);
        });

        const daySales = soldOffers.length;
        const dayVolume = soldOffers.reduce((sum, o) => sum + o.price, 0);

        console.log(`     💰 Sales detected: ${daySales} (R$ ${dayVolume.toFixed(2)})`);

        // Collect unique sellers from sold offers
        soldOffers.forEach(o => {
            if (o.seller) todaySellers.add(o.seller);
        });

        // Store history for chart
        salesHistory.push({
            date: currentDay,
            sales: daySales
        });

        // If this is the most recent day, save as "today"
        if (i === last8Days.length - 1) {
            totalSales = daySales;
            totalVolume = dayVolume;
            console.log(`  ✅ Today's sales: ${totalSales} (R$ ${totalVolume.toFixed(2)})`);
        }

        // If this is the second-to-last day, save as "yesterday"
        if (i === last8Days.length - 2) {
            yesterdaySales = daySales;
            yesterdayVolume = dayVolume;
            console.log(`  📊 Yesterday's sales: ${yesterdaySales} (R$ ${yesterdayVolume.toFixed(2)})`);
        }
    }

    const avgTicket = totalSales > 0 ? totalVolume / totalSales : 0;

    // Seller flow analysis
    const yesterdayDay = last8Days[last8Days.length - 2];
    const todayDay = last8Days[last8Days.length - 1];

    const prevDayOffers = offersByDay.get(yesterdayDay) || [];
    const currentDayOffers = offersByDay.get(todayDay) || [];

    const prevDaySellers = new Set(prevDayOffers.map(o => o.seller).filter(Boolean));
    const currentDaySellers = new Set(currentDayOffers.map(o => o.seller).filter(Boolean));

    const newSellers = Array.from(currentDaySellers).filter(s => !prevDaySellers.has(s)).length;
    const lostSellers = Array.from(prevDaySellers).filter(s => !currentDaySellers.has(s)).length;
    const returningSellers = 0; // Would need historical data beyond 2 days

    // Comparisons vs yesterday
    const diffSalesPct = yesterdaySales > 0
        ? ((totalSales - yesterdaySales) / yesterdaySales) * 100
        : (totalSales > 0 ? 100 : 0);
    const diffVolumePct = yesterdayVolume > 0
        ? ((totalVolume - yesterdayVolume) / yesterdayVolume) * 100
        : (totalVolume > 0 ? 100 : 0);

    console.log('📈 [Sales Detection] Final metrics:');
    console.log(`  - Total sales today: ${totalSales}`);
    console.log(`  - Volume: R$ ${totalVolume.toFixed(2)}`);
    console.log(`  - Avg ticket: R$ ${avgTicket.toFixed(2)}`);
    console.log(`  - Active sellers: ${todaySellers.size}`);
    console.log(`  - Δ sales: ${diffSalesPct > 0 ? '+' : ''}${diffSalesPct.toFixed(1)}%`);
    console.log(`  - Δ volume: ${diffVolumePct > 0 ? '+' : ''}${diffVolumePct.toFixed(1)}%`);

    return {
        summary: {
            totalSales,
            totalVolume,
            avgTicket,
            activeSellers: todaySellers.size,
            diffSalesPct,
            diffVolumePct,
            newSellers,
            returningSellers,
            lostSellers
        },
        history: salesHistory.slice(-7) // Last 7 days only
    };
}
