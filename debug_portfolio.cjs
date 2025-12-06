
const { createClient } = require('@supabase/supabase-js');

// Hardcoded credentials
const SUPABASE_URL = 'https://aweatxdukxqumpwqvmpb.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF3ZWF0eGR1a3hxdW1wd3F2bXBiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM0OTQ3ODcsImV4cCI6MjA3OTA3MDc4N30.kguF4fhQTOrpSoa1rzkPlVWrxi1c20J6103u28SzoVs';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function debugPortfolio() {
    console.log('--- Checking Portfolio Data ---');

    const { data: positions, error: posError } = await supabase
        .from('portfolio_cards')
        .select('*');

    if (posError) {
        console.error('Error fetching portfolio:', posError);
        return;
    }

    console.log(`Found ${positions.length} positions in portfolio.`);

    if (positions.length === 0) return;

    for (const pos of positions.slice(0, 3)) {
        console.log(`\nChecking card: "${pos.carta}"`);

        // Check exact match in myp_cards_meg
        const { count, error: countError } = await supabase
            .from('myp_cards_meg')
            .select('*', { count: 'exact', head: true })
            .eq('carta', pos.carta);

        console.log(`Exact match count in myp_cards_meg: ${count}`);

        if (count === 0) {
            const firstWord = pos.carta.split(' ')[0];
            console.log(`Searching for first word: "${firstWord}"`);

            // Check myp_cards_meg suggestions
            const { data: suggestions } = await supabase
                .from('myp_cards_meg')
                .select('carta')
                .ilike('carta', `%${firstWord}%`)
                .limit(3);
            console.log(`Suggestions in myp_cards_meg:`, suggestions);

            // Check in cartas_precos_liga
            console.log(`Checking cartas_precos_liga for "${firstWord}"...`);
            const { count: ligaCount } = await supabase
                .from('cartas_precos_liga')
                .select('*', { count: 'exact', head: true })
                .ilike('nome', `%${firstWord}%`);

            console.log(`Matches in cartas_precos_liga (nome ILIKE %${firstWord}%): ${ligaCount}`);

            if (ligaCount > 0) {
                const { data: ligaData } = await supabase
                    .from('cartas_precos_liga')
                    .select('nome, slug_carta')
                    .ilike('nome', `%${firstWord}%`)
                    .limit(3);
                console.log('Sample matches in liga:', ligaData);
            } else {
                console.log('No matches in liga. Checking if table is accessible...');
                const { data: checkData, error: checkError } = await supabase
                    .from('cartas_precos_liga')
                    .select('nome')
                    .limit(1);

                if (checkError) {
                    console.error('Error accessing liga table:', checkError);
                    // List all tables
                    console.log('Listing all tables in public schema...');
                    // Supabase doesn't let us query information_schema directly via JS client usually, 
                    // but we can try to query a known table or just infer from errors.
                    // Let's try to query 'myp_cards_meg' again to be sure.
                    const { data: mypCheck } = await supabase.from('myp_cards_meg').select('carta').limit(1);
                    console.log('myp_cards_meg is accessible:', !!mypCheck);
                }
                else console.log('Table accessible, sample row:', checkData);
            }
        }
    }
}

debugPortfolio();
