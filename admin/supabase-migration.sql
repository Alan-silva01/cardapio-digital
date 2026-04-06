CREATE OR REPLACE FUNCTION public.criar_pedido_seguro(p_mesa_token text, p_nome_pessoa text, p_itens jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_mesa_id TEXT;
  v_mesa_numero SMALLINT;
  v_comanda_id TEXT;
  v_pedido_id TEXT;
  v_total NUMERIC := 0;
  v_item JSONB;
  v_preco_unitario NUMERIC;
  v_produto_nome TEXT;
  v_variacao_nome TEXT;
  v_itens_insert JSONB := '[]'::jsonb;
  v_item_count INT;
  v_programacao JSONB;
  v_promocao_ativa BOOLEAN;
  v_promocoes_legacy JSONB;
  v_active_promos JSONB := '[]'::jsonb;
  v_status_result JSONB;
BEGIN
  -- ★ NEW: Check if establishment is open BEFORE processing the order
  v_status_result := public.is_establishment_open();
  IF NOT (v_status_result->>'open')::boolean THEN
    RETURN jsonb_build_object(
      'error', 'O estabelecimento está fechado no momento. Não é possível realizar pedidos.',
      'closed', true
    );
  END IF;

  -- 1. Validate input
  v_item_count := jsonb_array_length(p_itens);
  IF v_item_count = 0 OR v_item_count > 50 THEN
    RETURN jsonb_build_object('error', 'Carrinho vazio ou com itens demais (máx 50).');
  END IF;

  -- 2. Validate mesa token
  SELECT id, numero INTO v_mesa_id, v_mesa_numero
  FROM public.mesas
  WHERE token = p_mesa_token;

  IF v_mesa_id IS NULL THEN
    RETURN jsonb_build_object('error', 'Mesa não encontrada. Por favor, leia o QR Code novamente.');
  END IF;

  -- 3. Find or create open comanda
  SELECT id INTO v_comanda_id
  FROM public.comandas
  WHERE mesa_id = v_mesa_id AND status = 'aberta'
  LIMIT 1;

  IF v_comanda_id IS NULL THEN
    INSERT INTO public.comandas (mesa_id, status, qtd_pessoas)
    VALUES (v_mesa_id, 'aberta', 1)
    RETURNING id INTO v_comanda_id;
  END IF;

  -- ★ Load active promotions
  SELECT programacao_semanal, promocao_ativa, promocoes
  INTO v_programacao, v_promocao_ativa, v_promocoes_legacy
  FROM public.configuracoes
  WHERE id = 'global'
  LIMIT 1;

  IF FOUND THEN
    DECLARE
      v_now TIMESTAMP := (NOW() AT TIME ZONE 'America/Sao_Paulo')::TIMESTAMP;
      v_dia JSONB;
      v_dia_inicio TIMESTAMP;
      v_dia_fim TIMESTAMP;
      v_found_new_promos BOOLEAN := FALSE;
    BEGIN
      -- Check programacao_semanal (new system)
      IF v_programacao IS NOT NULL AND jsonb_typeof(v_programacao) = 'array' THEN
        FOR v_dia IN SELECT * FROM jsonb_array_elements(v_programacao)
        LOOP
          BEGIN
            v_dia_inicio := (v_dia->>'inicio')::TIMESTAMP;
            v_dia_fim := (v_dia->>'fim')::TIMESTAMP;
          EXCEPTION WHEN OTHERS THEN
            CONTINUE;
          END;

          IF v_now >= v_dia_inicio AND v_now <= v_dia_fim
             AND v_dia->'promocoes' IS NOT NULL
             AND jsonb_array_length(v_dia->'promocoes') > 0 THEN
            v_active_promos := v_dia->'promocoes';
            v_found_new_promos := TRUE;
            EXIT;
          END IF;
        END LOOP;
      END IF;

      -- Fallback: legacy promocoes system
      IF NOT v_found_new_promos AND COALESCE(v_promocao_ativa, FALSE) = TRUE AND v_promocoes_legacy IS NOT NULL AND jsonb_typeof(v_promocoes_legacy) = 'array' THEN
        DECLARE
          v_promo JSONB;
          v_promo_inicio TIMESTAMPTZ;
          v_promo_fim TIMESTAMPTZ;
        BEGIN
          FOR v_promo IN SELECT * FROM jsonb_array_elements(v_promocoes_legacy)
          LOOP
            v_promo_inicio := CASE WHEN v_promo->>'inicio' IS NOT NULL THEN (v_promo->>'inicio')::TIMESTAMPTZ ELSE NULL END;
            v_promo_fim := CASE WHEN v_promo->>'fim' IS NOT NULL THEN (v_promo->>'fim')::TIMESTAMPTZ ELSE NULL END;
            
            IF (v_promo_inicio IS NULL OR v_now >= v_promo_inicio)
               AND (v_promo_fim IS NULL OR v_now <= v_promo_fim) THEN
              v_active_promos := v_active_promos || jsonb_build_array(v_promo);
            END IF;
          END LOOP;
        END;
      END IF;
    END;
  END IF;

  -- 4. Validate each item and calculate prices server-side
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_itens)
  LOOP
    DECLARE
      v_pid TEXT := v_item->>'produto_id';
      v_vid TEXT := v_item->>'variacao_id';
      v_qty INT := COALESCE((v_item->>'quantidade')::INT, 1);
      v_obs TEXT := v_item->>'observacao';
      v_produto_disponivel BOOLEAN;
      v_variacao_ativa BOOLEAN;
      v_variacao_estoque INT;
      v_produto_grupo TEXT;
      v_promo_match JSONB := NULL;
      v_promo_candidate JSONB;
      v_actual_var_id TEXT;
    BEGIN
      IF v_qty < 1 OR v_qty > 99 THEN
        RETURN jsonb_build_object('error', 'Quantidade inválida para um dos itens.');
      END IF;

      SELECT nome, disponivel, grupo_id_sabor INTO v_produto_nome, v_produto_disponivel, v_produto_grupo
      FROM public.produtos
      WHERE id = v_pid;

      IF v_produto_nome IS NULL THEN
        RETURN jsonb_build_object('error', format('Produto "%s" não encontrado.', v_pid));
      END IF;

      IF NOT v_produto_disponivel THEN
        RETURN jsonb_build_object('error', format('Produto "%s" não está disponível.', v_produto_nome));
      END IF;

      -- Get base price from variacoes_produto
      IF v_vid IS NOT NULL THEN
        SELECT preco, nome, ativo, estoque, id
        INTO v_preco_unitario, v_variacao_nome, v_variacao_ativa, v_variacao_estoque, v_actual_var_id
        FROM public.variacoes_produto
        WHERE id = v_vid AND produto_id = v_pid;
      ELSE
        SELECT preco, nome, ativo, estoque, id
        INTO v_preco_unitario, v_variacao_nome, v_variacao_ativa, v_variacao_estoque, v_actual_var_id
        FROM public.variacoes_produto
        WHERE produto_id = v_pid AND ativo = true
        ORDER BY ordem ASC
        LIMIT 1;
      END IF;

      IF v_preco_unitario IS NULL THEN
        RETURN jsonb_build_object('error', format('Variação do produto "%s" não encontrada.', v_produto_nome));
      END IF;

      IF NOT v_variacao_ativa THEN
        RETURN jsonb_build_object('error', format('Variação "%s" de "%s" está indisponível.', v_variacao_nome, v_produto_nome));
      END IF;

      IF v_variacao_estoque != -1 AND v_variacao_estoque < v_qty THEN
        RETURN jsonb_build_object('error', format('Estoque insuficiente para "%s - %s". Disponível: %s.', v_produto_nome, v_variacao_nome, v_variacao_estoque));
      END IF;

      -- ★ Check if this product has an active promotion
      IF jsonb_array_length(v_active_promos) > 0 THEN
        FOR v_promo_candidate IN SELECT * FROM jsonb_array_elements(v_active_promos)
        LOOP
          -- Match by grupo (flavor group)
          IF COALESCE((v_promo_candidate->>'aplicar_grupo')::BOOLEAN, FALSE) = TRUE
             AND v_produto_grupo IS NOT NULL
             AND v_promo_candidate->>'grupo_id_sabor' = v_produto_grupo
             AND v_promo_candidate->>'preco' IS NOT NULL THEN
            IF v_promo_candidate->>'variacao_id' IS NULL
               OR v_promo_candidate->>'variacao_id' = ''
               OR v_promo_candidate->>'variacao_id' = v_actual_var_id THEN
              v_promo_match := v_promo_candidate;
              EXIT;
            END IF;
          END IF;

          -- Match by exact product_id
          IF v_promo_candidate->>'produto_id' = v_pid
             AND v_promo_candidate->>'preco' IS NOT NULL THEN
            IF v_promo_candidate->>'variacao_id' IS NULL
               OR v_promo_candidate->>'variacao_id' = ''
               OR v_promo_candidate->>'variacao_id' = v_actual_var_id THEN
              v_promo_match := v_promo_candidate;
              EXIT;
            END IF;
          END IF;
        END LOOP;

        -- Apply promotional price
        IF v_promo_match IS NOT NULL THEN
          v_preco_unitario := (v_promo_match->>'preco')::NUMERIC;
        END IF;
      END IF;

      v_total := v_total + (v_preco_unitario * v_qty);

      v_itens_insert := v_itens_insert || jsonb_build_array(jsonb_build_object(
        'produto_id', v_pid,
        'variacao_id', v_vid,
        'nome_produto', v_produto_nome,
        'nome_variacao', v_variacao_nome,
        'quantidade', v_qty,
        'preco_unitario', v_preco_unitario,
        'preco_total', v_preco_unitario * v_qty,
        'observacao', v_obs
      ));

      IF v_variacao_estoque != -1 THEN
        UPDATE public.variacoes_produto
        SET estoque = estoque - v_qty
        WHERE id = COALESCE(v_vid, (
          SELECT id FROM public.variacoes_produto
          WHERE produto_id = v_pid AND ativo = true
          ORDER BY ordem ASC LIMIT 1
        ))
        RETURNING estoque INTO v_variacao_estoque;

        -- NOVO COMBO LOGIC
        IF v_variacao_estoque <= 0 THEN
           UPDATE public.produtos
           SET disponivel = false
           WHERE whiskey_base_id = v_pid;
        END IF;
      END IF;
    END;
  END LOOP;

  -- 5. Create pedido
  INSERT INTO public.pedidos (comanda_id, numero_mesa, nome_pessoa, status, total)
  VALUES (v_comanda_id, v_mesa_numero, COALESCE(NULLIF(TRIM(p_nome_pessoa), ''), 'Cliente'), 'recebido', v_total)
  RETURNING id INTO v_pedido_id;

  -- 6. Insert itens_pedido
  INSERT INTO public.itens_pedido (pedido_id, produto_id, variacao_id, nome_produto, nome_variacao, quantidade, preco_unitario, preco_total, observacao)
  SELECT
    v_pedido_id,
    (item->>'produto_id')::TEXT,
    NULLIF(item->>'variacao_id', '')::TEXT,
    (item->>'nome_produto')::TEXT,
    NULLIF(item->>'nome_variacao', '')::TEXT,
    (item->>'quantidade')::SMALLINT,
    (item->>'preco_unitario')::NUMERIC,
    (item->>'preco_total')::NUMERIC,
    NULLIF(item->>'observacao', '')::TEXT
  FROM jsonb_array_elements(v_itens_insert) AS item;

  RETURN jsonb_build_object(
    'success', true,
    'pedido_id', v_pedido_id,
    'total', v_total
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object('error', format('Erro interno: %s', SQLERRM));
END;
$function$;
