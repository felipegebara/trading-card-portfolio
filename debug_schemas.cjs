
const { createClient } = require('@supabase/supabase-js');

// Hardcoded credentials from src/supabaseClient.ts
const SUPABASE_URL = 'https://aweatxdukxqumpwqvmpb.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF3ZWF0eGR1a3hxdW1wd3F2bXBiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM0OTQ3ODcsImV4cCI6MjA3OTA3MDc4N30.kguF4fhQTOrpSoa1rzkPlVWrxi1c20J6103u28SzoVs';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function debugSchemas() {
    console.log('--- Inspecting card_images ---');
    const { data: images, error: imagesError } = await supabase
        .from('card_images')
        .select('*')
        .limit(1);

    if (imagesError) {
        console.error('Error fetching card_images:', imagesError);
    } else if (images && images.length) {
        console.log('Columns:', Object.keys(images[0]));
        console.log('Sample:', images[0]);
    } else {
        console.log('card_images table is empty or does not exist.');
    }
}

debugSchemas();
