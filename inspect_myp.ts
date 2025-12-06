
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env['SUPABASE_URL'] || 'https://your-project.supabase.co';
const supabaseKey = process.env['SUPABASE_KEY'] || 'your-anon-key';
const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectTable() {
    console.log('Inspecting myp_cards_meg...');

    const { data, error } = await supabase
        .from('myp_cards_meg')
        .select('*')
        .limit(1);

    if (error) {
        console.error('Error querying table:', error);
        return;
    }

    if (!data || data.length === 0) {
        console.log('Table is empty or does not exist.');
        return;
    }

    console.log('First record structure:', Object.keys(data[0]));
    console.log('First record sample:', data[0]);
}

inspectTable();
