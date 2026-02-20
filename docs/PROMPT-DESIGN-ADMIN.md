# 🖥️ Prompt de Design UI — Telas Admin (Painel)

> Use este prompt em ferramentas de IA de design (v0, Lovable, Figma AI, Galileo, etc.)
> Cada seção = 1 prompt separado. Gere tela por tela.

---

## 🎨 Design System Admin (Incluir em TODOS os prompts)

```
DESIGN SYSTEM — "Seu Manel Bar" — Admin Panel

STYLE:
- Premium dark-mode dashboard for a bar/restaurant management system
- Inspired by modern SaaS dashboards (Linear, Vercel, Raycast) but with warmth
- Clean, professional, data-dense but not overwhelming

BACKGROUND:
- Primary: #0D0D0D (deep black)
- Secondary surfaces: #1A1A1A (cards, sidebar)
- Tertiary: #242424 (inputs, hover states)
- Subtle warm cream (#F5F0E8) used ONLY for small accents or premium touches

COLORS:
- Background: #0D0D0D
- Cards/Panels: #1A1A1A with 1px border #2A2A2A
- Accent Primary: #C4392D (deep red — CTAs, alerts, prices)
- Accent Warm: #D4A72C (gold/amber — warnings, stars, premium)
- Text Primary: #F5F0E8 (warm white/cream)
- Text Secondary: #8A8A8A (muted gray)
- Success: #2D7D46 (green — available, served, active)
- Warning: #D4A72C (amber — low stock, preparing)
- Error/Danger: #C4392D (red — out of stock, urgent)
- Info: #3B82F6 (blue — received, new)

TYPOGRAPHY:
- Headings: Sans-serif bold (Inter or DM Sans), warm white
- Body: Sans-serif regular, secondary gray
- Numbers/Metrics: Tabular numbers, slightly larger, mono-spaced feel
- Labels: Uppercase, small (11px), letter-spacing 1.5px, muted gray

COMPONENTS:
- Sidebar: Dark (#111111), fixed left, 240px wide, with logo top and nav items
- Cards: #1A1A1A, rounded 12px, subtle border, inner padding 24px
- Tables: Clean rows, alternating subtle backgrounds (#1A1A1A / #141414)
- Buttons Primary: Red accent (#C4392D), rounded 8px
- Buttons Secondary: Outlined, border #3A3A3A, text cream
- Toggle switches: Red when on, gray when off
- Badges/pills: Small rounded, colored background with matching text
- Inputs: #242424 background, 1px border #3A3A3A, cream text
- Modal: Dark overlay, card in center, #1A1A1A background

LAYOUT:
- Desktop-first (1440x900)
- Sidebar left (240px) + main content area
- Content uses a container with padding
- Grid-based card layouts for dashboards
- Tables for data-heavy views
```

---

## TELA 1: Login

```
PROMPT:

Design a desktop login page (1440x900) for a premium bar/restaurant admin panel called "Seu Manel".

Layout:
- Split screen layout:
  - Left half (50%): Dark background (#0D0D0D)
    - Centered vertically:
      - "SEU MANEL" logo/wordmark in serif font, cream color, large
      - Tagline below: "Painel Administrativo" in small uppercase, muted gray
    - Subtle vintage map texture overlay (very faint, cream tinted) for brand consistency
    - Maybe a faint cocktail glass or bar illustration in the background
  - Right half (50%): Slightly lighter dark (#1A1A1A)
    - Centered form card:
      - "Bem-vindo de volta" heading in cream
      - "Faça login para acessar o painel" subtitle in gray
      - Email input field (dark background, subtle border)
      - Password input field with eye toggle
      - "Entrar" button — accent red (#C4392D), full width, rounded
      - "Esqueci minha senha" link below in muted gray

Mood: Secure, professional, premium. Like logging into a VIP area.
```

---

## TELA 2: Dashboard (Visão Geral)

```
PROMPT:

Design a desktop dashboard screen (1440x900) for a bar/restaurant admin panel. Dark theme.

Layout:
- Left sidebar (240px): 
  - Top: "SEU MANEL" logo small, cream
  - Nav items with icons (cream text, red accent on active):
    📊 Dashboard (ACTIVE — red left border indicator)
    📋 Pedidos
    🪑 Mesas
    🍽️ Cardápio
    📦 Estoque
    📈 Relatórios
    📱 QR Codes
    👥 Equipe
    ⚙️ Configurações
  - Bottom: Admin avatar + name + "Owner" badge

- Main content:
  - Header: "Dashboard" heading + "Hoje, 19 Fev 2026" subtitle
  - 4 metric cards in a row:
    - 🪑 Mesas Ocupadas: "8/15" (cream number, large)
    - 📋 Pedidos Ativos: "12" (with blue badge "3 novos")
    - 💰 Faturamento Hoje: "R$ 3.847,00" (red accent)
    - 📦 Estoque Baixo: "4 itens" (amber warning)
  - Below cards, 2 columns:
    - Left (60%): "Últimos Pedidos" — small table with columns: Mesa, Cliente, Itens, Status (colored badges), Hora
    - Right (40%): "Alertas" — list with:
      - 🔔 "Mesa 07 quer fechar a comanda" (red)
      - ⚠️ "Heineken 600ml: estoque 2" (amber)
      - ✅ "Pedido #42 servido" (green)
  - Quick action buttons: [Abrir Kanban] [Ver Mesas] [Ajustar Estoque]

Mood: Command center. All essential info at a glance. Data-rich but clean.
```

---

## TELA 3: Kanban de Pedidos

```
PROMPT:

Design a desktop Kanban board (1440x900) for restaurant order management. Dark theme.

Layout:
- Left sidebar (same as dashboard)
- Nav: 📋 Pedidos is ACTIVE

- Main content:
  - Header: "Pedidos" heading + filter pills: "Todas as Mesas ▼" dropdown
  - 3 Kanban columns side by side:
  
  Column 1 — "📥 RECEBIDO" (blue header accent, badge count "3"):
    - Order card:
      - Dark card (#1A1A1A), rounded, subtle border
      - Top: "Mesa 03" bold + "14:32" timestamp right-aligned gray
      - Guest: "Alan" with small avatar/initial circle
      - Items: "2x Picanha na Chapa G" and "1x Heineken 600ml"
      - Notes: "Sem cebola" in italic gray
      - Bottom: Blue status pill "Recebido" + button "Preparar →"
    - Another order card below
    
  Column 2 — "🍳 PREPARANDO" (amber header accent, badge "2"):
    - Similar cards but with amber "Preparando" badge
    - One card with red time warning: "⏱️ 18min" (over 15min limit)
    - Button: "Servir →"
    
  Column 3 — "✅ SERVIDO" (green header accent, badge "5"):
    - Cards with green "Servido" badge
    - More compact, slightly faded
    - No action button needed

  - Cards should look draggable (subtle grab cursor hint)
  - Special alert banner at top: "🔔 Mesa 07 solicitou fechar a comanda" — red/amber background, dismiss button

Mood: Fast-paced kitchen command center. Clear visual hierarchy by status. Easy to drag and scan.
```

---

## TELA 4: Mapa de Mesas

```
PROMPT:

Design a desktop table management screen (1440x900) for a restaurant admin. Dark theme.

Layout:
- Left sidebar (same)
- Nav: 🪑 Mesas is ACTIVE

- Main content:
  - Header: "Mesas" heading + [+ Adicionar Mesa] button outlined
  - Visual grid of table cards (4-5 per row):
    Each table card (~160x140px):
    - Dark card (#1A1A1A) with colored top border:
      - 🟢 Green border = available
      - 🔴 Red border = occupied  
      - 🟡 Amber pulsing border = requesting close
    - Center: Large table number "03" in cream
    - Below number: Status text — "Livre" (green) or "2 pessoas" (cream) or "⚠️ Quer fechar" (amber)
    - If occupied: small text "Desde 14:20" in gray
    
  - Show mix: 5 available (green), 6 occupied (red), 1 requesting close (amber pulsing)
  - Right panel or modal when clicking occupied table:
    - Tab/comanda summary
    - Guest list with their orders
    - Total
    - Action buttons: [Ver Comanda] [Imprimir] [Fechar Mesa]

Mood: Visual overview like an air traffic controller. Instantly see which tables need attention.
```

---

## TELA 5: Gerenciamento do Cardápio

```
PROMPT:

Design a desktop menu management screen (1440x900) for a restaurant admin. Dark theme.

Layout:
- Left sidebar (same)
- Nav: 🍽️ Cardápio is ACTIVE

- Main content:
  - Header: "Cardápio" heading + [+ Novo Produto] red button + search input
  - Category accordion list:
    
    Category row (expanded):
    - "🥟 Pastéis" (7 produtos) — toggle switch ON (green) — [Editar] [↕ Arrastar]
    - Indented product table below:
      | Foto | Nome | Preço | Estoque | Disponível | Ações |
      | [thumb] | Pastel de Carne | R$ 30,00 | ∞ | Toggle ✅ | [Editar] |
      | [thumb] | Pastel de Queijo | R$ 30,00 | 0 🔴 | Toggle ❌ | [Editar] |
    
    Category row (collapsed):
    - "🍢 Espetinhos" (8 produtos) — toggle ON — chevron ›
    - "🍹 Drinks" (20 produtos) — toggle ON — chevron ›
    
  - Product edit modal (shown overlaying, or side panel):
    - Dark modal card, centered
    - Fields: Nome, Descrição, Categoria dropdown, Imagem upload zone
    - Variants section: list of name + price + serves + toggle, [+ Add variant]
    - Addons section: list of name + price + max qty + toggle, [+ Add addon]
    - Stock: number input with ∞ toggle
    - Tags: pill selector
    - Prep time: number input + "min"
    - [Cancelar] [Salvar] buttons

Mood: Content management system. Easy to scan categories, quickly toggle items on/off, manage everything.
```

---

## TELA 6: Estoque

```
PROMPT:

Design a desktop stock management screen (1440x900) for a restaurant admin. Dark theme.

Layout:
- Left sidebar (same)
- Nav: 📦 Estoque is ACTIVE

- Main content:
  - Header: "Estoque" heading
  - Filter tabs/pills: [Todos] [🟡 Baixo (4)] [🔴 Esgotado (2)] [∞ Ilimitado]
  - Data table:
    | Produto | Categoria | Estoque | Status | Ação |
    | Pastel de Carne | Pastéis | 12 | 🟢 OK | [Ajustar] |
    | Heineken 600ml | Cervejas | 3 | 🟡 Baixo | [Ajustar] |
    | Pastel de Queijo | Pastéis | 0 | 🔴 Esgotado | [Repor] |
    | Picanha na Chapa | Pratos | ∞ | ⚪ Ilimitado | — |
    
  - Table rows with alternating subtle backgrounds
  - Status badges: colored pills (green/amber/red/gray)
  - "Ajustar" opens inline or small modal: current stock display + input [−] value [+] + [Salvar]
  - Summary cards at top (optional): "12 itens OK" "4 estoque baixo" "2 esgotados"

Mood: Inventory control room. Clear, scannable, action-oriented.
```

---

## TELA 7: Relatórios / Métricas (Owner)

```
PROMPT:

Design a desktop analytics/reports screen (1440x900) for a restaurant admin. Dark theme.

Layout:
- Left sidebar (same)
- Nav: 📈 Relatórios is ACTIVE

- Main content:
  - Header: "Relatórios" heading + period filter pills: [Hoje] [7 dias] [30 dias] [Personalizado]
  - 4 metric cards top row:
    - 💰 Faturamento: "R$ 28.450,00" (large, red accent)
    - 🍽️ Total Pedidos: "347"
    - 🪑 Mesas Atendidas: "89"
    - ⏱️ Tempo Médio: "22 min"
  
  - Charts row (2 columns):
    - Left: "📊 Faturamento Diário" — line chart, area filled with gradient red, dates on X axis
    - Right: "💳 Métodos de Pagamento" — donut/pie chart: Pix (40%), Cartão (35%), Dinheiro (25%)
  
  - Rankings row (2 columns):
    - Left: "🏆 Top 10 Mais Vendidos" — horizontal bar chart
      - #1 Picanha na Chapa — 45 vendas — bar filled red
      - #2 Heineken 600ml — 38 — shorter bar
      - ...
    - Right: "❤️ Top 10 Mais Curtidos" — list with hearts
      - ❤️ 127 — Picanha na Chapa
      - ❤️ 89 — Gin Tônica
      - ...

Mood: Analytics dashboard. Data visualization is king. Charts should be beautiful and easy to read.
```

---

## TELA 8: Funcionários (Owner)

```
PROMPT:

Design a desktop staff management screen (1440x900) for a restaurant admin. Dark theme.

Layout:
- Left sidebar (same)
- Nav: 👥 Equipe is ACTIVE

- Main content:
  - Header: "Equipe" heading + [+ Novo Funcionário] red button
  - Staff cards in a grid (3 per row) or table:
    
    Card style:
    - Dark card (#1A1A1A), rounded
    - Avatar circle (placeholder or initials) at top
    - Name: "Maria Silva" bold cream
    - Email: "maria@seumanel.com" gray
    - Role badge: "Admin" amber pill or "Owner" red pill
    - Status: "✅ Ativo" green text or "❌ Inativo" gray text
    - Actions: [Editar] [Desativar] buttons at bottom

  - Add/Edit modal:
    - Fields: Nome, Email, Senha temporária (obscured)
    - Role selector: Owner / Admin radio buttons
    - [Cancelar] [Criar Funcionário] red button

Mood: Team management. Simple, clean, role-based access is clear.
```

---

## TELA 9: Comanda Aberta (Detalhe da Mesa)

```
PROMPT:

Design a desktop tab/check detail screen (1440x900) for a restaurant admin. Dark theme.

This screen shows when admin clicks on an occupied table to see the full bill/tab.

Layout:
- Left sidebar (same)
- Header: "Mesa 03 — Comanda #a7k2m9" + status pill "🟢 Aberta" + [Imprimir]

- Main content split:
  - Left (60%): Guest orders
    - Guest section: "👤 Alan"
      - Order items table: Nome | Qtd | Preço Unitário | Subtotal
      - "Picanha G + Arroz, Farofa" | 1 | R$ 187,00 | R$ 187,00
      - "Heineken 600ml" | 2 | R$ 17,00 | R$ 34,00
      - Subtotal Alan: R$ 221,00
    
    - Guest section: "👤 Helena"  
      - "Gin Tônica Importado" | 1 | R$ 27,00 | R$ 27,00
      - "Pudim" | 1 | R$ 10,00 | R$ 10,00
      - Subtotal Helena: R$ 37,00

  - Right (40%): Summary panel
    - Dark card with:
      - Subtotal: R$ 258,00
      - Couvert (2 pess.): R$ 20,00
      - TOTAL: R$ 278,00 (large, red)
      - Divider
      - "Fechar Comanda" section:
        - Payment type selector: [Total] [Individual] [Dividir Igual] [Parcial]
        - Payment method: [Pix] [Crédito] [Débito] [Dinheiro]
        - Amount input if partial
        - [Registrar Pagamento] red button
      - Already paid section (if partial payments made):
        - "Pago: R$ 37,00 (Helena — Pix)" green text
        - "Restante: R$ 241,00" cream text

Mood: Like a professional POS system. Clear breakdown, easy to split payments.
```

---

## Dica de Uso

> **Ordem recomendada de geração:**
> 1. Dashboard (tela 2) — define o layout base com sidebar
> 2. Kanban (tela 3) — tela mais complexa, define cards
> 3. Mesas (tela 4) — visual overlay
> 4. Cardápio (tela 5) — CRUD/management style
> 5. Relatórios (tela 7) — charts e métricas
> 6. Comanda (tela 9) — detalhes + pagamento
> 7. Estoque (tela 6)
> 8. Funcionários (tela 8)
> 9. Login (tela 1)
>
> **Cole o Design System Admin no início de cada prompt** para manter consistência.
