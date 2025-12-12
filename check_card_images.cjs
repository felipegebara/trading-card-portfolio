const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://aweatxdukxqumpwqvmpb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF3ZWF0eGR1a3hxdW1wd3F2bXBiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM0OTQ3ODcsImV4cCI6MjA3OTA3MDc4N30.kguF4fhQTOrpSoa1rzkPlVWrxi1c20J6103u28SzoVs';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkCardImages() {
    console.log('🔍 Investigando tabela card_images...\n');

    // Get total count
    const { count, error: countError } = await supabase
        .from('card_images')
        .select('*', { count: 'exact', head: true });

    console.log(`📊 Total de registros: ${count}\n`);

    // Get all unique card names
    const { data, error } = await supabase
        .from('card_images')
        .select('carta')
        .order('carta');

    if (error) {
        console.error('❌ Erro:', error);
        return;
    }

    const uniqueCards = new Set(data.map(row => row.carta).filter(c => c));
    console.log(`🎴 Cartas únicas: ${uniqueCards.size}\n`);
    console.log('📋 Primeiras 30 cartas:');
    console.log(Array.from(uniqueCards).slice(0, 30).join('\n'));

    // Search for lucario
    const { data: lucarioData } = await supabase
        .from('card_images')
        .select('*')
        .ilike('carta', '%lucario%');

    console.log(`\n\n🔍 Busca por "lucario": ${lucarioData?.length || 0} resultados`);
    if (lucarioData && lucarioData.length > 0) {
        console.log('📋 Resultados:');
        console.table(lucarioData);
    }

    // Search for charizard
    const { data: charizardData } = await supabase
        .from('card_images')
        .select('*')
        .ilike('carta', '%charizard%');

    console.log(`\n🔍 Busca por "charizard": ${charizardData?.length || 0} resultados`);
}

checkCardImages().then(() => {
    console.log('\n✅ Teste concluído!');
    process.exit(0);
}).catch(err => {
    console.error('❌ Erro:', err);
    process.exit(1);
});
