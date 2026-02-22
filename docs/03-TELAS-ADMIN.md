# 🖥️ Telas do Admin — Estrutura Completa

## Sidebar / Navegação

```
┌──────────────────────────┐
│ 🏪 SEU MANEL BAR         │
│ (logo + nome)            │
│                          │
│ 📊 Dashboard             │
│ 📋 Kanban de Pedidos     │
│ 🪑 Mesas                │
│ 🍽️ Cardápio              │
│ 📦 Estoque               │
│ 📈 Relatórios            │
│ 📱 QR Codes              │
│ 👥 Funcionários          │
│ ⚙️ Configurações         │
│                          │
│ ─────────────────────    │
│ 👤 Nome do Admin         │
│ 🚪 Sair                  │
└──────────────────────────┘
```

> **Owner** vê tudo. **Admin (funcionário)** NÃO vê: Relatórios, Funcionários, Configurações.

---

## 1. 📊 Dashboard (Visão Geral)

**O que aparece:**
- **Cards resumo:**
  - 🪑 Mesas ocupadas / total (ex: 8/15)
  - 📋 Pedidos ativos (recebido + preparando)
  - 💰 Faturamento do dia
  - 📦 Itens com estoque baixo (≤5)

- **Lista rápida:**
  - Últimos 5 pedidos com status
  - Alertas (mesa quer fechar, produto esgotou)

- **Atalhos:**
  - [Abrir Kanban] [Ver Mesas] [Ajustar Estoque]

---

## 2. 📋 Kanban de Pedidos

**Layout 3 colunas:**

```
┌──────────────┬──────────────┬──────────────┐
│ 📥 RECEBIDO  │ 🍳 PREPARANDO│ ✅ SERVIDO    │
│ (novos)      │ (em preparo) │ (entregues)  │
├──────────────┼──────────────┼──────────────┤
│ ┌──────────┐ │ ┌──────────┐ │ ┌──────────┐ │
│ │Mesa 3    │ │ │Mesa 7    │ │ │Mesa 1    │ │
│ │Alan      │ │ │Helena    │ │ │Pedro     │ │
│ │──────────│ │ │──────────│ │ │──────────│ │
│ │2x Picanha│ │ │1x Gin    │ │ │3x Pastel │ │
│ │1x Heineke│ │ │1x Pudim  │ │ │          │ │
│ │──────────│ │ │──────────│ │ │──────────│ │
│ │14:32     │ │ │14:25     │ │ │14:10     │ │
│ │[Preparar]│ │ │[Servir]  │ │ │[✓ Feito] │ │
│ └──────────┘ │ └──────────┘ │ └──────────┘ │
└──────────────┴──────────────┴──────────────┘
```

**Funcionalidades:**
- **Drag & Drop** entre colunas
- **Filtro por mesa** (dropdown ou click na mesa)
- **Som/Notificação** quando novo pedido chega (🔔)
- **Badge vermelho** se pedido está há >15min em "Preparando"
- **Alerta especial** (banner/toast) quando mesa solicita fechar comanda
- **Real-time:** cards aparecem/mudam sem refresh
- **Expandir card:** ver itens detalhados (variantes, addons, observações)

---

## 3. 🪑 Mesas

**Layout: Grid visual de mesas**

```
┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐
│ 01 │ │ 02 │ │ 03 │ │ 04 │ │ 05 │
│ 🟢 │ │ 🔴 │ │ 🔴 │ │ 🟢 │ │ 🟢 │
│    │ │2pss│ │4pss│ │    │ │    │
└────┘ └────┘ └────┘ └────┘ └────┘
                                    [+ Adicionar Mesa]
```

**Estados:**
- 🟢 Livre (available)
- 🔴 Ocupada (occupied)
- 🟡 Pedindo fechar (requesting_close) → com animação pulsante

**Ao clicar na mesa ocupada → abre detalhes da comanda:**
- Lista de guests (Alan, Helena...)
- Pedidos de cada um com itens
- Subtotal por pessoa + Total
- Botões: [Adicionar Pedido] [Imprimir Comanda] [Fechar Comanda]
- Opções de pagamento: Total / Individual / Parcial / Dividir igual

---

## 4. 🍽️ Cardápio (Menu Management)

**Layout: Lista de categorias → expandir para produtos**

```
📁 Pastéis (7 produtos)           [Toggle ✅] [Editar] [↕ Reordenar]
  └─ Pastel de Carne     R$30    [Toggle ✅] [Editar] [Estoque: ∞]
  └─ Pastel Frango       R$30    [Toggle ✅] [Editar] [Estoque: 12]
  └─ Pastel de Queijo    R$30    [Toggle ❌] [Editar] [Estoque: 0 🔴]
  
📁 Espetinhos (8 produtos)        [Toggle ✅] [Editar] [↕ Reordenar]
  └─ Espeto de Linguiça  R$19    [Toggle ✅] [Editar] [Estoque: 25]
  ...
```

**Funcionalidades por produto:**
- **Toggle on/off** → reflete em real-time no menu do cliente (desativa o produto todo).
- **Editar Produto Base:** Nome, descrição, imagem (upload Cloudinary), categoria, tags.
- **Variantes (SKUs):** Tabela embutida no modal para gerenciar os SKUs do produto (ex: Taça, Garrafa). Cada um tem: Nome, Preço, Estoque próprio, Toggle on/off.
- **Addons Extras:** Tabela embutida no modal para gerenciar complementos. Cada um tem: Nome, Preço, Qtd Máxima, Estoque próprio, Toggle on/off.
- **Reordenar:** Drag das categorias e dos produtos dentro delas.

**Modal de editar produto:**
```
┌────────────────────────────────────┐
│ Editar: Picanha na Chapa           │
│                                    │
│ Nome: [________________]           │
│ Descrição: [______________]        │
│ Categoria: [Pratos à la Carte ▼]   │
│ Imagem: [📷 Upload]  [Preview]     │
│ Tags: [destaque ×] [+ Tag]         │
│ Tempo preparo: [ 25 ] min          │
│                                    │
│ ──────── SKUs / VARIANTES ──────── │
│ ├─ Grande  R$ [175]  Estoque [2] ✅│
│ ├─ Média   R$ [125]  Estoque [5] ✅│
│ └─ [+ Adicionar Variante]          │
│                                    │
│ ────── ADICIONAIS / EXTRAS ─────── │
│ ├─ Arroz   R$ [7] Max [2] Est [∞]✅│
│ ├─ Farofa  R$ [5] Max [1] Est [9]✅│
│ └─ [+ Adicionar Addon]             │
│                                    │
│ [Cancelar]           [💾 Salvar]   │
└────────────────────────────────────┘
```

---

## 5. 📦 Estoque

**Layout: Tabela com filtros**

## 5. 📦 Estoque (Entradas e Saídas Rápidas)

**Layout: Tabela otimizada para operação rápida**

| Produto / Variante | Categoria | Estoque Atual | Status App | Ação Rápida |
|--------------------|-----------|---------------|------------|-------------|
| Pastel Carne       | Pastéis   | 12            | [✅ Ativo]  | `[ - ]` `12` `[ + ]` |
| Heineken 600ml     | Cervejas  | 3             | [✅ Ativo]  | `[ - ]` ` 3` `[ + ]` |
| Pastel Queijo      | Pastéis   | 0             | [❌ Esgotado]| `[ - ]` ` 0` `[ + ]` |
| Drink Melancita    | Drinks    | ∞             | [✅ Ativo]  | `[ ∞ ]`              |

**Funcionalidades Essenciais:**
- **Entrada Rápida:** Botões `[+]` e `[-]` do lado do número permitem dar entrada na mercadoria em 1 clique (chegou 1 engradado? Clica `+` até somar 24, salva sozinho).
- **Toggle Manual vs Automático:** 
  - O botão de "Status App" desliga o produto na marra (ex: acabou o tempo de promoção ou a fritadeira quebrou e não dá pra fazer pastel, mesmo tendo estoque = 100).
  - **Automação:** Se o número chegar a `0` usando o botão ou nas vendas pelas comandas, o toggle fica cinza (Esgotado) e **o produto some automaticamente do celular do cliente**. Se clicar em `[+]` para repor `1`, ele volta a ficar Disponível sozinho.
- **Filtros Inteligentes:** Todos | 🟡 Baixo (≤5) | 🔴 Esgotados | ∞ Ilimitados.

---

## 6. 📈 Relatórios (Owner only)

**Filtro de período:** [Hoje] [7 dias] [30 dias] [Personalizado]

**Cards:**
- 💰 Faturamento total: R$ X.XXX
- 🍽️ Total de pedidos: XXX
- 🪑 Mesas atendidas: XX
- ⏱️ Tempo médio de preparo: XX min

**Gráficos/Rankings:**
- 📊 **Top 10 mais vendidos** — ranking com barras horizontais
- ❤️ **Top 10 mais curtidos** — ranking com corações
- 📅 **Faturamento por dia** — gráfico de linha
- ⏰ **Horário de pico** — heatmap por hora
- 💳 **Métodos de pagamento** — pizza chart
- 🪑 **Pedidos por mesa** — ranking
- 📦 **Estoque baixo** — lista com alertas

---

## 7. 📱 QR Codes

**Layout:**
- Dropdown: selecionar mesa
- [Gerar QR Code]
- Preview do QR com URL: `https://seudominio.com/mesa/{numero}`
- [Download PNG] [Download SVG] [Imprimir]
- Botão: [Gerar Todos] → gera QR de todas as mesas em lote

---

## 8. 👥 Funcionários (Owner only)

**Lista:**
| Nome | Email | Role | Status | Ações |
|------|-------|------|--------|-------|
| Maria | maria@... | admin | ✅ Ativo | [Editar] [Desativar] |
| João | joao@... | admin | ❌ Inativo | [Editar] [Ativar] |

**Adicionar:** [+ Novo Funcionário]
- Nome, Email, Senha temporária
- Edge Function cria no Supabase Auth + staff table

---

## 9. ⚙️ Configurações (Owner only)

- **Nome do estabelecimento:** [________________]
- **Couvert artístico:**
  - Toggle: [✅ Ativado / ❌ Desativado]
  - Valor: R$ [10,00]
- **Logo:** [📷 Upload]
