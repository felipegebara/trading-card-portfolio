const { Client } = require('pg');

// Removed ?sslmode=require to let config object handle SSL
const connectionString = 'postgresql://postgres:Fridameudog12@db.aweatxdukxqumpwqvmpb.supabase.co:5432/postgres';

const client = new Client({
    connectionString,
    ssl: {
        rejectUnauthorized: false
    }
});

async function fixRLS() {
    try {
        await client.connect();
        console.log('Connected to database.');

        // 1. Enable RLS on the table (just in case)
        await client.query('ALTER TABLE "public"."myp_cards_meg" ENABLE ROW LEVEL SECURITY;');
        console.log('Ensured RLS is enabled.');

        // 2. Drop existing restrictive policies if any
        await client.query('DROP POLICY IF EXISTS "Enable read access for all users" ON "public"."myp_cards_meg";');
        console.log('Dropped old policy if existed.');

        // 3. Create permissive policy
        await client.query(`
      CREATE POLICY "Enable read access for all users" 
      ON "public"."myp_cards_meg" 
      FOR SELECT 
      TO public 
      USING (true);
    `);
        console.log('Created new permissive policy: "Enable read access for all users".');

    } catch (err) {
        console.error('Error executing SQL:', err);
    } finally {
        await client.end();
        console.log('Disconnected.');
    }
}

fixRLS();
