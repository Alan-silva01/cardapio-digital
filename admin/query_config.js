import { createClient } from "@supabase/supabase-js";
import 'dotenv/config';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function run() {
  const { data: config, error } = await supabase.from('configuracoes').select('*').limit(1);
  if (error) console.error("Error", error);
  else console.log("Configuracoes:", JSON.stringify(config, null, 2));

  // Check if a table named horarios exists
  const { data: horarios, error: err2 } = await supabase.from('horarios').select('*').limit(1);
  if (err2) console.error("No horarios table maybe?");
  else console.log("Horarios:", JSON.stringify(horarios, null, 2));
}

run();
