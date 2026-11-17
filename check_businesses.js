const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, 'apps', 'web', '.env.local');
const envText = fs.readFileSync(envPath, 'utf8');
const env = {};
envText.split('\n').forEach(line => {
  const parts = line.trim().split('=');
  const k = parts[0]?.trim();
  const v = parts.slice(1).join('=').trim().replace(/^["']|["']$/g, '');
  if (k) env[k] = v;
});

const client = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
async function run() {
  const { data, error } = await client.from('businesses').select('id, name, slug').order('name');
  if (error) {
    console.error('Error:', error);
  } else {
    console.log('Businesses count:', data.length);
    data.forEach(b => console.log(`- [${b.id}] slug="${b.slug}" name="${b.name}"`));
  }
}
run();
