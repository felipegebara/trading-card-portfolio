const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://aweatxdukxqumpwqvmpb.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF3ZWF0eGR1a3hxdW1wd3F2bXBiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM0OTQ3ODcsImV4cCI6MjA3OTA3MDc4N30.kguF4fhQTOrpSoa1rzkPlVWrxi1c20J6103u28SzoVs';

console.log('Testing Supabase connection...');
console.log('URL:', SUPABASE_URL);

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testConnection() {
    try {
        const { data, error } = await supabase.from('myp_cards_meg').select('count', { count: 'exact', head: true });

        if (error) {
            console.error('Connection failed:', error.message);
            console.error('Details:', error);
        } else {
            console.log('Connection successful!');
            console.log('Data:', data); // Should be null for head:true but no error means connection worked
        }
    } catch (err) {
        console.error('Unexpected error:', err);
    }
}

testConnection();
