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
- **Toggle on/off** → reflete em real-time no menu do cliente
- **Editar:** Nome, descrição, preço, imagem (upload Cloudinary), variantes, addons
- **Estoque:** Input numérico para ajustar (+/- ou valor absoluto)
- **Variantes:** Editar cada variant (nome, preço, toggle on/off) → some/aparece no cliente
- **Addons:** Editar cada addon (nome, preço, toggle on/off)
- **Tags:** Adicionar/remover tags (destaque, popular, novo)
- **Reordenar:** Drag das categorias e dos produtos dentro delas

**Modal de editar produto:**
```
┌────────────────────────────────────┐
│ Editar: Picanha na Chapa           │
│                                    │
│ Nome: [________________]           │
│ Descrição: [______________]        │
│ Categoria: [Pratos à la Carte ▼]   │
│ Imagem: [📷 Upload]  [Preview]     │
│                                    │
│ Variantes:                         │
│ ├─ Grande  R$ [175]  Serve [4] ✅  │
│ ├─ Média   R$ [125]  Serve [2] ✅  │
│ └─ [+ Adicionar variante]          │
│                                    │
│ Addons:                            │
│ ├─ Arroz   R$ [7]  Max [2] ✅      │
│ ├─ Farofa  R$ [5]  Max [1] ✅      │
│ └─ [+ Adicionar addon]             │
│                                    │
│ Estoque: [  15  ] [∞ Ilimitado]    │
│ Tags: [destaque ×] [+ Tag]         │
│ Tempo preparo: [ 25 ] min          │
│                                    │
│ [Cancelar]           [💾 Salvar]   │
└────────────────────────────────────┘
```

---

## 5. 📦 Estoque

**Layout: Tabela com filtros**

| Produto | Categoria | Estoque | Status | Ação |
|---------|-----------|---------|--------|------|
| Pastel Carne | Pastéis | 12 | 🟢 | [Ajustar] |
| Heineken 600 | Cerveja | 3 | 🟡 Baixo | [Ajustar] |
| Pastel Queijo | Pastéis | 0 | 🔴 Esgotado | [Repor] |

**Filtros:** Todos | 🟡 Baixo (≤5) | 🔴 Esgotado (0) | ∞ Ilimitado
**Ajustar:** Modal rápido com input numérico
**Badges visuais:** 🟢 ok (>5) | 🟡 baixo (1-5) | 🔴 esgotado (0)

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
