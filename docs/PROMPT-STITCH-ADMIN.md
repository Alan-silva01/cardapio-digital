# 🎨 Prompt para Google Stitch — Painel Admin "Seu Manel"

> Cole este prompt no Google Stitch para gerar o visual das telas do admin.

---

## PROMPT PRINCIPAL (Cole inteiro):

```
Build a premium restaurant admin dashboard called "Seu Manel" — a bar/restaurant management system.

DESIGN STYLE:
- EXACTLY like the Supabase Dashboard: ultra-clean, minimal, professional SaaS feel
- Use shadcn/ui components (Radix primitives), Lucide thin-stroke icons (16-20px, stroke 1.5)
- Support BOTH light and dark theme (CSS variables, toggle in settings)
- NO box-shadows anywhere — use only 1px borders for separation
- NO heavy gradients — flat colors only
- Transitions: duration-150ms, smooth and fast
- Font: Inter, sizes text-xs (12px) to text-sm (14px) for body, text-base for headings
- Spacing: compact (p-2, p-3, gap-2)
- Borders: 1px border-gray-200 (light) / border-gray-800 (dark), rounded-md (6px)
- Feel: dense but clean, data-rich but not overwhelming

COLOR TOKENS:
- Light theme: bg-white, cards bg-gray-50, text-gray-900, muted text-gray-500
- Dark theme: bg-[#0D0D0D], cards bg-[#1A1A1A], border-[#2A2A2A], text-[#F5F0E8]
- Accent Primary: #C4392D (deep red — CTAs, active states, prices, danger)
- Accent Warm: #D4A72C (gold/amber — warnings, stars, low stock)
- Success: #2D7D46 (green — available, served, active toggles)
- Info: #3B82F6 (blue — received orders, new items)

LAYOUT:
- Desktop-first (1440x900)
- Left sidebar: thin icon-only column (~50px) with Lucide icons, tooltip on hover showing label
- When an icon is clicked, a secondary context panel (~240px) can slide out with details
- Main content area fills remaining space
- Bottom of sidebar: user avatar circle + small role badge

SCREENS TO BUILD:

1. SIDEBAR NAVIGATION (always visible):
   Icons top-to-bottom:
   📊 Dashboard (/admin)
   📋 Orders/Kanban (/admin/pedidos)
   🪑 Tables (/admin/mesas)
   🗺️ Floor Plan (/admin/layout)
   🍽️ Menu (/admin/cardapio)
   📦 Stock (/admin/estoque)
   📈 Reports (/admin/relatorios) — owner only
   📱 QR Codes (/admin/qrcodes)
   👥 Staff (/admin/funcionarios) — owner only
   🕐 Hours (/admin/horarios) — owner only
   ⚙️ Settings (/admin/configuracoes) — owner only

2. DASHBOARD SCREEN:
   - Header: "Dashboard" + today's date
   - 4 metric cards in a row:
     • Tables Occupied: "8/15" (icon: armchair)
     • Active Orders: "12" with blue badge "3 new"
     • Revenue Today: "R$ 3.847,00" (red accent)
     • Low Stock: "4 items" (amber warning)
   - Below: 2 columns
     • Left (60%): "Recent Orders" — compact table (Mesa, Client, Items, Status badge, Time)
     • Right (40%): "Alerts" — list with colored indicators
   - Quick action buttons: [Open Kanban] [View Tables] [Adjust Stock]

3. KANBAN ORDERS SCREEN:
   - 4 columns side by side, each with colored header:
     • 📥 Received (blue) | 🍳 Preparing (amber) | ✅ Served (green) | 🏁 Done (gray)
   - Each column has a count badge
   - Order cards: dark card with table number, client name, items list, timestamp, elapsed time
   - Action button at bottom of each card: [Prepare →] [Serve →] [Complete →]
   - Cards should look draggable
   - Time warning badge (red ⏱️) on cards > 15 min in "Preparing"

4. STOCK CONTROL SCREEN:
   - Filter tabs: [All] [🟡 Low] [🔴 Out of Stock] [∞ Unlimited]
   - Summary cards at top: OK items, Low stock, Out of stock, Total
   - Data table with columns:
     • Small product thumbnail image (40x40px rounded)
     • Product name
     • Variation name
     • Category
     • Current Stock (number or ∞)
     • Status badge (green OK / amber Low / red Out / gray Unlimited)
     • Toggle switch for availability (red when ON, gray when OFF)
     • Price (R$)
     • Quick adjust: [-] [number] [+] inline buttons
   - Search input + category filter dropdown

5. MENU MANAGEMENT SCREEN:
   - Category accordion list, each with:
     • Category icon + name + product count + toggle ON/OFF + [Edit]
     • Expanded: product table with thumbnail, name, price range, stock, toggle, [Edit]
   - [+ New Product] red accent button top right
   - Product edit modal/panel with form fields:
     • Name, description, category dropdown, image upload
     • Variants section: rows of name + price + stock + toggle + [Remove]
     • Addons section: rows of name + price + max qty + toggle
     • [Cancel] [Save] buttons

6. SETTINGS SCREEN:
   - Tabs or sections:
     • General: name, logo upload
     • Appearance: theme toggle (light/dark/auto), font size (small/medium/large)
     • Notifications: sound toggle, alert toggles, time limit input
     • Financial: couvert toggle + value, service fee toggle + percentage, payment methods checkboxes
     • Security: change password form
   - Clean form layout, labels on left, inputs on right

Make ALL screens responsive within the desktop viewport. Use Tailwind CSS classes. Make it feel like a Supabase/Linear/Vercel dashboard — clean, fast, professional, with the warm accent of a premium bar.
```

---

## PROMPTS INDIVIDUAIS (se preferir gerar tela por tela):

### Tela 1: Dashboard
```
Design a dashboard screen for "Seu Manel" restaurant admin. Supabase-style, shadcn/ui, Lucide icons. Dark theme (#0D0D0D background). Left thin sidebar with icons. 4 metric cards (tables 8/15, orders 12, revenue R$3847, low stock 4). Recent orders table below left. Alerts list below right. Quick action buttons. Accent red #C4392D. Clean, no shadows, 1px borders only.
```

### Tela 2: Kanban
```
Design a Kanban board for restaurant orders. 4 columns: Received (blue), Preparing (amber), Served (green), Done (gray). Dark theme, shadcn/ui style. Order cards show: table number, client name, items, timestamp, elapsed time. Draggable feel. Action buttons per column. Time warning badge on slow orders. Supabase-clean aesthetic, Lucide icons, no shadows.
```

### Tela 3: Estoque
```
Design a stock control table for restaurant admin. Dark theme, shadcn/ui. Filter tabs (All, Low, Out, Unlimited). Summary cards at top. Table with: product thumbnail 40px, name, variation, category, stock number, status badge, toggle switch, price, quick [-][num][+] buttons. Search + filter. Supabase dashboard style, compact, data-dense.
```

### Tela 4: Cardápio CRUD
```
Design a menu management screen for restaurant admin. Dark theme, shadcn/ui. Category accordion with toggle on/off. Products list with thumbnail, name, price, stock, toggle. [+ New Product] button. Product edit modal with: name, description, category, image upload, variants table (name, price, stock, toggle), addons table. Supabase-style clean forms.
```

### Tela 5: Layout de Mesas (Planta Baixa)
```
Design a restaurant floor plan editor. Dark theme, shadcn/ui. 2D canvas with draggable table shapes (round, square, rectangular). Each table shows number and color-coded status: green=free, red=occupied, amber-pulsing=requesting close, blue=new order. Hover tooltip with details. Click opens side panel with tab/bill details. Supabase dashboard aesthetic.
```

### Tela 6: Configurações
```
Design a settings page for restaurant admin. Dark theme, shadcn/ui. Sections: General (name, logo), Appearance (theme light/dark/auto toggle, font size selector), Notifications (sound toggle, alert toggles), Financial (couvert toggle+value, service fee toggle+%, payment method checkboxes), Security (change password). Clean form layout. Supabase-style, Lucide icons, no shadows.
```
