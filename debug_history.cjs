
const { createClient } = require('@supabase/supabase-js');

// Hardcoded credentials from src/supabaseClient.ts
const SUPABASE_URL = 'https://aweatxdukxqumpwqvmpb.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF3ZWF0eGR1a3hxdW1wd3F2bXBiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM0OTQ3ODcsImV4cCI6MjA3OTA3MDc4N30.kguF4fhQTOrpSoa1rzkPlVWrxi1c20J6103u28SzoVs';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function debugHistory() {
    const slug = 'Lucario'; // Try a simple name first, or maybe one from the table
    console.log(`Testing fetchMarketHistory for "${slug}"...`);

    // 1. Fetch from Liga
    const { data: ligaData, error: ligaError } = await supabase
        .from('cartas_precos_liga')
        .select('*')
        // Simulating: .or(`slug_carta.eq.${slug},nome.eq.${slug},carta.eq.${slug}`)
        // Note: In raw JS client, .or syntax is string based.
        .or(`slug_carta.ilike.%${slug}%,nome.ilike.%${slug}%,carta.ilike.%${slug}%`)
        .limit(5);

    if (ligaError) console.error('Liga Error:', ligaError);
    else console.log('Liga Data:', ligaData?.length, ligaData ? ligaData[0] : 'None');

    // 2. Fetch from MYP
    const { data: mypData, error: mypError } = await supabase
        .from('myp_cards_meg')
        .select('*')
        .ilike('carta', `%${slug}%`) // Using ilike for broader match in debug
        .limit(5);

    if (mypError) console.error('MYP Error:', mypError);
    else console.log('MYP Data:', mypData?.length, mypData ? mypData[0] : 'None');
}

debugHistory();
