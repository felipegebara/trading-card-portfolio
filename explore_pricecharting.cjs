const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://qckfzostepniozktgrhr.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFja2Z6b3N0ZXBuaW96a3RncmhyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzI1NTc2MzYsImV4cCI6MjA0ODEzMzYzNn0.Y5w7SrGzOXO48MegD-rs4uu5ucgRR5X-IfnHwQsVLr4';

const supabase = createClient(supabaseUrl, supabaseKey);

async function explorePriceChartingData() {
    console.log('🔍 Investigando estrutura de pricecharting_overview...\n');

    // Get latest date
    const { data: latestDate } = await supabase
        .from('pricecharting_overview')
        .select('data_coleta')
        .order('data_coleta', { ascending: false })
        .limit(1)
        .single();

    console.log('📅 Última data de coleta:', latestDate?.data_coleta);

    // Get sample data
    const { data, error } = await supabase
        .from('pricecharting_overview')
        .select('*')
        .eq('data_coleta', latestDate?.data_coleta)
        .limit(3);

    if (error) {
        console.error('❌ Erro:', error);
        return;
    }

    console.log('\n📊 Sample data (primeiros 3 registros):\n');
    data.forEach((row, i) => {
        console.log(`--- Registro ${i + 1} ---`);
        console.log('Card Name:', row.card_name);
        console.log('Campos disponíveis:', Object.keys(row));
        console.log('Dados completos:', JSON.stringify(row, null, 2));
        console.log('');
    });

    // Check which fields have sales/volume data
    console.log('\n🔍 Buscando campos relacionados a vendas/volume:');
    const sampleRow = data[0];
    const salesFields = Object.keys(sampleRow).filter(key =>
        key.toLowerCase().includes('sale') ||
        key.toLowerCase().includes('sold') ||
        key.toLowerCase().includes('volume') ||
        key.toLowerCase().includes('qty') ||
        key.toLowerCase().includes('quantity')
    );

    console.log('Campos de vendas encontrados:', salesFields);
    salesFields.forEach(field => {
        console.log(`  - ${field}: ${sampleRow[field]}`);
    });

    // Check PSA/graded fields
    console.log('\n🎯 Buscando campos de PSA/Gradação:');
    const psaFields = Object.keys(sampleRow).filter(key =>
        key.toLowerCase().includes('psa') ||
        key.toLowerCase().includes('grade') ||
        key.toLowerCase().includes('graded')
    );

    console.log('Campos PSA encontrados:', psaFields);
    psaFields.forEach(field => {
        console.log(`  - ${field}: ${sampleRow[field]}`);
    });

    // Check price fields
    console.log('\n💰 Buscando campos de preço:');
    const priceFields = Object.keys(sampleRow).filter(key =>
        key.toLowerCase().includes('price') ||
        key.toLowerCase().includes('valor')
    );

    console.log('Campos de preço encontrados:', priceFields);
    priceFields.forEach(field => {
        console.log(`  - ${field}: ${sampleRow[field]}`);
    });
}

explorePriceChartingData();
