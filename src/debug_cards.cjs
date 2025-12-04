const { createClient } = require('@supabase/supabase-js');

// Hardcoded keys (same as in supabaseClient.ts)
const SUPABASE_URL = 'https://aweatxdukxqumpwqvmpb.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF3ZWF0eGR1a3hxdW1wd3F2bXBiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM0OTQ3ODcsImV4cCI6MjA3OTA3MDc4N30.kguF4fhQTOrpSoa1rzkPlVWrxi1c20J6103u28SzoVs';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function debugCards() {
    console.log('Fetching 1 row from myp_cards_meg...');

    const { data, error } = await supabase
        .from('myp_cards_meg')
        .select('*')
        .limit(1);

    if (error) {
        console.error('Error fetching cards:', error);
    } else {
        console.log('Success!');
        console.log('Number of rows returned:', data.length);
        if (data.length > 0) {
            console.log('First row structure:', JSON.stringify(data[0], null, 2));

            // Check if our mapping logic would work
            const row = data[0];
            const nome = row.carta ?? row.card_name ?? row.nome ?? row.nome_carta ?? row.titulo ?? null;
            console.log('Mapped name would be:', nome);
        } else {
            console.log('Table is empty or RLS is blocking access.');
        }
    }
}

debugCards();
