-- 1. Inserir o Produto "Gin My Lounge" (id: prod_gin_my_lounge)
INSERT INTO public.produtos (
    id,
    categoria_id,
    nome,
    slug,
    descricao,
    disponivel,
    pais_origem,
    eh_combo,
    visivel_app
) VALUES (
    'prod_gin_my_lounge',
    'cat_drinks',
    'Gin My Lounge',
    'gin-my-lounge',
    'A experiência definitiva do nosso bar. Uma combinação perfeita de morangos frescos, gin, mix de limão equilibrado, xarope aromático de frutas vermelhas e o toque cintilante e refrescante da Schweppes. Perfeito para relaxar.',
    true,
    'Brasil / Europa',
    false,
    true
)
ON CONFLICT (id) DO UPDATE SET 
    descricao = EXCLUDED.descricao,
    pais_origem = EXCLUDED.pais_origem;

-- 2. Inserir a variação: Nacional
INSERT INTO public.variacoes_produto (
    id,
    produto_id,
    nome,
    preco,
    ativo,
    ordem,
    estoque
) VALUES (
    'var_gin_lounge_nacional',
    'prod_gin_my_lounge',
    'Nacional',
    28.00,
    true,
    1,
    -1
)
ON CONFLICT (id) DO UPDATE SET 
    preco = EXCLUDED.preco;

-- 3. Inserir a variação: Importado
INSERT INTO public.variacoes_produto (
    id,
    produto_id,
    nome,
    preco,
    ativo,
    ordem,
    estoque
) VALUES (
    'var_gin_lounge_importado',
    'prod_gin_my_lounge',
    'Importado',
    31.00,
    true,
    2,
    -1
)
ON CONFLICT (id) DO UPDATE SET 
    preco = EXCLUDED.preco;
