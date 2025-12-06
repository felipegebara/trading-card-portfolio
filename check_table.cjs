
const { createClient } = require('@supabase/supabase-js');

// Hardcoded credentials from src/supabaseClient.ts
const SUPABASE_URL = 'https://aweatxdukxqumpwqvmpb.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF3ZWF0eGR1a3hxdW1wd3F2bXBiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM0OTQ3ODcsImV4cCI6MjA3OTA3MDc4N30.kguF4fhQTOrpSoa1rzkPlVWrxi1c20J6103u28SzoVs';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function checkTable() {
    console.log('Checking cartas_precos_liga...');
    const { data, error } = await supabase
        .from('cartas_precos_liga')
        .select('count', { count: 'exact', head: true });

    if (error) {
        console.error('Error:', error);
    } else {
        console.log('Table exists. Row count:', data); // data is null for head:true with count, count is in property
    }
}

checkTable();
