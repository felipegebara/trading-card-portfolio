const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://aweatxdukxqumpwqvmpb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF3ZWF0eGR1a3hxdW1wd3F2bXBiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM0OTQ3ODcsImV4cCI6MjA3OTA3MDc4N30.kguF4fhQTOrpSoa1rzkPlVWrxi1c20J6103u28SzoVs';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testSearchData() {
    console.log('🔄 Testando conexão com myp_cards_meg...\n');

    // 1. Count total records
    const { count, error: countError } = await supabase
        .from('myp_cards_meg')
        .select('*', { count: 'exact', head: true });

    if (countError) {
        console.error('❌ Erro ao contar registros:', countError);
        return;
    }

    console.log(`📊 Total de registros na tabela: ${count}\n`);

    // 2. Get sample cards
    const { data, error } = await supabase
        .from('myp_cards_meg')
        .select('carta, url, vendedor, valor, estado')
        .order('carta', { ascending: true })
        .limit(10);

    if (error) {
        console.error('❌ Erro ao buscar dados:', error);
        return;
    }

    console.log('📋 Amostra de cartas (primeiras 10):');
    console.table(data);

    // 3. Test search for "lucario"
    const { data: lucarioData, error: lucarioError } = await supabase
        .from('myp_cards_meg')
        .select('carta, vendedor, valor')
        .ilike('carta', '%lucario%');

    if (lucarioError) {
        console.error('❌ Erro ao buscar Lucario:', lucarioError);
        return;
    }

    console.log(`\n🔍 Busca por "lucario": ${lucarioData?.length || 0} resultados encontrados`);
    if (lucarioData && lucarioData.length > 0) {
        console.table(lucarioData.slice(0, 5));
    }

    // 4. Get unique card names
    const { data: uniqueCards, error: uniqueError } = await supabase
        .from('myp_cards_meg')
        .select('carta')
        .order('carta');

    if (uniqueError) {
        console.error('❌ Erro ao buscar cartas únicas:', uniqueError);
        return;
    }

    const unique = new Set(uniqueCards?.map(c => c.carta) || []);
    console.log(`\n🎴 Total de cartas únicas: ${unique.size}`);
    console.log('🔤 Primeiras 20 cartas:');
    console.log(Array.from(unique).slice(0, 20).join(', '));
}

testSearchData().then(() => {
    console.log('\n✅ Teste concluído!');
    process.exit(0);
}).catch(err => {
    console.error('❌ Erro:', err);
    process.exit(1);
});
