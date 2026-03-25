# 📋 Especificação Completa — Painel Admin "Seu Manel"

> Documento de referência funcional. Sem design — apenas estrutura, dados e comportamentos.

---

## 📌 Resumo das Funcionalidades

| # | Módulo | Acesso | Prioridade |
|---|--------|--------|------------|
| 1 | Login | Todos | P0 |
| 2 | Dashboard | Todos | P0 |
| 3 | Kanban de Pedidos | Todos | P0 |
| 4 | Mapa de Mesas | Todos | P1 |
| 4.1 | Layout Visual de Mesas (Planta Baixa) | Owner config / Todos monitoram | P1 |
| 5 | Gerenciamento do Cardápio (CRUD) | Todos | P0 |
| 6 | Controle de Estoque | Todos | P0 |
| 7 | Relatórios & Métricas | Owner only | P2 |
| 8 | QR Codes | Todos | P2 |
| 9 | Funcionários | Owner only | P1 |
| 10 | Configurações | Owner only | P1 |
| 11 | Horário de Funcionamento | Owner only | P1 |

---

## 🔐 1. Login

**Tabela:** `funcionarios` (campo `auth_id` → Supabase Auth)

| Campo | Tipo | Obrigatório |
|-------|------|-------------|
| Email | input email | ✅ |
| Senha | input password (com toggle show/hide) | ✅ |

**Comportamento:**
- Autenticação via Supabase Auth (`signInWithPassword`)
- Após login, busca `funcionarios` pelo `auth_id` para obter `cargo` (`dono` / `admin`)
- Redireciona para Dashboard
- Se `ativo = false` → bloqueia login com mensagem "Conta desativada"

**Permissões por cargo:**
| Funcionalidade | `dono` | `admin` |
|----------------|--------|---------|
| Dashboard | ✅ | ✅ |
| Kanban | ✅ | ✅ |
| Mesas | ✅ | ✅ |
| Cardápio CRUD | ✅ | ✅ |
| Estoque | ✅ | ✅ |
| Relatórios | ✅ | ❌ |
| QR Codes | ✅ | ✅ |
| Funcionários | ✅ | ❌ |
| Configurações | ✅ | ❌ |

---

## 📊 2. Dashboard (Visão Geral)

**Dados exibidos (4 cards de métricas):**

| Métrica | Fonte de dados | Cálculo |
|---------|---------------|---------|
| Mesas Ocupadas | `mesas` WHERE `status = 'ocupada'` | `{ocupadas}/{total}` |
| Pedidos Ativos | `pedidos` WHERE `status IN ('recebido', 'preparando')` | COUNT |
| Faturamento Hoje | `pagamentos` WHERE `criado_em >= hoje` | SUM(`valor`) |
| Estoque Baixo | `variacoes_produto` WHERE `estoque > 0 AND estoque <= estoque_minimo` | COUNT |

**Últimos Pedidos (tabela):**

| Coluna | Fonte |
|--------|-------|
| Mesa | `pedidos.numero_mesa` |
| Cliente | `pedidos.nome_pessoa` |
| Itens | JOIN `itens_pedido` → `nome_produto` + `quantidade` |
| Status | `pedidos.status` (badge colorido) |
| Hora | `pedidos.criado_em` |

**Alertas (lista):**
- 🔔 Mesa X solicitou fechar → `comandas` WHERE `status = 'solicitando_fechamento'`
- ⚠️ Produto com estoque baixo → `variacoes_produto` WHERE `estoque <= estoque_minimo AND estoque > 0`
- 🔴 Produto esgotado → `variacoes_produto` WHERE `estoque = 0`

**Atalhos rápidos:** [Abrir Kanban] [Ver Mesas] [Ajustar Estoque]

---

## 📋 3. Kanban de Pedidos

### Colunas (4 no total)

| # | Coluna | Status no DB | Cor do header | Badge |
|---|--------|-------------|---------------|-------|
| 1 | 📥 Recebido | `recebido` | 🔵 Azul | Count pedidos |
| 2 | 🍳 Em Preparo | `preparando` | 🟡 Âmbar | Count pedidos |
| 3 | ✅ Servido | `entregue` | 🟢 Verde | Count pedidos |
| 4 | 🏁 Concluído | `concluido` | ⚪ Cinza | Count pedidos |

> **IMPORTANTE:** O banco atual tem status: `recebido`, `preparando`, `entregue`. Será necessária uma **migration** para adicionar o status `concluido` na tabela `pedidos`.

### Card do Pedido — Dados exibidos

| Dado | Fonte |
|------|-------|
| Mesa | `pedidos.numero_mesa` |
| Hora | `pedidos.criado_em` (formatado HH:mm) |
| Nome do cliente | `pedidos.nome_pessoa` |
| Itens | `itens_pedido` → `{quantidade}x {nome_produto}` |
| Variação | `itens_pedido.nome_variacao` (se houver) |
| Observações | `pedidos.observacoes` e/ou `itens_pedido.observacoes` |
| Tempo decorrido | Calculado: `now() - pedidos.criado_em` |

### Ações por coluna

| Coluna | Botão de ação | Status resultante |
|--------|--------------|-------------------|
| Recebido | [Preparar →] | `preparando` |
| Em Preparo | [Servir →] | `entregue` |
| Servido | [Concluir →] | `concluido` |
| Concluído | — (sem ação) | — |

### Comportamentos

- **Drag & Drop** entre colunas (opcional, mas o botão é obrigatório)
- **Alerta de tempo:** se pedido em "Em Preparo" > 15 min → badge vermelho com ⏱️
- **Filtro por mesa:** dropdown para filtrar cards por número de mesa
- **Real-time:** canal `admin-vendas` (tabela `pedidos`, eventos INSERT/UPDATE)
- **Som/Notificação:** ao receber novo pedido (INSERT com `status = 'recebido'`)
- **Banner de alerta:** quando `comandas.status = 'solicitando_fechamento'`

---

## 🪑 4. Mapa de Mesas

**Tabela:** `mesas`

### Estado visual de cada mesa

| Status DB | Visual | Significado |
|-----------|--------|-------------|
| `disponivel` | 🟢 Borda verde | Livre |
| `ocupada` | 🔴 Borda vermelha | Ocupada |
| `ocupada` + comanda `solicitando_fechamento` | 🟡 Borda âmbar pulsante | Quer fechar |

### Ao clicar em mesa ocupada → Detalhe da Comanda

**Dados exibidos:**

| Dado | Fonte |
|------|-------|
| Número da mesa | `mesas.numero` |
| ID comanda | `comandas.id` |
| Status comanda | `comandas.status` |
| Pessoas | `pessoas_comanda` JOIN `comandas` |
| Pedidos por pessoa | `pedidos` → `itens_pedido` |
| Subtotal por pessoa | `pessoas_comanda.subtotal` |
| Couvert | `comandas.couvert_ativo` + `comandas.valor_couvert` × `comandas.qtd_pessoas` |
| Total | `comandas.total` |

### Pagamento (ao fechar comanda)

| Campo | Opções |
|-------|--------|
| Tipo de divisão | Total / Individual / Dividir Igual / Parcial |
| Método pagamento | Pix / Crédito / Débito / Dinheiro |
| Valor | Input numérico (se parcial) |

**Ação:** INSERT em `pagamentos` + UPDATE `comandas.status → 'fechada'` + UPDATE `mesas.status → 'disponivel'`

---

## 🗺️ 4.1 Layout Visual de Mesas (Planta Baixa)

> Representação espacial do restaurante. O dono configura o layout arrastando mesas; a equipe monitora em tempo real.

**Tabela:** `mesas` (campos adicionais necessários — ver migration)

### Dois Modos de Operação

| Modo | Quem usa | Funcionalidade |
|------|----------|----------------|
| 🔧 **Editor de Layout** | Owner only | Arrastar mesas, posicionar, redimensionar, definir formato |
| 👁️ **Monitor ao Vivo** | Todos (admin/dono) | Visualizar status de cada mesa em real-time, sem editar posição |

### 4.1.1 Modo Editor (Owner)

**Canvas 2D** onde o dono arrasta e posiciona as mesas para espelhar o layout físico do bar.

**Ações disponíveis no editor:**

| Ação | Comportamento |
|------|---------------|
| Arrastar mesa | Move a mesa no canvas, salva `pos_x` e `pos_y` |
| Redimensionar | Ajusta `largura` e `altura` da mesa |
| Rotacionar | Ajusta `rotacao` (graus) |
| Mudar formato | Alterna entre `redonda`, `quadrada`, `retangular` |
| Adicionar mesa | Cria nova mesa (input: número + capacidade) → INSERT em `mesas` |
| Remover mesa | DELETE (somente se não tiver comanda aberta) |
| Salvar layout | UPDATE em batch de todas as mesas com as novas coordenadas |

**Elementos visuais de referência (opcionais):**
- Paredes / limites do salão
- Balcão / bar
- Cozinha
- Banheiros
- Porta de entrada

> Esses elementos são meramente visuais (não vão pro banco). Podem ser salvos como JSON em `configuracoes` ou em um campo dedicado.

### 4.1.2 Modo Monitor ao Vivo

**Mesmo layout do editor**, mas sem possibilidade de mover mesas. Cada mesa exibe:

| Dado | Fonte | Visual |
|------|-------|--------|
| Número da mesa | `mesas.numero` | Grande, centralizado |
| Status | `mesas.status` | Cor de fundo da mesa |
| Qtd pessoas | `comandas.qtd_pessoas` (comanda aberta) | Pequeno badge |
| Tempo ocupada | `now() - comandas.aberta_em` | Timer (ex: "1h23min") |
| Total parcial | `comandas.total` | R$ abaixo do número |
| Pedidos ativos | COUNT `pedidos` WHERE `status IN ('recebido', 'preparando')` | Ícone com badge |

**Cores das mesas no monitor:**

| Estado | Cor | Condição |
|--------|-----|----------|
| 🟢 Livre | Verde | `mesas.status = 'disponivel'` |
| 🔴 Ocupada | Vermelha | `mesas.status = 'ocupada'` |
| 🟡 Pedindo fechar | Âmbar pulsante | `comandas.status = 'solicitando_fechamento'` |
| 🔵 Com pedido novo | Azul piscando | Tem `pedidos.status = 'recebido'` (recém chegou) |

**Interações no monitor:**
- **Hover na mesa** → tooltip com: nº mesa, pessoas, tempo, total, itens em preparo
- **Click na mesa ocupada** → abre painel lateral com detalhe da comanda (mesmo do módulo 4)
- **Click na mesa livre** → opção de abrir nova comanda

**Real-time:** canal `admin-comandas` + `admin-vendas` (atualiza cores e badges sem refresh)

### 4.1.3 Campos Novos na Tabela `mesas`

| Campo | Tipo | Default | Descrição |
|-------|------|---------|-----------|
| `pos_x` | `FLOAT` | `0` | Posição X no canvas (percentual ou px) |
| `pos_y` | `FLOAT` | `0` | Posição Y no canvas (percentual ou px) |
| `largura` | `FLOAT` | `80` | Largura visual da mesa (px) |
| `altura` | `FLOAT` | `80` | Altura visual da mesa (px) |
| `formato` | `TEXT` | `'quadrada'` | `'redonda'`, `'quadrada'`, `'retangular'` |
| `rotacao` | `SMALLINT` | `0` | Rotação em graus (0-359) |

---

## 🍽️ 5. Gerenciamento do Cardápio (CRUD de Produtos)

### 5.1 Listagem (por categoria — accordion)

Cada categoria exibe:

| Dado | Fonte |
|------|-------|
| Nome da categoria | `categorias.nome` |
| Ícone | `categorias.icone` |
| Qtd produtos | COUNT `produtos` WHERE `categoria_id` |
| Toggle ativo | `categorias.ativo` (desliga categoria inteira) |

Cada produto na lista exibe:

| Dado | Fonte |
|------|-------|
| 📷 Thumbnail (imagem pequena) | `produtos.imagem_url` (redimensionada) |
| Nome | `produtos.nome` |
| Preço | Primeiro `variacoes_produto.preco` ou range de preços |
| Estoque | `variacoes_produto.estoque` (do primeiro SKU ou menor) |
| Toggle disponível | `produtos.disponivel` |

### 5.2 Toggle de Disponibilidade (CRÍTICO)

**Comportamento do toggle `produtos.disponivel`:**
1. Admin **desliga** o toggle → `UPDATE produtos SET disponivel = false WHERE id = X`
2. Produto **some instantaneamente** do app mobile (real-time)
3. No app mobile aparece como **"Esgotado"** ou simplesmente não aparece
4. Admin **liga** o toggle → produto volta ao menu imediatamente

**Real-time:** canal `sku-disponibilidade` + tabela `produtos` (UPDATE do campo `disponivel`)

### 5.3 Formulário de Cadastro/Edição de Produto

> **Campos necessários para o formulário (sem design, apenas dados):**

#### Dados Base do Produto (tabela `produtos`)

| Campo | Tipo input | Obrigatório | Validação | Observação |
|-------|-----------|-------------|-----------|------------|
| Nome | text | ✅ | min 3 chars | ex: "Picanha na Chapa" |
| Slug | text (auto-gerado) | ✅ | único, URL-safe | Gerado a partir do nome |
| Descrição | textarea | ❌ | max 500 chars | Ingredientes, acompanhamentos |
| Categoria | select/dropdown | ✅ | deve existir em `categorias` | Lista das 12+ categorias |
| Imagem | file upload | ❌ | JPG/PNG/WebP, max 5MB | Upload para Cloudinary/Supabase Storage |
| É combo? | checkbox/toggle | ❌ | default `false` | Para identificar combos no cardápio |
| Tempo de preparo (min) | number | ❌ | min 0, max 180 | Usado para alertas no Kanban |
| Disponível | toggle | ❌ | default `true` | Toggle master — desliga o produto inteiro |
| País de origem | text/select | ❌ | — | ex: "Brasil", "Itália" |
| Volume (ml) | number | ❌ | min 0 | Para bebidas (ex: 600, 750) |
| Teor alcoólico | number (decimal) | ❌ | min 0, max 100 | ex: 4.7, 8.5 |
| Serve pessoas | number | ❌ | min 1, max 20 | ex: "Serve 4 pessoas" |
| Rating | number (decimal) | ❌ | min 0, max 5, default 5.0 | Nota do produto |
| Ordem | number | ❌ | min 0 | Posição na lista dentro da categoria |
| Tipo de vinho | select | ❌ | `tinto`, `branco`, `rose` | Somente para vinhos |
| ML da taça | number | ❌ | default 200 | Somente para vinhos |

#### Variações / SKUs (tabela `variacoes_produto`) — Sub-formulário inline

> Cada produto pode ter **1 ou mais variações**. Pelo menos 1 variação é necessária (é dela que vem o preço).

| Campo | Tipo input | Obrigatório | Validação | Observação |
|-------|-----------|-------------|-----------|------------|
| Nome da variação | text | ✅ | min 2 chars | ex: "Taça", "Garrafa 750ml", "Grande", "Unidade" |
| Preço (R$) | number (decimal) | ✅ | min 0.01 | ex: 14.00, 130.00 |
| Serve pessoas | number | ❌ | min 1 | Sobrescreve o do produto se preenchido |
| Ativo | toggle | ❌ | default `true` | Desliga só esta variação |
| Estoque | number / toggle "∞" | ❌ | default -1 (ilimitado) | `-1` = ∞ ilimitado; `0` = esgotado |
| Estoque mínimo | number | ❌ | default 5 | Limite para alerta "Estoque Baixo" |
| Ordem | number | ❌ | min 0 | Posição das variações no card do produto |

**Ações no sub-formulário:**
- [+ Adicionar Variação] → nova linha
- [🗑️ Remover] → deleta variação (confirmação obrigatória)
- Arrastar para reordenar

#### Adicionais / Extras (tabela `adicionais_produto`) — Sub-formulário inline

| Campo | Tipo input | Obrigatório | Validação | Observação |
|-------|-----------|-------------|-----------|------------|
| Nome do adicional | text | ✅ | min 2 chars | ex: "Arroz", "Farofa", "Bacon extra" |
| Preço (R$) | number (decimal) | ✅ | min 0 | Pode ser 0 (incluso) |
| Qtd máxima | number | ❌ | default 1 | Limite que o cliente pode pedir |
| Ativo | toggle | ❌ | default `true` | Desliga só este adicional |
| Estoque | number / toggle "∞" | ❌ | default -1 (ilimitado) | `-1` = ∞ |
| Estoque mínimo | number | ❌ | default 5 | Alerta de estoque baixo |

**Ações no sub-formulário:**
- [+ Adicionar Extra] → nova linha
- [🗑️ Remover] → deleta adicional (confirmação obrigatória)

#### Ações do Formulário

| Botão | Ação |
|-------|------|
| [Cancelar] | Fecha modal/tela sem salvar |
| [Salvar] | Valida campos → INSERT/UPDATE em `produtos` + `variacoes_produto` + `adicionais_produto` |
| [Excluir Produto] | Somente `dono` — soft delete ou DELETE com confirmação |

---

## 📦 6. Controle de Estoque

### Visão da Tabela

| Coluna | Fonte | Comportamento |
|--------|-------|---------------|
| 📷 Imagem (thumb pequena) | `produtos.imagem_url` | Mini thumbnail do produto para identificação rápida |
| Produto | `produtos.nome` | Nome principal |
| Variação | `variacoes_produto.nome` | Se houver mais de 1 SKU, cada variação é uma linha |
| Categoria | `categorias.nome` | JOIN via `produtos.categoria_id` |
| Estoque Atual | `variacoes_produto.estoque` | Exibe número ou `∞` se `-1` |
| Estoque Mínimo | `variacoes_produto.estoque_minimo` | Referência para alerta |
| Status | Calculado | 🟢 OK / 🟡 Baixo / 🔴 Esgotado / ⚪ Ilimitado |
| Toggle Status App | `produtos.disponivel` | **Toggle instantâneo** — liga/desliga no mobile |
| Preço (R$) | `variacoes_produto.preco` | Preço atual da variação |
| Ação Rápida | Inline | Botões `[-]` `[valor]` `[+]` para ajuste rápido |

### Filtros

| Filtro | Lógica |
|--------|--------|
| Todos | Sem filtro |
| 🟡 Baixo | `estoque > 0 AND estoque <= estoque_minimo` |
| 🔴 Esgotado | `estoque = 0` |
| ⚪ Ilimitado | `estoque = -1` |
| 🟢 OK | `estoque > estoque_minimo` |
| Busca por nome | ILIKE no `produtos.nome` |
| Filtro por categoria | WHERE `produtos.categoria_id = X` |

### Cards de Resumo (topo)

| Card | Cálculo |
|------|---------|
| ✅ Itens OK | COUNT WHERE `estoque > estoque_minimo OR estoque = -1` |
| 🟡 Estoque Baixo | COUNT WHERE `estoque > 0 AND estoque <= estoque_minimo` |
| 🔴 Esgotados | COUNT WHERE `estoque = 0` |
| 📦 Total Itens | COUNT total de variações |

### Comportamentos Automáticos

1. **Estoque chega a 0 via venda:** Toggle `disponivel` vai para `false` automaticamente → produto some do app
2. **Admin repõe estoque (0 → 1+):** Toggle `disponivel` volta para `true` automaticamente → produto reaparece
3. **Toggle manual:** Admin pode desligar produto mesmo com estoque > 0 (ex: fritadeira quebrou)
4. **Ajuste rápido:** Botões `[+]` e `[-]` fazem UPDATE direto em `variacoes_produto.estoque`

---

## 📈 7. Relatórios & Métricas (Owner only)

### Filtro de Período
[Hoje] [7 dias] [30 dias] [Personalizado (date range picker)]

### Cards de Métricas

| Métrica | Query base |
|---------|------------|
| 💰 Faturamento Total | SUM(`pagamentos.valor`) no período |
| 🍽️ Total de Pedidos | COUNT(`pedidos`) no período |
| 🪑 Mesas Atendidas | COUNT DISTINCT(`pedidos.numero_mesa`) |
| ⏱️ Tempo Médio de Preparo | AVG(`atualizado_em - criado_em`) WHERE status mudou para 'entregue' |

### Gráficos

| Gráfico | Tipo | Dados |
|---------|------|-------|
| Faturamento Diário | Line/Area chart | SUM(`pagamentos.valor`) GROUP BY data |
| Métodos de Pagamento | Donut/Pie chart | COUNT por `pagamentos.metodo` |
| Top 10 Mais Vendidos | Horizontal bar chart | SUM(`itens_pedido.quantidade`) GROUP BY `produto_id` |
| Top 10 Mais Curtidos | Lista rankeada | COUNT `curtidas` GROUP BY `produto_id` |
| Horário de Pico | Heatmap | COUNT `pedidos` GROUP BY hora |
| Pedidos por Mesa | Bar chart | COUNT `pedidos` GROUP BY `numero_mesa` |

---

## 📱 8. QR Codes

**Tabela:** `mesas`

| Ação | Comportamento |
|------|---------------|
| Selecionar mesa | Dropdown com todas as mesas |
| Gerar QR Code | Gera imagem QR apontando para URL da mesa |
| URL format | `https://{dominio}/mesa/{numero}` |
| Download | PNG e/ou SVG |
| Imprimir | Print direto |
| Gerar Todos | Batch → gera QR de todas as mesas |

---

## 👥 9. Funcionários (Owner only)

**Tabela:** `funcionarios`

### Listagem

| Coluna | Fonte |
|--------|-------|
| Foto | `funcionarios.foto_url` ou iniciais |
| Nome | `funcionarios.nome` |
| Email | `funcionarios.email` |
| Cargo | `funcionarios.cargo` (badge: "Dono" ou "Admin") |
| Status | `funcionarios.ativo` (✅ Ativo / ❌ Inativo) |
| Ações | [Editar] [Desativar/Ativar] |

### Formulário de Cadastro

| Campo | Tipo | Obrigatório |
|-------|------|-------------|
| Nome | text | ✅ |
| Email | email | ✅ |
| Senha temporária | password | ✅ (no cadastro) |
| Cargo | radio (`dono` / `admin`) | ✅ |

**Ação:** Edge Function cria usuário no Supabase Auth + INSERT em `funcionarios`

---

## ⚙️ 10. Configurações (Owner only)

**Tabela principal:** `configuracoes` (singleton, `id = 'global'`)

### 10.1 Geral

| Campo | Tipo | Fonte DB |
|-------|------|----------|
| Nome do estabelecimento | text | `configuracoes.nome_estabelecimento` |
| Logo | file upload | Supabase Storage |

### 10.2 Aparência

| Campo | Tipo | Opções | Default |
|-------|------|--------|---------|
| Tema | select/toggle | `claro` / `escuro` / `automatico` | `escuro` |
| Tamanho da fonte | select | `pequeno` / `medio` / `grande` | `medio` |

> Salvo em `localStorage` do admin (preferência por dispositivo) **ou** na tabela `funcionarios` se quiser persistir por usuário.

### 10.3 Notificações

| Campo | Tipo | Default | Descrição |
|-------|------|---------|-----------|
| Som ao receber pedido | toggle | `true` | Toca som quando INSERT em `pedidos` |
| Escolha de som | select | `default` | Tom de notificação (2-3 opções) |
| Alerta mesa pedindo fechar | toggle | `true` | Banner quando `comandas.status = 'solicitando_fechamento'` |
| Alerta estoque baixo | toggle | `true` | Notificação quando `estoque <= estoque_minimo` |
| Tempo limite Kanban (min) | number | `15` | Acima disso → badge vermelho no card |

### 10.4 Impressão

| Campo | Tipo | Descrição |
|-------|------|-----------|
| Impressora padrão | select | Lista de impressoras disponíveis |
| Auto-imprimir ao fechar comanda | toggle (default: `false`) | Imprime cupom automaticamente |

### 10.5 Financeiro

| Campo | Tipo | Fonte DB | Default |
|-------|------|----------|---------|
| Couvert ativo | toggle | `configuracoes.couvert_ativo` | `false` |
| Valor do couvert (R$) | number | `configuracoes.valor_couvert` | `10.00` |
| Taxa de serviço | toggle | `configuracoes.taxa_servico_ativa` | `false` |
| Percentual da taxa (%) | number | `configuracoes.taxa_servico_percentual` | `10` |
| Métodos de pagamento aceitos | checkboxes | `configuracoes.metodos_pagamento` (JSONB) | `['pix','credito','debito','dinheiro']` |

### 10.6 App do Cliente

| Campo | Tipo | Descrição |
|-------|------|-----------|
| Nome exibido no app | text | Nome que aparece pro cliente (pode ser diferente do oficial) |
| Logo do app | file upload | Imagem exibida no menu do cliente |

### 10.7 Segurança

| Campo | Tipo | Descrição |
|-------|------|-----------|
| Alterar senha | form | Senha atual + Nova senha + Confirmar nova senha |

---

## 🕐 11. Horário de Funcionamento (Owner only)

**Tabela:** `horarios_funcionamento`

> Tabela separada com 1 registro por dia da semana.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | `TEXT PK` | nanoid(8) |
| `dia_semana` | `SMALLINT` | 0 = Domingo, 1 = Segunda ... 6 = Sábado |
| `aberto` | `BOOLEAN` | Se o estabelecimento abre nesse dia |
| `hora_abertura` | `TIME` | ex: `11:00` |
| `hora_fechamento` | `TIME` | ex: `02:00` (madrugada = dia seguinte) |
| `atualizado_em` | `TIMESTAMPTZ` | — |

### Interface

| Dia | Aberto? | Abertura | Fechamento |
|-----|---------|----------|------------|
| Segunda | toggle ✅ | `[11:00]` | `[23:00]` |
| Terça | toggle ✅ | `[11:00]` | `[23:00]` |
| Quarta | toggle ✅ | `[11:00]` | `[23:00]` |
| Quinta | toggle ✅ | `[11:00]` | `[02:00]` |
| Sexta | toggle ✅ | `[11:00]` | `[03:00]` |
| Sábado | toggle ✅ | `[11:00]` | `[03:00]` |
| Domingo | toggle ❌ | `—` | `—` |

**Comportamento:**
- Se `aberto = false` → campos de hora ficam desabilitados
- O app mobile pode exibir "Fechado agora" ou "Abre às 11:00" baseado nesses dados
- [Salvar] → UPDATE batch em `horarios_funcionamento`

---

## 🗃️ Sidebar / Navegação

| Item | Ícone | Rota sugerida | Acesso |
|------|-------|---------------|--------|
| Dashboard | 📊 | `/admin` | Todos |
| Pedidos (Kanban) | 📋 | `/admin/pedidos` | Todos |
| Mesas | 🪑 | `/admin/mesas` | Todos |
| Layout do Salão | 🗺️ | `/admin/layout` | Todos (editar: Owner) |
| Cardápio | 🍽️ | `/admin/cardapio` | Todos |
| Estoque | 📦 | `/admin/estoque` | Todos |
| Relatórios | 📈 | `/admin/relatorios` | Owner |
| QR Codes | 📱 | `/admin/qrcodes` | Todos |
| Funcionários | 👥 | `/admin/funcionarios` | Owner |
| Horário de Funcionamento | 🕐 | `/admin/horarios` | Owner |
| Configurações | ⚙️ | `/admin/configuracoes` | Owner |

**Rodapé da sidebar:** Avatar do admin logado + nome + cargo + [🚪 Sair]

---

## 🔧 Migrations Necessárias

### Migration 1: Status "concluído" no Kanban

O banco atual tem `pedidos.status` com CHECK constraint: `('recebido', 'preparando', 'entregue')`.

```sql
-- Adicionar status 'concluido' ao CHECK constraint de pedidos
ALTER TABLE pedidos DROP CONSTRAINT IF EXISTS pedidos_status_check;
ALTER TABLE pedidos ADD CONSTRAINT pedidos_status_check 
  CHECK (status = ANY (ARRAY['recebido', 'preparando', 'entregue', 'concluido']));
```

### Migration 2: Campos de layout visual na tabela `mesas`

```sql
-- Adicionar campos de posicionamento e formato para o layout visual
ALTER TABLE mesas ADD COLUMN IF NOT EXISTS pos_x FLOAT DEFAULT 0;
ALTER TABLE mesas ADD COLUMN IF NOT EXISTS pos_y FLOAT DEFAULT 0;
ALTER TABLE mesas ADD COLUMN IF NOT EXISTS largura FLOAT DEFAULT 80;
ALTER TABLE mesas ADD COLUMN IF NOT EXISTS altura FLOAT DEFAULT 80;
ALTER TABLE mesas ADD COLUMN IF NOT EXISTS formato TEXT DEFAULT 'quadrada'
  CHECK (formato = ANY (ARRAY['redonda', 'quadrada', 'retangular']));
ALTER TABLE mesas ADD COLUMN IF NOT EXISTS rotacao SMALLINT DEFAULT 0;
```

### Migration 3: Campos expandidos em `configuracoes` + tabela `horarios_funcionamento`

```sql
-- Novos campos em configuracoes
ALTER TABLE configuracoes ADD COLUMN IF NOT EXISTS taxa_servico_ativa BOOLEAN DEFAULT false;
ALTER TABLE configuracoes ADD COLUMN IF NOT EXISTS taxa_servico_percentual NUMERIC(5,2) DEFAULT 10;
ALTER TABLE configuracoes ADD COLUMN IF NOT EXISTS metodos_pagamento JSONB DEFAULT '["pix","credito","debito","dinheiro"]'::jsonb;

-- Tabela de horários de funcionamento
CREATE TABLE IF NOT EXISTS horarios_funcionamento (
  id TEXT PRIMARY KEY DEFAULT nanoid(8),
  dia_semana SMALLINT NOT NULL CHECK (dia_semana >= 0 AND dia_semana <= 6),
  aberto BOOLEAN DEFAULT true,
  hora_abertura TIME DEFAULT '11:00',
  hora_fechamento TIME DEFAULT '23:00',
  atualizado_em TIMESTAMPTZ DEFAULT now(),
  UNIQUE(dia_semana)
);

-- Seed dos 7 dias
INSERT INTO horarios_funcionamento (dia_semana, aberto, hora_abertura, hora_fechamento)
VALUES 
  (0, false, '11:00', '23:00'),
  (1, true, '11:00', '23:00'),
  (2, true, '11:00', '23:00'),
  (3, true, '11:00', '23:00'),
  (4, true, '11:00', '02:00'),
  (5, true, '11:00', '03:00'),
  (6, true, '11:00', '03:00')
ON CONFLICT (dia_semana) DO NOTHING;

-- RLS
ALTER TABLE horarios_funcionamento ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Público pode ler horários" ON horarios_funcionamento FOR SELECT USING (true);
CREATE POLICY "Owner pode alterar horários" ON horarios_funcionamento FOR UPDATE USING (obter_cargo_funcionario() = 'dono');
```

---

## 📡 Canais Real-time Necessários no Admin

| Canal | Tabela | Eventos | Uso |
|-------|--------|---------|-----|
| `admin-vendas` | `pedidos` | INSERT, UPDATE | Kanban — novos pedidos e mudanças de status |
| `admin-comandas` | `comandas` | UPDATE | Alerta de mesa querendo fechar |
| `sku-disponibilidade` | `variacoes_produto` | UPDATE | Estoque — mudanças de estoque |
| `produto-toggle` | `produtos` | UPDATE | Toggle disponível — reflete no mobile |
| `configuracoes-gerais` | `configuracoes` | UPDATE | Configurações — couvert etc |

---

## 🚀 Stack Técnica & Performance

> Objetivo: o admin deve parecer **instantâneo** — igual ao dashboard do Supabase.

### Tecnologias

| Camada | Tecnologia | Motivo |
|--------|-----------|--------|
| Framework | **Next.js 14+ (App Router)** | Server Components, streaming, prefetch automático |
| Componentes | **shadcn/ui + Radix UI** | Zero runtime CSS, acessível, tree-shakeable |
| Estilização | **Tailwind CSS** | CSS atômico, purge automático, bundle mínimo |
| Ícones | **Lucide Icons** | SVGs thin (~0.5KB cada), traço fino, estilo Supabase |
| Data Fetching | **TanStack Query (React Query)** | Cache, revalidação, optimistic updates |
| Real-time | **Supabase Realtime (WebSocket)** | Sem polling, dados chegam via push |
| DB | **Supabase (PostgreSQL)** | Já em uso |
| Auth | **Supabase Auth** | Já em uso |

### Padrões de Performance

| Padrão | Como funciona | Onde usar |
|--------|--------------|-----------|
| **Optimistic UI** | UI responde INSTANTANEAMENTE (drag, click, toggle). Banco confirma em background (~200ms). Se falhar → reverte com animação suave + toast de erro. Real-time ignora cards em mutação local | Tudo: Kanban drag, toggles, estoque, botões |
| **Skeleton Screens** | Mostra "ossos" da tela enquanto carrega (sem spinner) | Todas as telas no load inicial |
| **Lazy Loading** | Carrega módulos sob demanda (`next/dynamic`) | Relatórios (gráficos), QR Codes, Layout de Mesas |
| **Cache + SWR** | Dados em cache no cliente, revalida em background | Listagem de produtos, categorias, mesas |
| **Debounce** | Busca/filtro só dispara após 300ms sem digitação | Busca de produtos, filtro de estoque |
| **Virtualização** | Renderiza apenas itens visíveis na tela | Tabela de estoque (se > 100 itens) |

### Design que Parece Leve

| Regra | Valor |
|-------|-------|
| Sombras | **Zero box-shadow** — usar apenas `border 1px` |
| Transições | `transition-all duration-150` — curtas e suaves |
| Cores | Flat, sem gradientes pesados |
| Fonte body | `text-xs` (12px) a `text-sm` (14px) — densa mas clean |
| Fonte headings | `text-base` (16px) a `text-lg` (18px) |
| Ícones | Stroke 1.5-2px, tamanho 16-20px |
| Espaçamento | `p-2`/`p-3`, `gap-2` — compacto e consistente |
| Bordas | 1px `border-border` (cinza sutil), `rounded-md` (6px) |
| Hover | Background sutil (`bg-muted`), transição rápida |
| Active | Fundo levemente mais escuro + texto bold ou cor accent |

### Referência Visual

> Estilo: **Supabase Dashboard** (shadcn/ui, Lucide, tema claro/escuro)
> Inspiração: Linear, Vercel, Raycast — dashboards SaaS modernos com toque de calor (cor accent vermelha `#C4392D`)
