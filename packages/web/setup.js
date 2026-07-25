import { createClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const key = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!url || !key) {
  console.error('SUPABASE_URL and SUPABASE_ANON_KEY must be set in environment or .env');
  process.exit(1);
}

const supabase = createClient(url, key);

async function run() {
  const { data, error } = await supabase.from('sites').insert({
    name: 'Guwahati International Airport', code: 'GIAL', location: 'Guwahati, Assam'
  }).select().single();
  console.log('Site insert:', error || data);
}

run();
