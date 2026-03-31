require('dotenv').config({ path: 'admin/.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function run() {
  const { data, error } = await supabase
    .from('variacoes_produto')
    .select('id, nome, produto_id, produtos(nome)')
    .ilike('nome', '%long%neck%');
  
  if (error) console.error(error);
  console.log(JSON.stringify(data, null, 2));
}
run();
