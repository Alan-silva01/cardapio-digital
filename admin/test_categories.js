const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://gyffptttlpmxmprpjife.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd5ZmZwdHR0bHBteG1wcnBqaWZlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE3OTYwNjIsImV4cCI6MjA4NzM3MjA2Mn0.FfEinutRWCiLN8Mg6JjBQcyrTcxJwZiTwfEQmkpHFVo'
);

async function check() {
  const { data: cats } = await supabase.from('categorias').select('id, nome').eq('ativo', true);
  const catMap = cats.reduce((acc, cat) => { acc[cat.id] = cat.nome; return acc; }, {});
  
  const { data: prods } = await supabase.from('produtos').select('nome, categoria_id').eq('disponivel', true).limit(5);
  console.log("Categories mapping:", cats.slice(0,3));
  console.log("Products:", prods);
  prods.forEach(p => console.log(p.nome, "-> Category Name:", catMap[p.categoria_id] || "Outros", "CatID:", p.categoria_id));
}
check();
