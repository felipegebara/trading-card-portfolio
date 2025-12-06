
const { createClient } = require('@supabase/supabase-js');

// Hardcoded credentials from src/supabaseClient.ts
const SUPABASE_URL = 'https://aweatxdukxqumpwqvmpb.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF3ZWF0eGR1a3hxdW1wd3F2bXBiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM0OTQ3ODcsImV4cCI6MjA3OTA3MDc4N30.kguF4fhQTOrpSoa1rzkPlVWrxi1c20J6103u28SzoVs';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function debugSchema() {
    console.log('Inspecting myp_cards_meg schema...');

    const { data, error } = await supabase
        .from('myp_cards_meg')
        .select('*')
        .limit(1);

    if (error) {
        console.error('Error fetching row:', error);
    } else if (data && data.length > 0) {
        console.log('Available columns:', Object.keys(data[0]));
        console.log('First row:', data[0]);
    } else {
        console.log('Table is empty.');
    }
}

debugSchema();
