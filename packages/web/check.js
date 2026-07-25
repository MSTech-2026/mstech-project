import { createClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const key = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!url || !key) {
  console.error('SUPABASE_URL and SUPABASE_ANON_KEY must be set in environment or .env');
  process.exit(1);
}

const supabase = createClient(url, key);

async function run() {
  const { data } = await supabase.from('sites').select('*');
  console.log(data);
}

run();
