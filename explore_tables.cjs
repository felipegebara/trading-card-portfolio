const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://aweatxdukxqumpwqvmpb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF3ZWF0eGR1a3hxdW1wd3F2bXBiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM0OTQ3ODcsImV4cCI6MjA3OTA3MDc4N30.kguF4fhQTOrpSoa1rzkPlVWrxi1c20J6103u28SzoVs';

const supabase = createClient(supabaseUrl, supabaseKey);

async function exploreCardTables() {
    console.log('🔍 Explorando tabelas de cartas...\n');

    const tablesToCheck = [
        'card_images',
        'myp_cards_meg',
        'cartas_precos_liga',
        'psa_raw_prices',
        'portfolio_cards'
    ];

    for (const tableName of tablesToCheck) {
        console.log(`\n${'='.repeat(60)}`);
        console.log(`📊 Tabela: ${tableName}`);
        console.log('='.repeat(60));

        try {
            // Get count
            const { count, error: countError } = await supabase
                .from(tableName)
                .select('*', { count: 'exact', head: true });

            if (countError) {
                console.log(`❌ Erro: ${countError.message}`);
                continue;
            }

            console.log(`📈 Total de registros: ${count}`);

            // Get sample data
            const { data, error } = await supabase
                .from(tableName)
                .select('*')
                .limit(3);

            if (error) {
                console.log(`❌ Erro ao buscar dados: ${error.message}`);
                continue;
            }

            if (data && data.length > 0) {
                console.log(`\n📋 Colunas disponíveis:`);
                console.log(Object.keys(data[0]).join(', '));

                console.log(`\n🔖 Amostra de dados (${data.length} registros):`);
                console.table(data);

                // Check for card name columns
                const possibleCardColumns = ['carta', 'card_name', 'nome', 'name', 'slug', 'card_slug'];
                const foundColumns = possibleCardColumns.filter(col => data[0].hasOwnProperty(col));

                if (foundColumns.length > 0) {
                    console.log(`\n🎴 Colunas de carta encontradas: ${foundColumns.join(', ')}`);

                    // Get unique count for each card column
                    for (const col of foundColumns) {
                        const { data: allData } = await supabase
                            .from(tableName)
                            .select(col);

                        if (allData) {
                            const uniqueValues = new Set(allData.map(row => row[col]).filter(v => v));
                            console.log(`   - ${col}: ${uniqueValues.size} valores únicos`);

                            // Show sample values
                            const samples = Array.from(uniqueValues).slice(0, 5);
                            console.log(`     Exemplos: ${samples.join(', ')}`);
                        }
                    }
                }
            }

        } catch (err) {
            console.log(`❌ Erro inesperado: ${err.message}`);
        }
    }

    // Search for "lucario" across tables
    console.log(`\n\n${'='.repeat(60)}`);
    console.log(`🔍 Buscando "lucario" em todas as tabelas`);
    console.log('='.repeat(60));

    for (const tableName of tablesToCheck) {
        try {
            const possibleColumns = ['carta', 'card_name', 'nome', 'name'];

            for (const col of possibleColumns) {
                const { data, error } = await supabase
                    .from(tableName)
                    .select('*')
                    .ilike(col, '%lucario%')
                    .limit(1);

                if (!error && data && data.length > 0) {
                    console.log(`✅ ${tableName}.${col}: ENCONTRADO (${data.length} resultados)`);
                }
            }
        } catch (err) {
            // Column doesn't exist, skip
        }
    }
}

exploreCardTables().then(() => {
    console.log('\n\n✅ Exploração concluída!');
    process.exit(0);
}).catch(err => {
    console.error('❌ Erro:', err);
    process.exit(1);
});
