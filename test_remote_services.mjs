import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://lmpfrrkqdevxkgimvnfw.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxtcGZycmtxZGV2eGtnaW12bmZ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEwODQwODEsImV4cCI6MjA3NjY2MDA4MX0.ncKoYnEjfh4Y1HSRflWDOA6LJcYO4TnOBob2wB17T6U';

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('Test de connexion au Supabase distant...');

try {
  const { data, error } = await supabase
    .from('services')
    .select('*')
    .order('order_index');
  
  if (error) {
    console.error('Erreur:', error);
  } else {
    console.log(`Nombre de services trouvés: ${data?.length || 0}`);
    console.log('Services:', JSON.stringify(data, null, 2));
  }
} catch (e) {
  console.error('Exception:', e);
}
