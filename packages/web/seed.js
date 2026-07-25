import { createClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const key = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!url || !key) {
  console.error('SUPABASE_URL and SUPABASE_ANON_KEY must be set in environment or .env');
  process.exit(1);
}

const supabase = createClient(url, key);

async function run() {
  const { data: site } = await supabase.from('sites').select('id').eq('code', 'GIAL').single();
  if (!site) throw new Error('Site not found');

  const { data: profile } = await supabase.from('profiles').select('id').limit(1).single();
  if (!profile) {
    console.log('No user profiles found. Please sign up in the app first.');
    return;
  }

  const { data: machines } = await supabase.from('machines').select('id').eq('site_id', site.id);
  if (!machines || machines.length === 0) {
    console.log('No machines found. Run the SQL seed script first in the Supabase dashboard.');
    return;
  }

  const dates = ['2026-07-01','2026-07-02','2026-07-03','2026-07-04','2026-07-05','2026-07-06','2026-07-07'];
  const statuses = ['verified','verified','verified','verified','verified','failed','bypass'];
  const reasons = ['Low alarm volume','No alarm generated','Screen frozen','Sample trap jammed'];
  const reports = [];

  for (const date of dates) {
    for (const machine of machines) {
      if (Math.random() > 0.1) {
        const status = statuses[Math.floor(Math.random() * statuses.length)];
        reports.push({
          site_id: site.id, machine_id: machine.id, technician_id: profile.id,
          report_date: date,
          sample_count: Math.floor(Math.random() * 50) + 10,
          evk_status: status,
          verification_failure_reason: status === 'failed' ? reasons[Math.floor(Math.random() * reasons.length)] : null,
        });
      }
    }
  }

  const { error } = await supabase.from('daily_reports').insert(reports);
  if (error) throw new Error('Insert failed: ' + JSON.stringify(error));
  console.log(`Inserted ${reports.length} fake reports.`);
}

run().catch(console.error);
